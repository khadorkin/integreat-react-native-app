// @flow

import { connect } from 'react-redux'
import type { Dispatch } from 'redux'
import type { StateType } from '../../../modules/app/StateType'
import type { StoreActionType } from '../../../modules/app/StoreActionType'
import ChangeLanguageModal from '../components/ChangeLanguageModal'
import { withTheme } from 'styled-components/native'
import { currentCityRouteSelector } from '../../../modules/common/selectors/currentCityRouteSelector'

const mapStateToProps = (state: StateType, ownProps) => {
  const route = currentCityRouteSelector(state, {routeKey: ownProps.navigation.getParam('routeKey')})
  const currentLanguage = route ? route.language : state.cityContent.language

  return {
    city: state.cityContent.city,
    currentLanguage,
    languages: state.cityContent.languages,
    availableLanguages: ownProps.navigation.getParam('availableLanguages'),
    closeModal: () => ownProps.navigation.goBack()
  }
}

const mapDispatchToProps = (dispatch: Dispatch<StoreActionType>) => {
  return {
    changeLanguage: (city: string, newLanguage: string) => dispatch({
      type: 'SWITCH_CONTENT_LANGUAGE',
      params: {
        city,
        newLanguage
      }
    })
  }
}

// $FlowFixMe
export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ChangeLanguageModal))
