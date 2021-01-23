import { StateNavigator } from 'navigation';
import * as React from 'react';

export type NavigationContextType = {
  oldState: any;
  state: any;
  data: object;
  nextState: any;
  nextData: object;
  asyncData?: any;
  stateNavigator: StateNavigator;
};

export default React.createContext<NavigationContextType>({
  oldState: null,
  state: null,
  data: {},
  nextState: null,
  nextData: {},
  stateNavigator: new StateNavigator(),
});
