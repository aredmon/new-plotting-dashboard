import { fromJS } from 'immutable';
import path from 'path';
import generateId from '../../lib/generate-firebase-id';

const method = ['GET', 'POST'];
const mockerConfig = {
  method,
  mockFile: path.join(__dirname, './mock.json'),
  seed: true,
  handlers: {
    post: (partners, payload) =>
      ({
        code: 200,
        data: fromJS(partners).set(generateId(), payload).toJS(),
        response: payload
      })
  }
};

export default (mocker) => ({
  method,
  path: '/partners',
  handler: mocker(mockerConfig)
});
