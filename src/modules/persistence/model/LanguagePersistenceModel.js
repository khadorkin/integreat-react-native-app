// @flow

import { Model } from '@nozbe/watermelondb'
import { LanguageColumns, TableNames } from '../schema'
import { field } from '@nozbe/watermelondb/decorators'

export default class LanguagePersistenceModel extends Model {
  static table = TableNames.languageLink

  @field(LanguageColumns.code) code: string
  @field(LanguageColumns.name) name: string
}
