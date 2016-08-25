// import mocker from '../lib/hapi-mocker';
// import callList from './calls/list';
// import callDetails from './calls/details';
// import partnerList from './partners/list';
// import partnerDetails from './partners/details';
const env = process.env.NODE_ENV;

export default (server) => {
  if (env === 'development') {
    // Calls mocking
    // server.route(callList(mocker));
    // server.route(callDetails(mocker));
    // Partners mocking
    // server.route(partnerList(mocker));
    // server.route(partnerDetails(mocker));
  }
};
