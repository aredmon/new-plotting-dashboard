import { __, isEmpty, find, whereEq } from 'ramda';
import { Map as map, fromJS } from 'immutable';

const GetHandler = (mockFilePath, customHandler) =>
  (request, reply) => {
    const mockData = require(mockFilePath);
    let handlerOptions = fromJS({
      response: mockData,
      code: 200
    });
    const {
      payload = {},
      params = {},
      path
    } = request;
    if (customHandler) {
      const customHandlerData = fromJS(customHandler(mockData, payload, params, path));
      if (map.isMap(customHandlerData) && customHandlerData.has('response')) {
        handlerOptions = handlerOptions.merge(customHandlerData);
      } else {
        handlerOptions = handlerOptions.set('response', customHandlerData);
      }
    } else if (!isEmpty(params)) {
      const item = find(mockData, whereEq(__, params));
      if (item) {
        handlerOptions = handlerOptions.set('response', fromJS(item));
      } else {
        handlerOptions = handlerOptions
          .set('code', 404)
          .set('response', 'item not found in mock data');
      }
    }
    const { response, code } = handlerOptions.toJS();
    return reply(response).code(code);
  };

module.exports = GetHandler;
