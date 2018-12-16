// @flow

import type { Saga } from 'redux-saga'
import { call, fork, put, takeLatest } from 'redux-saga/effects'
import type {
  CategoriesFetchFailedActionType,
  CategoriesFetchPartiallySucceededActionType,
  CategoriesFetchSucceededActionType,
  FetchCategoriesRequestActionType,
  LanguagesFetchFailedActionType,
  LanguagesFetchSucceededActionType
} from '../../app/StoreActionType'
import {
  categoriesEndpoint,
  languagesEndpoint,
  LanguageModel,
  CategoriesMapModel,
  CategoryModel
} from '@integreat-app/integreat-api-client'
import htmlparser2 from 'htmlparser2'
import downloadResources from './downloadResources'
import getExtension from '../getExtension'
import request from '../request'
import Realm from 'realm'
import { appSchema, tableSchema, Database, Model } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/src/adapters/sqlite'

const parseCategories = categories => {
  const urls = new Set<string>()

  const onattribute = (name: string, value: string) => {
    if (name === 'href' || name === 'src') {
      if (['png', 'jpg', 'jpeg', 'pdf'].includes(getExtension(value))) {
        urls.add(value)
      }
    }
  }

  const parser = new htmlparser2.Parser({onattribute}, {decodeEntities: true})

  for (const category: CategoryModel of categories) {
    parser.write(category.content)

    if (category.thumbnail) {
      urls.add(category.thumbnail)
    }
  }

  parser.end()
  return urls
}

let realmPromise = null

const testDatabase = async categories => {
  if (!realmPromise) {
    realmPromise = Realm.open({
      schema: [{
        name: 'Page',
        properties: {
          id: 'int',
          // title: 'string',
          // content: 'string',
          // lastUpdate: 'date',
          // path: 'string',
          // thumbnail: 'string',
          // availableLanguages: 'string',
          // parentPath: 'string',
          // order: 'int'
        }
      }]
    })
  }

  await realmPromise.then(realm => {
    console.time('db')
    console.log(categories.length)
    realm.write(() => {
      categories.forEach(model => realm.create('Page', {id: 5}))
    })
    console.timeEnd('db')
    console.log(realm.objects('Page'))
  })
}

class Page extends Model {
  static table = 'pages'
}

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'pages',
      columns: [
        {name: 'a', type: 'number'}
      ]
    })
  ]
})

const adapter = new SQLiteAdapter({
  schema
})

const database = new Database({
  adapter,
  modelClasses: [
    Page
  ],
  actionsEnabled: true
})

const testDatabaseMelon = async categories => {
  console.time('db')
  await database.action(async () => {
    console.time('db')
    // await database.collections.get('pages').create(page => {
    //   page.a = 5
    // })
    const pages = database.collections.get('pages')
    console.log(categories.length)
    await database.batch(
      ...categories.map(model => pages.prepareCreate(page => {
        page.a = 5
      }))
    )
    console.timeEnd('db')
  })
}

function * fetchCategories (city: string, code: string, urls: Set<string>): Saga<void> {
  const params = {
    city,
    language: code
  }

  const categoriesPayload = yield call(request.bind(null, categoriesEndpoint, params))
  const categoriesMap: CategoriesMapModel = categoriesEndpoint.mapResponse(categoriesPayload.data, params)
  const categories = categoriesMap.toArray()

  parseCategories(categories).forEach(url => urls.add(url))

  yield call(testDatabaseMelon, categories)

  const partially: CategoriesFetchPartiallySucceededActionType = {
    type: `CATEGORIES_FETCH_PARTIALLY_SUCCEEDED`,
    payload: categoriesPayload,
    language: code,
    city: city
  }
  yield put(partially)
}

function * fetchAllCategories (city: string, codes: Array<string>, prioritised: string): Saga<Set<string>> {
  const urls = new Set<string>()

  if (codes.includes(prioritised)) {
    yield call(fetchCategories, city, prioritised, urls)
  }

  const otherCodes = codes.filter(value => value !== prioritised)

  for (const code: string of otherCodes) {
    yield fork(fetchCategories, city, code, urls)
  }

  return urls
}

function * fetchLanguageCodes (city: string): Saga<Array<string>> {
  try {
    const params = {city}

    const languagesPayload = yield call(request.bind(null, languagesEndpoint, params))
    const languageModels: Array<LanguageModel> = languagesEndpoint.mapResponse(languagesPayload.data, params)
    const codes = languageModels.map(model => model.code)
    const success: LanguagesFetchSucceededActionType = {
      type: 'LANGUAGES_FETCH_SUCCEEDED', payload: languagesPayload, city
    }
    yield put(success)
    return codes
  } catch (e) {
    const failed: LanguagesFetchFailedActionType = {type: `LANGUAGES_FETCH_FAILED`, city, message: e.message}
    yield put(failed)
    throw e
  }
}

function * fetch (action: FetchCategoriesRequestActionType): Saga<void> {
  const city: string = action.params.city

  try {
    const prioritised: string = action.params.prioritisedLanguage

    const codes = yield call(fetchLanguageCodes, city)
    const urls = yield call(fetchAllCategories, city, codes, prioritised)

    const success: CategoriesFetchSucceededActionType = {type: `CATEGORIES_FETCH_SUCCEEDED`, city}
    yield put(success)
    yield call(downloadResources, city, Array.from(urls))
  } catch (e) {
    const failed: CategoriesFetchFailedActionType = {type: `CATEGORIES_FETCH_FAILED`, city, message: e.message}
    yield put(failed)
  }
}

export default function * fetchSaga (): Saga<void> {
  yield takeLatest(`FETCH_CATEGORIES_REQUEST`, fetch)
}
