import { fromJS } from 'immutable';
import Action from '../action';

/**
 * Enums for action types
 * @type {Object}
 */
export const type = {
  SET_METRICS: 'SET_METRICS'
};

/**
 * Action to add data to the state
 * @param  {[data]} data The data to add
 */
export const addMetrics = (data) => {
  return new Action(
    type.SET_METRICS,
    data
  ).toObject();
};

/**
 * Reducer for handling data actions
 * @param  {[type]} state  [description]
 * @param  {[type]} action [description]
 */
const dataReducer = (state = fromJS([]), action) => {
  switch (action.type) {

    case type.SET_METRICS:
      return fromJS(action.payload);

    default:
      return state;
  }
};

export default dataReducer;
