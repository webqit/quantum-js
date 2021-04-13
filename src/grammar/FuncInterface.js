
/**
 * @imports
 */
import IndependentExprInterface from '../IndependentExprInterface.js';

/**
 * ---------------------------
 * FuncInterface
 * ---------------------------
 */				

const Interface = class extends IndependentExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'FunctionType'; },
});
export default Interface;
