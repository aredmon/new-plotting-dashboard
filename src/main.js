import React from 'react';
import ReactDOM from 'react-dom';
import { useRouterHistory } from 'react-router';
import { createHistory } from 'history';
import makeRoutes from './routes';
import Root from './containers/Root';
import configureStore from './redux/configureStore';
import injectTapEventPlugin from 'react-tap-event-plugin';
// import io from 'socket.io-client';
// import { setCalls, setCall } from './redux/modules/calls';
// import { setPartners } from './redux/modules/partners';
// import { fromPairs, map, assoc, toPairs } from 'ramda';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

// const mapIdToObj = (obj) =>
//   fromPairs(map(([key, val]) => [key, assoc('id', key, val)], toPairs(obj)));

const historyConfig = { basename: __BASENAME__ };
const history = useRouterHistory(createHistory)(historyConfig);

const initialState = window.__INITIAL_STATE__;
const store = configureStore({ initialState, history });

// setup the web socket connection
// const socket = io(__API_URL__ || 'http://mmd-api.herokuapp.com');
// socket.on('connect', () => {
//   socket.emit('authentication', {
//     uid: 'U2FsdGVkX19XnKPJoDjrEfPMrRekw3myagMATsLb8tUA9nctB9DwbSzji6i5hHPe',
//     token: 'U2FsdGVkX18rfBO1qs4LM04Ha6LLX7J4ySFchHE8l+ClwN9ndP/vSR1SAXQrTykQ'
//   });
// });
// socket.on('authenticated', () => {
//   console.log('socket user authenticated!');
// });
// socket.on('unauthorized', ({ message }) => {
//   console.error('socket user authentication error!', message);
// });
// socket.on('state', (state) => {
//   store.dispatch(setCalls(mapIdToObj(state.calls)));
//   store.dispatch(setPartners(mapIdToObj(state.partners)));
// });
// socket.on('SET_CALL', (callObj) =>
//   store.dispatch(setCall(callObj))
// );

const routes = makeRoutes(store);

// Render the React application to the DOM
ReactDOM.render(
  <Root history={history} routes={routes} store={store} />,
  document.getElementById('root')
);
