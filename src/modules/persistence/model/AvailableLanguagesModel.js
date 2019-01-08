// @flow

import { Model } from '@nozbe/watermelondb'

export default class AvailableLanguagesModel extends Model {
  static table = 'categories'
  static associations = {
    categories: {type: 'belongs_to', foreign_key: 'category_id'}
  }
}
