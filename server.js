import Hapi from 'hapi';
import Inert from 'inert';
import h2o2 from 'h2o2';
import path from 'path';
import fs from 'fs';
import { drop } from 'ramda';
import process from 'process';

const server = new Hapi.Server();
server.connection({ port: process.env.PORT || 3000 });

server.register([
  Inert,
  h2o2
], () => {
  server.start(() => {
    console.log('Server running at:', server.info.uri);
  });
});

server.route({
  method: '*',
  path: '/api/{any*}',
  config: {
    handler: {
      proxy: {
        passThrough: true,
        mapUri: ({ path }, callback) =>
          callback(null, `${process.env.API_URL || 'http://mmd-api.herokuapp.com'}${drop(4, path)}`)
      }
    },
    payload: {
      output: 'stream',
      parse: false
    }
  }
});

server.route({
  method: '*',
  path: '/{route*}',
  handler: function (request, reply) {
    const route = request.params.route;
    try {
      const _path = path.join(__dirname, `./dist/${route}`);
      fs.accessSync(_path, fs.F_OK);
      reply.file(_path);
    } catch (err) {
      reply.file(path.join(__dirname, './dist/index.html'));
    }
  }
});
