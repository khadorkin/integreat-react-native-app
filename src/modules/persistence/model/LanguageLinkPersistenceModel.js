// @flow

import { Model, associations } from '@nozbe/watermelondb'
import { LanguageLinkColumns, TableNames } from '../schema'
import { field } from '@nozbe/watermelondb/decorators'

export default class LanguageLinkPersistenceModel extends Model {
  static table = TableNames.languageLink

  static associations = associations(
    [TableNames.category, {type: 'belongs_to', key: LanguageLinkColumns.categoryId}]
  )

  @field(LanguageLinkColumns.code) code: string
  @field(LanguageLinkColumns.path) path: string
}
