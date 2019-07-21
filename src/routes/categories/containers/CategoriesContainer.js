// @flow

import { connect } from 'react-redux'
import type { LanguageResourceCacheStateType, StateType } from '../../../modules/app/StateType'
import { type Dispatch } from 'redux'
import CategoriesRouteStateView from '../../../modules/app/CategoriesRouteStateView'
import type { StoreActionType, SwitchContentLanguageActionType } from '../../../modules/app/StoreActionType'
import createNavigateToCategory from '../../../modules/app/createNavigateToCategory'
import createNavigateToIntegreatUrl from '../../../modules/app/createNavigateToIntegreatUrl'
import type { NavigationScreenProp } from 'react-navigation'
import type { StatusPropsType } from '../../../modules/error/hocs/withError'
import withError from '../../../modules/error/hocs/withError'
import { CityModel } from '@integreat-app/integreat-api-client'
import withTheme from '../../../modules/theme/hocs/withTheme'
import { translate } from 'react-i18next'
import withRouteCleaner from '../../../modules/endpoint/hocs/withRouteCleaner'
import Categories from '../../../modules/categories/components/Categories'
import React from 'react'

type ContainerPropsType = {|
  navigation: NavigationScreenProp<*>,
  cities: Array<CityModel>,
  cityCode: string,
  language: string,
  stateView: CategoriesRouteStateView,
  resourceCache: LanguageResourceCacheStateType,
  dispatch: Dispatch<StoreActionType>
|}

type RefreshPropsType = {|
  cityCode: string,
  language: string,
  path: string,
  navigation: NavigationScreenProp<*>
|}

type OwnPropsType = {| navigation: NavigationScreenProp<*> |}
type StatePropsType = StatusPropsType<ContainerPropsType, RefreshPropsType>
type DispatchPropsType = {| dispatch: Dispatch<StoreActionType> |}
type PropsType = {| ...OwnPropsType, ...StatePropsType, ...DispatchPropsType |}

const createChangeUnavailableLanguage = (path: string) => (
  dispatch: Dispatch<StoreActionType>, navigation: NavigationScreenProp<*>, city: string, newLanguage: string
) => {
  const switchContentLanguage: SwitchContentLanguageActionType = {
    type: 'SWITCH_CONTENT_LANGUAGE',
    params: {
      city,
      newLanguage
    }
  }
  dispatch(switchContentLanguage)
  const navigateToCategory = createNavigateToCategory('Categories', dispatch, navigation)
  navigateToCategory({
    cityCode: city,
    language: newLanguage,
    path,
    forceUpdate: false,
    key: navigation.getParam('key')
  })
}

const mapStateToProps = (state: StateType, ownProps: OwnPropsType): StatePropsType => {
  if (!state.cityContent) {
    return { status: 'routeNotInitialized' }
  }

  const { resourceCache, categoriesRouteMapping, city, switchingLanguage } = state.cityContent
  const globalLanguage = state.contentLanguage
  if (state.cities.errorMessage !== undefined ||
    categoriesRouteMapping.errorMessage !== undefined ||
    resourceCache.errorMessage !== undefined) {
    return {
      status: 'error',
      refreshProps: { cityCode: city, language: globalLanguage, path: '/', navigation: ownProps.navigation }
    } // todo: refProps
  }

  const cities = state.cities.models
  const route = categoriesRouteMapping[ownProps.navigation.getParam('key')]

  if (!route) {
    return { status: 'routeNotInitialized' }
  }

  if (route.loading || switchingLanguage || !cities) {
    return { status: 'loading' }
  }

  const languages = Array.from(route.allAvailableLanguages.keys())
  const stateView = new CategoriesRouteStateView(route.root, route.models, route.children)
  const refreshProps = {
    cityCode: city, language: route.language, path: route.root, navigation: ownProps.navigation
  }
  if (!languages.includes(route.language)) {
    return {
      status: 'languageNotAvailable',
      availableLanguages: languages,
      cityCode: city,
      refreshProps,
      changeUnavailableLanguage: createChangeUnavailableLanguage(route.root)
    }
  }

  return {
    status: 'success',
    refreshProps,
    innerProps: {
      cityCode: city,
      language: route.language,
      cities,
      stateView,
      resourceCache,
      navigation: ownProps.navigation
    }
  }
}

const mapDispatchToProps = (dispatch: Dispatch<StoreActionType>): DispatchPropsType => ({ dispatch })

const refresh = (refreshProps: RefreshPropsType, dispatch: Dispatch<StoreActionType>) => {
  const { cityCode, language, path, navigation } = refreshProps
  const navigateToCategories = createNavigateToCategory('Categories', dispatch, navigation)
  navigateToCategories({
    cityCode, language, path, forceUpdate: true, key: navigation.getParam('key')
  })
}

class CategoriesContainer extends React.Component<ContainerPropsType> {
  render () {
    const { cities, language, stateView, cityCode, navigation, resourceCache, dispatch } = this.props
    return <ThemedTranslatedCategories cities={cities} language={language} stateView={stateView} cityCode={cityCode}
                                       navigateToCategory={createNavigateToCategory('Categories', dispatch, navigation)}
                                       navigateToIntegreatUrl={createNavigateToIntegreatUrl(dispatch, navigation)}
                                       navigation={navigation}
                                       resourceCache={resourceCache} />
  }
}

const ThemedTranslatedCategories = withTheme(props => props.language)(
  translate('categories')(
    Categories
  ))

export default withRouteCleaner<PropsType>(
  connect<PropsType, OwnPropsType, _, _, _, _>(mapStateToProps, mapDispatchToProps)(
    withError<ContainerPropsType, RefreshPropsType>(refresh)(
      CategoriesContainer
    )))
