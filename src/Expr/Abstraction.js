
/**
 * @imports
 */
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
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
	toString(context = null) {
		return '(' + this.expr.toString(context) + ')';
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
