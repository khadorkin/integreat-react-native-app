// @flow

import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'
import * as React from 'react'
import waitForExpect from 'wait-for-expect'
import { render } from '@testing-library/react-native'
import TestRenderer from 'react-test-renderer'
import typeof I18nProviderContainer from '../I18nProviderContainer'

jest.mock('@react-native-community/async-storage')
jest.mock('../../../i18n/LanguageDetector')

const mockStore = configureMockStore()

describe('I18nProviderContainer', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should pass props to inner component', () => {
    const I18nProviderMock = () => null
    jest.doMock('../../components/I18nProvider', () => I18nProviderMock)
    const I18nProviderContainerMock: I18nProviderContainer = require('../I18nProviderContainer').default

    const store = mockStore({})
    const rendered = TestRenderer.create(<Provider store={store}>
      <I18nProviderContainerMock />
    </Provider>)
    const props = rendered.root.findByType(I18nProviderMock).props
    expect(props).toEqual({
      setContentLanguage: expect.any(Function)
    })
  })

  it('should dispatch action when setting content language', () => {
    type MockPropsType = {
      children?: React.Node,
      setContentLanguage: (language: string) => void
    }

    class I18nProviderMock extends React.Component<MockPropsType> {
      componentWillMount () {
        this.props.setContentLanguage('ar')
      }

      render () {
        return null
      }
    }

    jest.doMock('../../components/I18nProvider', () => I18nProviderMock)
    const I18nProviderContainerMock: I18nProviderContainer = require('../I18nProviderContainer').default

    const store = mockStore({})
    render(<Provider store={store}>
      <I18nProviderContainerMock />
    </Provider>)

    expect(store.getActions()).toEqual([{
      params: {
        contentLanguage: 'ar'
      },
      type: 'SET_CONTENT_LANGUAGE'
    }])
  })

  it('should trigger actions without passing props explicitly', async () => {
    jest.dontMock('../../components/I18nProvider')
    const I18nProviderContainer = require('../I18nProviderContainer').default

    const store = mockStore({})
    render(
      <Provider store={store}>
        <I18nProviderContainer>
          <React.Fragment />
        </I18nProviderContainer>
      </Provider>
    )

    await waitForExpect(() => {
      expect(store.getActions()).toEqual([{
        type: 'SET_CONTENT_LANGUAGE',
        params: {
          contentLanguage: 'en'
        }
      }])
    })
  })
})
