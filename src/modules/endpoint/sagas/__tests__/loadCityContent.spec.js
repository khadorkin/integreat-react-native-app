// @flow

import DefaultDataContainer from '../../DefaultDataContainer'
import RNFetchBlob from '../../../../__mocks__/rn-fetch-blob'
import { expectSaga } from 'redux-saga-test-plan'
import loadCityContent from '../loadCityContent'
import AppSettings from '../../../settings/AppSettings'
import { ContentLoadCriterion } from '../../ContentLoadCriterion'
import type { DataContainer } from '../../DataContainer'
import CategoriesMapModelBuilder from '../../../../testing/builder/CategoriesMapModelBuilder'
import LanguageModelBuilder from '../../../../testing/builder/LanguageModelBuilder'
import CityModelBuilder from '../../../../testing/builder/CityModelBuilder'
import moment from 'moment-timezone'
import EventModelBuilder from '../../../../testing/builder/EventModelBuilder'
import AsyncStorage from '@react-native-community/async-storage'
import fetchResourceCache from '../fetchResourceCache'
import NetInfo from '@react-native-community/netinfo'

jest.mock('@react-native-community/async-storage')
jest.mock('@react-native-community/netinfo')
jest.mock('rn-fetch-blob')
jest.mock('../fetchResourceCache')
jest.mock('../loadCategories')
jest.mock('../loadEvents')
jest.mock('../loadCities')
jest.mock('../loadLanguages')

const prepareDataContainer = async (dataContainer: DataContainer, city: string, language: string) => {
  const categoriesBuilder = new CategoriesMapModelBuilder(city, language, 2, 2)
  const eventsBuilder = new EventModelBuilder('loadCityContent-events', 2, city, language)

  const categories = categoriesBuilder.build()
  const cities = new CityModelBuilder(1).build()
  const languages = new LanguageModelBuilder(2).build()
  const events = eventsBuilder.build()
  const resources = { ...categoriesBuilder.buildResources(), ...eventsBuilder.buildResources() }
  const fetchMap = { ...categoriesBuilder.buildFetchMap(), ...eventsBuilder.buildFetchMap() }

  await dataContainer.setEvents(city, language, events)
  await dataContainer.setCategoriesMap(city, language, categories)
  await dataContainer.setLanguages(city, languages)
  await dataContainer.setResourceCache(city, language, resources)
  await dataContainer.setCities(cities)

  return { languages, cities, categories, events, resources, fetchMap }
}

jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment-timezone')
  const mockActualTz = moment.tz
  moment.tz = jest.fn(mockActualTz)
  return moment
})

const mockTz = (mockDate: moment) => {
  const previous = moment.tz.getMockImplementation()
  moment.tz.mockImplementation(function (): moment {
    if (arguments.length <= 1) {
      return mockDate
    }

    return previous(...arguments)
  })

  return { restore: () => { moment.tz.mockImplementation(previous) } }
}

describe('loadCityContent', () => {
  const mockDate = jest.requireActual('moment')('2000-01-05T00:11:00.000Z')
  const lastUpdate = moment('2000-01-05T10:10:00.000Z')

  let restoreMoment

  beforeEach(async () => {
    RNFetchBlob.fs._reset()
    await AsyncStorage.clear()

    const { restore } = mockTz(mockDate)
    restoreMoment = restore
  })

  afterEach(async () => {
    restoreMoment()
  })

  const city = 'augsburg'
  const language = 'en'

  it('should set selected city when not peeking', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await new AppSettings().setSelectedCity('nuernberg')
    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    ).run()

    expect(await new AppSettings().loadSelectedCity()).toBe('augsburg')
    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should not set selected city when peeking', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await new AppSettings().setSelectedCity('nuernberg')
    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, true)
    ).run()

    expect(await new AppSettings().loadSelectedCity()).toBe('nuernberg')
    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should load languages when not peeking', async () => {
    const dataContainer = new DefaultDataContainer()
    const { languages } = await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    )
      .put({ type: 'PUSH_LANGUAGES', params: { languages } })
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should not load languages when peeking', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, true)
    )
      .not.put.like({ action: { type: 'PUSH_LANGUAGES' } })
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should return false if language does not exist', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, '??', new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    )
      .returns(false)
      .run()

    const lastUpdateAfterLoading: moment = await dataContainer.getLastUpdate(city, language)

    expect(lastUpdateAfterLoading.isSame(lastUpdate)).toBe(true)
    expect(lastUpdateAfterLoading.isSame(mockDate)).toBe(false)
  })

  it('should return true if language does exist', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    )
      .returns(true)
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should fetch resources when requested and connection type is not cellular', async () => {
    const dataContainer = new DefaultDataContainer()
    const { fetchMap } = await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    )
      .call(fetchResourceCache, city, language, fetchMap, dataContainer)
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should not fetch resources when not requested and connection type is not cellular', async () => {
    const dataContainer = new DefaultDataContainer()
    const { fetchMap } = await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: false
      }, false)
    )
      .not.call(fetchResourceCache, city, language, fetchMap, dataContainer)
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
  })

  it('should not fetch resources if connection type is cellular', async () => {
    const previous = NetInfo.fetch.getMockImplementation()
    NetInfo.fetch.mockImplementation(() => {
      return {
        type: 'cellular',
        isConnected: true,
        isInternetReachable: true,
        details: {
          isConnectionExpensive: false
        }
      }
    })
    const dataContainer = new DefaultDataContainer()
    const { fetchMap } = await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, lastUpdate)

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: true
      }, false)
    )
      .not.call(fetchResourceCache, city, language, fetchMap, dataContainer)
      .run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(lastUpdate)
    NetInfo.fetch.mockImplementation(previous)
  })

  it('should update if last update was a long time ago', async () => {
    const dataContainer = new DefaultDataContainer()
    await prepareDataContainer(dataContainer, city, language)

    await dataContainer.setLastUpdate(city, language, moment.unix(0))

    await expectSaga(loadCityContent,
      dataContainer, city, language, new ContentLoadCriterion({
        forceUpdate: false,
        shouldRefreshResources: false
      }, false)
    ).run()

    expect(await dataContainer.getLastUpdate(city, language)).toBe(mockDate)
  })
})
