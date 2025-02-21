// @flow

import { translate } from 'react-i18next'
import withTheme from '../../theme/hocs/withTheme'
import Failure from '../components/Failure'

export default withTheme()(translate('error')(Failure))
