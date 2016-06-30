import { whereEq } from 'ramda';
import fs from 'fs';
import { Map as map, List as list, fromJS } from 'immutable';

const DeleteHandler = (mockFilePath, customHandler) =>
  (request, reply) => {
    const mockData = require(mockFilePath);
    const {
      payload = {},
      params = {}
    } = request;

    let handlerOptions = fromJS({
      response: mockData,
      code: 200,
      data: mockData
    });

    if (customHandler) {
      const customHandlerData = fromJS(customHandler(mockData, payload, params));
      if (map.isMap(customHandlerData) && customHandlerData.has('data')) {
        handlerOptions = handlerOptions.merge(customHandlerData);
      } else {
        handlerOptions = handlerOptions
          .set('response', customHandlerData)
          .set('data', customHandlerData);
      }
    } else if (!list.isList(handlerOptions.get('data'))) {
      handlerOptions = handlerOptions
        .set('code', 500)
        .set('response', 'mock data is not an array and no handler was provided');
    } else {
      const index = handlerOptions
        .get('data')
        .findIndex((item) => whereEq(params, item.toJS()));
      if (index === -1) {
        handlerOptions = handlerOptions
          .set('code', 404)
          .set('response', 'item not found in mock data');
      } else {
        const newData = handlerOptions.get('data').delete(index);
        handlerOptions = handlerOptions
          .set('data', newData)
          .set('response', newData);
      }
    }
    const { data, response, code } = handlerOptions.toJS();
    fs.writeFile(
      mockFilePath,
      JSON.stringify(data, null, 2),
      (err) => {
        if (err) {
          console.log(err);
          return reply('unable to process mock DELETE: file write error').code(500);
        }
        console.log(`writing to ${mockFilePath}`);
        return reply(response).code(code);
      });
  };

module.exports = DeleteHandler;
