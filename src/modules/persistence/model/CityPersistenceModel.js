// @flow

import { Model } from '@nozbe/watermelondb'
import { CityColumns, TableNames } from '../schema'
import { field } from '@nozbe/watermelondb/decorators'

export default class CityPersistenceModel extends Model {
  static table = TableNames.city

  @field(CityColumns.name) code: string
  @field(CityColumns.code)code: string
  @field(CityColumns.live) live: boolean
  @field(CityColumns.eventsEnabled) eventsEnabled: boolean
  @field(CityColumns.extrasEnabled) extrasEnabled: boolean
  @field(CityColumns.sortingName) sortingName: string
}
