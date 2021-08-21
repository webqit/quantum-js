
/**
 * @imports
 */
import ReturnInterface from './ReturnInterface.js';
import Block from './Block.js';

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
	eval(context = null, params = {}) {
		return this.expr ? this.expr.eval(context, params) : undefined;
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
		return this.expr ? 'return ' + this.expr.stringify(params) : 'return';
	}
	
	/**
	 * -------------------------------------------------------
	 */
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var exprLc = expr.toLowerCase();
		if (exprLc.startsWith('return ') || exprLc === 'return') {
			return new this(Block.parseSingleOrMultiple(expr.substr(6).trim(), parseCallback, params));
		}
	}
};

/**
 * @exports
 */
export default Return;
