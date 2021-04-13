
/**
 * @imports
 */
import ExprInterface from '../ExprInterface.js';

/**
 * ---------------------------
 * AssertionInterface
 * ---------------------------
 */				

const Interface = class extends ExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'AssertionExpression'; },
});
export default Interface;
