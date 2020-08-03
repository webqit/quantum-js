
/**
 * @imports
 */
import Lexer from '@web-native-js/commons/str/Lexer.js';
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
	static parse(expr, parseCallback, params = {}, Static = Bool) {
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
