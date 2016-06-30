import path from 'path';

const method = ['GET'];
const mockerConfig = {
  method,
  mockFile: path.join(__dirname, './mock.json'),
  seed: true
};

export default (mocker) => ({
  method,
  path: '/calls',
  handler: mocker(mockerConfig)
});
