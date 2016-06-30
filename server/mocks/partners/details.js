import { fromJS } from 'immutable';
import path from 'path';

const method = ['GET', 'PUT', 'DELETE'];
const mockerConfig = {
  method,
  mockFile: path.join(__dirname, './mock.json'),
  seed: true,
  handlers: {
    get: (partners, payload, { id }) =>
      ({
        code: 200,
        response: fromJS(partners).get(id).toJS()
      }),
    put: (partners, payload, { id }) =>
      ({
        code: 200,
        data: fromJS(partners).set(id, payload).toJS(),
        response: payload
      }),
    delete: (partners, payload, { id }) => {
      const updatedPartners = fromJS(partners).setIn([id, 'status'], 'deleted');
      return {
        code: 200,
        data: updatedPartners.toJS(),
        response: updatedPartners.get(id).toJS()
      };
    }
  }
};

export default (mocker) => ({
  method,
  path: '/partners/{id}',
  handler: mocker(mockerConfig)
});
