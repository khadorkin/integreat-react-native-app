// @flow

import type { Saga } from 'redux-saga'
import { call, fork, put, takeLatest } from 'redux-saga/effects'
import 'reflect-metadata'
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
  CategoriesMapModel
} from '@integreat-app/integreat-api-client'
import downloadResources from './downloadResources'
import request from '../request'
import { Column, createConnection, Entity, PrimaryGeneratedColumn } from 'typeorm/browser'

@Entity()
class Category {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column('varchar', {length: 200})
  path: string

  @Column('varchar', {length: 200, nullable: true})
  thumbnail: string

  @Column('varchar', {length: 200})
  parentPath: string

  @Column('int')
  order: number
}

const databaseConnection = createConnection({
  type: 'react-native',
  database: 'test',
  location: 'default',
  // logging: ['error', 'query', 'schema'],
  synchronize: true,
  entities: [
    Category
  ]
})

const testDatabaseTypeORM = async categories => {
  const con = await databaseConnection
  const models = []

  for (let i = 0; i < 100; i++) {
    models.push(...categories.map(category => {
      const model = new Category()
      model.path = category.path
      model.thumbnail = category.thumbnail
      model.parentPath = category.parentPath
      model.order = category.order
      return model
    }))
  }

  const repository = con.getRepository(Category)

  let start = new Date().getTime()
  // console.time('typeorm insert')
  await repository.save(models)
  let end = new Date().getTime()
  console.log(`Inserted ${models.length} objects in ${end - start}`)
  // console.timeEnd('typeorm insert')

  start = new Date().getTime()
  const allPages = await repository.find()
  end = new Date().getTime()
  console.log(`Loaded ${allPages.length} objects in ${end - start}.`)
}

function * fetchCategories (city: string, code: string, urls: Set<string>): Saga<void> {
  const params = {
    city,
    language: code
  }

  const categoriesPayload = yield call(request.bind(null, categoriesEndpoint, params))
  const categoriesMap: CategoriesMapModel = categoriesEndpoint.mapResponse(categoriesPayload.data, params)
  const categories = categoriesMap.toArray()

  // parseCategories(categories).forEach(url => urls.add(url))

  yield call(testDatabaseTypeORM, categories)

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
    yield call(fetchCategories, city, prioritised, urls)
  }

  // const otherCodes = codes.filter(value => value !== prioritised)
  //
  // for (const code: string of otherCodes) {
  //   yield fork(fetchCategories, city, code, urls)
  // }

  return urls
}

function * fetchLanguageCodes (city: string): Saga<Array<string>> {
  try {
    const params = {city}

    const languagesPayload = yield call(() => request(languagesEndpoint, params))
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
    const prioritisedLanguage: string = action.params.prioritisedLanguage

    const codes = yield call(fetchLanguageCodes, city)
    const urls = yield call(fetchAllCategories, city, codes, prioritisedLanguage)

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
