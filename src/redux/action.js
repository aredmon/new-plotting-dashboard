/**
 * Class for redux action
 */
export default class Action {

  constructor (type, payload) {
    this.type = type;
    this.payload = payload;
  }

  /**
   * Converts the class to a plain object
   * @return {[object]} plain object representation
   */
  toObject () {
    return {
      type: this.type,
      payload: this.payload
    };
  }
}
