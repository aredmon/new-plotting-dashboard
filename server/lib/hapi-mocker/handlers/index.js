const getHandler = require('./get');
const postHandler = require('./post');
const putHandler = require('./put');
const deleteHandler = require('./delete');
const notImplementedHandler = require('./not-implemented');

module.exports = {
  getHandler,
  postHandler,
  putHandler,
  deleteHandler,
  notImplementedHandler
};
