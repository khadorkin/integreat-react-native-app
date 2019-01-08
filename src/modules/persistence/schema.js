// Look at the flow errors

import { appSchema, tableSchema } from '@nozbe/watermelondb/src/Schema'

const categoriesTable = tableSchema({
  name: 'categories',
  columns: [
    { name: 'id', type: 'number' },
    { name: 'url', type: 'string' },
    { name: 'path', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'modified_gmt', type: 'string' },
    { name: 'excerpt', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'parent_id', type: 'number' },
    { name: 'parent_url', type: 'string' },
    { name: 'order', type: 'number' },
    { name: 'thumbnail', type: 'string' },
    { name: 'hash', type: 'string' }
  ]
})

const availableLanguagesTable = tableSchema({
  name: 'availableLanguages',
  columns: [
    { name: 'id', type: 'number' },
    { name: 'code', type: 'string' },
    { name: 'url', type: 'string' },
    { name: 'category_id', type: 'string' } // foreign key to categories
  ]
})

export default appSchema({
  version: 1,
  tables: [
    categoriesTable,
    availableLanguagesTable
  ]
})
