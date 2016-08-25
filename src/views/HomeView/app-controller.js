import { logger } from '~/config';
import App from './app-model';

/**
 * Index endpoint
 */
export const fetchAll = () => {
  logger.silly('fetching all apps');
  return App.find().exec();
};

/**
 * Model create method
 */
export const saveApp = (app) => {
  logger.silly(`Saving app ${app}`);
  const newApp = new App(app);
  return newApp.save();
};

/**
 * Delete all models endpoint
 */
export const deleteAll = () => {
  logger.silly('Removing all apps');
  return App.remove({}).exec();
};

/**
 * Find by name endpoint
 * @type {[type]}
 */
export const fetchByName = (appName) => {
  logger.debug(`Fetching app ${appName}`);
  const query = { name: appName };
  return App.findOne(query).exec();
};
