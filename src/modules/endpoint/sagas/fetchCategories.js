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
// import { database } from '../../persistence/database'
// import { TableNames } from '../../persistence/schema'
// import CategoryPersistenceModel from '../../persistence/model/CategoryPersistenceModel'
self = {fetch: () => {}}
import Realm from 'realm'

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

// const testDatabaseMelon = async categories => {
//   await database.action(async () => {
//     console.time('db')
//     const categoriesCollection = database.collections.get(TableNames.category)
//
//     const preparedStatement = categories.map(model => categoriesCollection
//       .prepareCreate((page: CategoryPersistenceModel) => {
//         page.populate(model)
//       }))
//     await database.batch(...preparedStatement)
//     console.timeEnd('db')
//   })
// }

let realmPromise = Realm.open({
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

const testDatabaseRealm = async categories => {
  console.log(`testDatabaseRealm`)
  await realmPromise.then(realm => {
    console.log(categories.length)

    // categories.forEach(model => {
    //   realm.write(() => {
    //     realm.create('Page', {id: 5})
    //   })
    // })

    // const t0 = performance.now()
    console.time('realm insert')

    const start = new Date().getTime()

    realm.write(() => {
      categories.forEach(model => realm.create('Page', {id: 5}))
    })
    // console.timeEnd('realm insert')
    const end = new Date().getTime()
    const time = end - start
    alert(`Execution time: ${time}`)
    // const t1 = performance.now()
    // console.log(`Call to realm took ${  t1 - t0  } milliseconds.`)
    console.log(realm.objects('Page'))
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

  yield call(testDatabaseRealm, categories)
  // yield call(testDatabaseMelon, categories)

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
    console.trace(e)
    yield put(failed)
    console.log(`Erro58:${e.message}`)
    throw e
  }
}

function * fetcha (action: FetchCategoriesRequestActionType): Saga<void> {
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
    console.trace(e)
    console.log(`Erro58:${e.message}`)
    yield put(failed)
  }
}

export default function * fetchSaga (): Saga<void> {
  yield takeLatest(`FETCH_CATEGORIES_REQUEST`, fetcha)
}
