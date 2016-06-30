import { fromJS } from 'immutable';
import path from 'path';

const method = ['GET', 'PUT', 'DELETE'];
const mockerConfig = {
  method,
  mockFile: path.join(__dirname, './mock.json'),
  seed: true,
  handlers: {
    get: (calls, payload, { id }) =>
      ({
        code: 200,
        response: fromJS(calls).get(id).toJS()
      }),
    put: (calls, payload, { id }) =>
      ({
        code: 200,
        data: fromJS(calls).set(id, payload).toJS(),
        response: payload
      }),
    delete: (calls, payload, { id }) => {
      const updatedCalls = fromJS(calls).setIn([id, 'status'], 'deleted');
      return {
        code: 200,
        data: updatedCalls.toJS(),
        response: updatedCalls.get(id).toJS()
      };
    }
  }
};

export default (mocker) => ({
  method,
  path: '/calls/{id}',
  handler: mocker(mockerConfig)
});
