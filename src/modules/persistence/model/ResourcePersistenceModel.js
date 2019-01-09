// @flow

import { associations, Model } from '@nozbe/watermelondb'
import { ResourceColumns, TableNames } from '../schema'
import { field } from '@nozbe/watermelondb/decorators'

export default class LanguagePersistenceModel extends Model {
  static table = TableNames.resource

  static associations = associations(
    [TableNames.category, {type: 'belongs_to', key: ResourceColumns.categoryId}]
  )

  @field(ResourceColumns.url) url: string
  @field(ResourceColumns.filePath) filePath: string
}
