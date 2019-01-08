// @flow

import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import CategoriesModel from './model/CategoriesModel'

const adapter = new SQLiteAdapter({
  schema
})

const database = new Database({
  adapter,
  modelClasses: [
    CategoriesModel
  ],
  actionsEnabled: true
})
