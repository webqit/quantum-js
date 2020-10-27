
/**
 * @imports
 */
import _wrapped from '@onephrase/util/str/wrapped.js';
import _unwrap from '@onephrase/util/str/unwrap.js';
import Lexer from '@onephrase/util/str/Lexer.js';
import AbstractionInterface from './AbstractionInterface.js';

/**
 * ---------------------------
 * Abstraction class
 * ---------------------------
 */				

const Abstraction = class extends AbstractionInterface {
	 
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
		return this.expr.eval(context, params);
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
		return '(' + this.expr.stringify(params) + ')';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (_wrapped(expr, '(', ')') && !Lexer.match(expr, [' ']).length) {
			return new this(
				parseCallback(_unwrap(expr, '(', ')'))
			);
		}
	}
};

/**
 * @exports
 */
export default Abstraction;
