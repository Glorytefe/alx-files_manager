import { ObjectId } from 'mongodb';

/**
 * basic utilities
 */
const Utils = {
  /**
   * Checks if Id is Valid for Mongo
   * @id {string|number} id to be evaluated
   * @return {boolean} true if valid, false if not
   */
  isValidId(id) {
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default Utils;
