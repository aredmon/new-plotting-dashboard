import Koa from 'koa';
import Hapi from 'hapi';
import { drop } from 'ramda';
// import initMocks from './mocks';
import convert from 'koa-convert';
import proxy from 'koa-proxy';
import webpack from 'webpack';
import webpackConfig from '../build/webpack.config';
import historyApiFallback from 'koa-connect-history-api-fallback';
import serve from 'koa-static';
import _debug from 'debug';
import config from '../config';
import webpackProxyMiddleware from './middleware/webpack-proxy';
import webpackDevMiddleware from './middleware/webpack-dev';
import webpackHMRMiddleware from './middleware/webpack-hmr';

const debug = _debug('app:server');
const paths = config.utils_paths;
const app = new Koa();

// ------------------------------------
// Apply proxy for API mocks
// ------------------------------------
if (config.env === 'development') {
  app.use(convert(proxy({
    host: 'http://localhost:8000',
    match: /^\/api\//,
    map: drop(4)
  })));
}

// This rewrites all routes requests to the root /index.html file
// (ignoring file requests). If you want to implement isomorphic
// rendering, you'll want to remove this middleware.
app.use(convert(historyApiFallback({
  verbose: false
})));

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (config.env === 'development') {
  const server = new Hapi.Server();
  server.connection({ port: 8000 });
  server.register({
    register: require('h2o2')
  }, () => {
    // server.start(() => {
    //   console.log('Mock API running at:', server.info.uri);
    // });
  });
  // initMocks(server);
  // server.route({
  //   method: '*',
  //   path: '/{any*}',
  //   config: {
  //     handler: (request, reply) =>
  //       reply.proxy({ passThrough: true, host: 'mmd-api-staging.herokuapp.com', port: 80, protocol: 'http' }),
  //     payload: {
  //       output: 'stream',
  //       parse: false
  //     }
  //   }
  // });

  const compiler = webpack(webpackConfig);

  // Enable webpack-dev and webpack-hot middleware
  const { publicPath } = webpackConfig.output;

  if (config.proxy && config.proxy.enabled) {
    const options = config.proxy.options;
    app.use(convert(webpackProxyMiddleware(options)));
  }

  app.use(webpackDevMiddleware(compiler, publicPath));
  app.use(webpackHMRMiddleware(compiler));

  // Serve static assets from ~/src/static since Webpack is unaware of
  // these files. This middleware doesn't need to be enabled outside
  // of development since this directory will be copied into ~/dist
  // when the application is compiled.
  app.use(convert(serve(paths.client('static'))));
} else {
  debug(
    'Server is being run outside of live development mode. This starter kit ' +
    'does not provide any production-ready server functionality. To learn ' +
    'more about deployment strategies, check out the "deployment" section ' +
    'in the README.'
  );

  // Serving ~/dist by default. Ideally these files should be served by
  // the web server and not the app server, but this helps to demo the
  // server in production.
  app.use(convert(serve(paths.base(config.dir_dist))));
}

export default app;
