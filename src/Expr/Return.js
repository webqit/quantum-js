
/**
 * @imports
 */
import Lexer from '@web-native-js/commons/str/Lexer.js';
import ReturnInterface from './ReturnInterface.js';

/**
 * ---------------------------
 * Ret (return) class
 * ---------------------------
 */				

const Return = class extends ReturnInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(expr) {
		super();
		this.expr = expr;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, env = {}, trap = {}) {
		return this.expr ? this.expr.eval(context, env, trap) : undefined;
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return this.expr ? 'return ' + this.expr.toString(context) : 'return';
	}
	
	/**
	 * -------------------------------------------------------
	 */
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Return) {
		var exprLc = expr.toLowerCase();
		if (exprLc.startsWith('return ') || exprLc === 'return') {
			return new Static(
				parseCallback(expr.substr(6).trim())
			);
		}
	}
};

/**
 * @exports
 */
export default Return;
