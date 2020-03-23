
/**
 * @imports
 */
import Lexer from '../Lexer.js';
import BoolInterface from './BoolInterface.js';

/**
 * ---------------------------
 * Bool (boolean) class
 * ---------------------------
 */				

const Bool = class extends BoolInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(state) {
		super();
		this.state = state;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval() {
		return this.state.toLowerCase().trim() === 'true';
	}
	
	/**
	 * @inheritdoc
	 */
	toString() {
		return this.state;
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = Bool) {
		var expr = expr.toLowerCase().trim();
		if (expr === 'true' || expr === 'false') {
			return new Static(expr);
		}
	}
};

/**
 * @exports
 */
export default Bool;
