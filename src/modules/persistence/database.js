// @flow

import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import CategoryPersistenceModel from './model/CategoryPersistenceModel'
import LanguagePersistenceModel from './model/LanguagePersistenceModel'
import LanguageLinkPersistenceModel from './model/LanguageLinkPersistenceModel'
import CityPersistenceModel from './model/CityPersistenceModel'

const adapter = new SQLiteAdapter({
  schema
})

export const database = new Database({
  adapter,
  modelClasses: [
    CategoryPersistenceModel,
    LanguagePersistenceModel,
    LanguageLinkPersistenceModel,
    CityPersistenceModel
  ],
  actionsEnabled: true
})
