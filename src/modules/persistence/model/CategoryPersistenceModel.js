// @flow

import { Model, associations, Query } from '@nozbe/watermelondb'
import { field, children, date } from '@nozbe/watermelondb/decorators'
import { CategoryModel } from '@integreat-app/integreat-api-client'
import LanguageLinkPersistenceModel from './LanguageLinkPersistenceModel'
import { CategoryColumns, ColumnNames, TableNames } from '../schema'

export default class CategoryPersistenceModel extends Model {
  static table = TableNames.category

  static associations = associations(
    [TableNames.languageLink, {type: 'has_many', foreignKey: ColumnNames.languageLink.categoryId}]
  )

  @field(CategoryColumns.title) title: string
  @field(CategoryColumns.content) content: string
  @date(CategoryColumns.lastUpdated) lastUpdated: Date
  @field(CategoryColumns.path) path: string
  @field(CategoryColumns.thumbnail) thumbnail: string
  @children(TableNames.languageLink) languageLinks: Query<LanguageLinkPersistenceModel>
  @field(CategoryColumns.parentPath) parentPath: string
  @field(CategoryColumns.order) order: number
  @field(CategoryColumns.hash) hash: string

  populate (model: CategoryModel) {
    this.title = model.title
    this.content = model.content
    this.lastUpdated = model.lastUpdate.toDate()
    this.path = model.path
    this.thumbnail = model.thumbnail
    // this.languageLinks = model.availableLanguages
    this.parentPath = model.parentPath
    this.order = model.order
    this.hash = model.hash
  }
}
