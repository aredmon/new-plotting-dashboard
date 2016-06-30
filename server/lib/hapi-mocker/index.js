import fs from 'fs';
import {
  is,
  keys,
  filter,
  equals,
  toLower,
  map,
  intersection,
  indexOf
} from 'ramda';
const {
  getHandler,
  postHandler,
  putHandler,
  deleteHandler,
  notImplementedHandler
} = require('./handlers');

const methodHandlers = {
  'get': getHandler,
  'post': postHandler,
  'put': putHandler,
  'delete': deleteHandler
};
const methods = keys(methodHandlers);

const getSupportedMethods = (methods, method) => {
  if (equals('*', method)) {
    return methods;
  }
  if (is(String, method)) {
    return filter(equals(toLower(method)), methods);
  }
  return intersection(map(toLower, method), methods);
};

const isMethodSupported = (supportedMethods, method) => !equals(-1, indexOf(method, supportedMethods));

const HapiMocker = (config) => {
  const {
    mockFile: mockFilePath,
    seed,
    method,
    handlers: transforms = {}
  } = config;

  if (!mockFilePath || !method) {
    throw Error('Both "mockFile" and "method" are required configuration properties.');
  }

  const seedData = require(mockFilePath);
  const mockFileWritePath = `${mockFilePath.slice(0, -5)}.temp.json`;

  const seedFile = (path, data) => {
    fs.writeFile(path, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.log(`Unable to seed ${path}: ${err}`);
      }
      console.log(`Successfully seeded ${path}`);
    });
  };

  if (seed) {
    // if seed is true, always seed the mock file write path
    seedFile(mockFileWritePath, seedData);
  } else {
    try {
      // check to see if mock file write path exists
      fs.accessSync(mockFileWritePath, fs.F_OK);
    } catch (e) {
      // if it doesn't create the initial file with seed data
      seedFile(mockFileWritePath, seedData);
    }
  }

  const supportedMethods = getSupportedMethods(methods, method);

  const mockHandler = (request, reply) => {
    const {
      method: requestMethod
    } = request;
    let transformMethod = transforms[requestMethod];

    const methodSupported = isMethodSupported(supportedMethods, requestMethod);
    if (!methodSupported) {
      return notImplementedHandler(request, reply);
    }
    const methodHandler = methodHandlers[requestMethod];
    const requestHandler = methodHandler(mockFileWritePath, transformMethod);
    return requestHandler(request, reply);
  };

  return mockHandler;
};

module.exports = HapiMocker;
