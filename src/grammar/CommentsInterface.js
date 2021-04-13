
/**
 * @imports
 */
import ExprInterface from '../ExprInterface.js';

/**
 * ---------------------------
 * CommentsInterface
 * ---------------------------
 */				

const Interface = class extends ExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'Comments'; },
});
export default Interface;
