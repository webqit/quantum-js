
/**
 * @imports
 */
import Lexer from '@webqit/util/str/Lexer.js';
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
		return this.stringify();
	}
	
	/**
	 * @inheritdoc
	 */
	stringify(params = {}) {
		return this.state;
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var expr = expr.toLowerCase().trim();
		if (expr === 'true' || expr === 'false') {
			return new this(expr);
		}
	}
};

/**
 * @exports
 */
export default Bool;
