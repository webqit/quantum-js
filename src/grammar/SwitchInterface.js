
/**
 * @imports
 */
import ExprInterface from '../ExprInterface.js';

/**
 * ---------------------------
 * IfInterface
 * ---------------------------
 */				

const Interface = class extends ExprInterface {};
Object.defineProperty(Interface.prototype, 'jsenType', {
	get() { return 'SwitchConstruct'; },
});
export default Interface;
