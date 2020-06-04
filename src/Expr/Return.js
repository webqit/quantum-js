
/**
 * @imports
 */
import Lexer from '../Lexer.js';
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
	eval(context = null, trap = {}) {
		return this.expr ? this.expr.eval(context, trap) : undefined;
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
