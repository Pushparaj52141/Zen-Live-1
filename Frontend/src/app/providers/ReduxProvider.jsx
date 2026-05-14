/**
 * Redux Provider
 * 
 * Wraps the entire app with Redux store
 */

import { Provider } from 'react-redux';
import { store } from '@app/store';

export const ReduxProvider = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
