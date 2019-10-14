// @flow

import type { FetchResultType, TargetFilePathsType } from '../FetcherModule'
import { NativeEventEmitter } from 'react-native'
import moment from 'moment-timezone'

function mockFetchAsync (targetFilePaths: TargetFilePathsType): Promise<FetchResultType> {
  const fetchResult: FetchResultType = {}
  for (const path in targetFilePaths) {
    fetchResult[path] = {
      lastUpdate: moment.tz('20110204', 'UTC').toISOString(),
      url: targetFilePaths[path],
      errorMessage: null
    }
  }
  return Promise.resolve(fetchResult)
}

const NativeFetcherModule = {
  addListener: jest.fn<[string], void>(),
  removeListeners: jest.fn<[number], void>(),
  fetchAsync: jest.fn<[TargetFilePathsType], Promise<FetchResultType>>(mockFetchAsync)
}

export const NativeFetcherModuleEmitter = new NativeEventEmitter(NativeFetcherModule)

export default NativeFetcherModule
