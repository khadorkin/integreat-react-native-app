// @flow

import { Model } from '@nozbe/watermelondb'
import { field, children } from '@nozbe/watermelondb/decorators'

export default class CategoriesModel extends Model {
  static table = 'categories'
  static associations = {
    availableLanguages: { type: 'has_many', foreign_key: 'category_id' }
  }

  @field('id') id
  @field('url') url
  @field('path') path
  @field('title') title
  @field('modified_gmt') modifiedGmt
  @field('excerpt') excerpt
  @field('content') content
  @field('parent_id') parentId
  @field('parent_url') parentUrl
  @field('order') order
  @field('thumbnail') thumbnail
  @field('hash') hash

  @children('availableLanguages') parentId
}
