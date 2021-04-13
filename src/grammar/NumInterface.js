
/**
 * @imports
 */
import ExprInterface from '../ExprInterface.js';

/**
 * ---------------------------
 * NumInterface
 * ---------------------------
 */				

const Interface = class extends ExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'NumberType'; },
});
export default Interface;
