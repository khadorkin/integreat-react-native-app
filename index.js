if (typeof global.self === 'undefined') {
  global.self = global
}

// import 'core-js/es6/symbol'
// import 'react-native-console-time-polyfill'
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import { AppRegistry } from 'react-native'
import App from './src/modules/app/components/App'
import 'moment/locale/de' // fixme

// @see: https://github.com/facebook/react-native/issues/9599
if (typeof global.self === 'undefined') {
  global.self = global
}

AppRegistry.registerComponent('Integreat', () => App)
