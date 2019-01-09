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
  CategoriesMapModel
} from '@integreat-app/integreat-api-client'
import downloadResources from './downloadResources'
import request from '../request'
import findResources from '../findResources'
import SQLite from 'react-native-sqlite-storage'

const db = SQLite.openDatabase({
  name: 'test.db',
  location: 'default'
}, () => console.log('Success'), () => console.log('Failed'))

function * fetchCategories (city: string, code: string, urls: Set<string>): Saga<void> {
  const params = {
    city,
    language: code
  }

  const categoriesPayload = yield call(() => request(categoriesEndpoint, params))
  const categoriesMap: CategoriesMapModel = categoriesEndpoint.mapResponse(categoriesPayload.data, params)
  const categories = categoriesMap.toArray()

  findResources(categories).forEach(url => urls.add(url))
  console.log('insert startA')
  yield db.transaction(tx => {
    console.log('insert startB')
  //  tx.executeSql(```
  //  CREATE TABLE IF NOT EXISTS categories (
  //    ID int(11) unsigned NOT NULL auto_increment,
  //    path varchar(255) NOT NULL
  //  );
  //  ```, () => console.log('success'), e => console.log(e))

    const statements = [
      ['INSERT INTO categories VALUES (\'asdf\');']
    ]

    for (let i = 0; i < 1000; i++) {
      statements.push(['INSERT INTO categories VALUES (\'asdf\');'])
    }

    console.log('insert start')

    tx.sqlBatch(statements)

    console.timeEnd('insert')
  })

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
    yield fork(fetchCategories, city, prioritised, urls)
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
