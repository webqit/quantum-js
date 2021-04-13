
/**
 * @imports
 */
import ExprInterface from '../ExprInterface.js';

/**
 * ---------------------------
 * ArrInterface
 * ---------------------------
 */				

const Interface = class extends ExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'ArrayType'; },
});
export default Interface;
