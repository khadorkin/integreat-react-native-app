// @flow

import { appSchema, tableSchema, tableName, type ColumnName } from '@nozbe/watermelondb'
import type CategoryPersistenceModel from './model/CategoryPersistenceModel'
import type LanguageLinkPersistenceModel from './model/LanguageLinkPersistenceModel'
import type { TableName } from '@nozbe/watermelondb'
import { columnName } from '@nozbe/watermelondb/Schema'
import type LanguagePersistenceModel from './model/LanguagePersistenceModel'
import type CityPersistenceModel from './model/CityPersistenceModel'
import type ResourcePersistenceModel from './model/ResourcePersistenceModel'

export const TableNames = {
  category: (tableName('category'): TableName<CategoryPersistenceModel>),
  languageLink: (tableName('language_link'): TableName<LanguageLinkPersistenceModel>),
  language: (tableName('language'): TableName<LanguagePersistenceModel>),
  city: (tableName('city'): TableName<CityPersistenceModel>),
  resource: (tableName('resource'): TableName<ResourcePersistenceModel>)
}

export const ColumnNames = {
  category: {
    path: columnName('path'),
    title: columnName('title'),
    lastUpdated: columnName('last_updated_at'),
    content: columnName('content'),
    parentPath: columnName('parent_path'),
    order: columnName('order'),
    thumbnail: columnName('thumbnail'),
    hash: columnName('hash')
  },
  languageLink: {
    code: columnName('code'),
    path: columnName('path'),
    categoryId: columnName('category_id')
  },
  language: ({
    code: columnName('code'),
    name: columnName('name')
  }: {| code: ColumnName, name: ColumnName |}),
  city: {
    name: columnName('name'),
    code: columnName('code'),
    live: columnName('live'),
    eventsEnabled: columnName('events_enabled'),
    extrasEnabled: columnName('extras_enabled'),
    sortingName: columnName('sorting_name')
  },
  resource: {
    url: columnName('url'),
    filePath: columnName('file_path'),
    categoryId: columnName('category_id')
  }
}

export const CategoryColumns = ColumnNames.category
export const LanguageLinkColumns = ColumnNames.languageLink
export const LanguageColumns = ColumnNames.language
export const CityColumns = ColumnNames.city
export const ResourceColumns = ColumnNames.resource

const categoriesTable = tableSchema({
  name: TableNames.category,
  columns: [
    {name: CategoryColumns.path, type: 'string'},
    {name: CategoryColumns.title, type: 'string'},
    {name: CategoryColumns.lastUpdated, type: 'number'},
    {name: CategoryColumns.content, type: 'string'},
    {name: CategoryColumns.parentPath, type: 'string'},
    {name: CategoryColumns.order, type: 'number'},
    {name: CategoryColumns.thumbnail, type: 'string'},
    {name: CategoryColumns.hash, type: 'string'}
  ]
})

const languageLinkTable = tableSchema({
  name: TableNames.languageLink,
  columns: [
    {name: LanguageLinkColumns.code, type: 'string'},
    {name: LanguageLinkColumns.path, type: 'string'},
    {name: LanguageLinkColumns.categoryId, type: 'string'}
  ]
})

const languageTable = tableSchema({
  name: TableNames.languageLink,
  columns: [
    {name: LanguageColumns.code, type: 'string'},
    {name: LanguageColumns.name, type: 'string'}
  ]
})

const cityTable = tableSchema({
  name: TableNames.city,
  columns: [
    {name: CityColumns.name, type: 'string'},
    {name: CityColumns.code, type: 'string'},
    {name: CityColumns.live, type: 'boolean'},
    {name: CityColumns.eventsEnabled, type: 'boolean'},
    {name: CityColumns.extrasEnabled, type: 'boolean'},
    {name: CityColumns.sortingName, type: 'string'}
  ]
})

const resourceTable = tableSchema({
  name: TableNames.resource,
  columns: [
    {name: ResourceColumns.url, type: 'string'},
    {name: CityColumns.code, type: 'string'},
    {name: CityColumns.live, type: 'boolean'},
    {name: CityColumns.eventsEnabled, type: 'boolean'},
    {name: CityColumns.extrasEnabled, type: 'boolean'},
    {name: CityColumns.sortingName, type: 'string'}
  ]
})

export default appSchema({
  version: 1,
  tables: [
    categoriesTable,
    languageLinkTable,
    languageTable,
    cityTable,
    resourceTable
  ]
})
