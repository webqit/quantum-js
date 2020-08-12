
/**
 * @imports
 */
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import StrInterface from './StrInterface.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import Bool from './Bool.js';

/**
 * ---------------------------
 * String utils
 * ---------------------------
 */

const Str = class extends StrInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(expr, quote) {
		super();
		this.expr = expr;
		this.quote = quote;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval() {
		return this.expr;
	}
	
	/**
	 * @inheritdoc
	 */
	toString() {
		return this.quote + this.expr + this.quote;
	}
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		expr = expr.trim();
		if ((_wrapped(expr, '"', '"') || _wrapped(expr, "'", "'")) 
		&& !Lexer.match(expr, [' ']).length) {
			var quote = _wrapped(expr, '"', '"') ? '"' : "'";
			return new this(
				_unwrap(expr, quote, quote),
				quote
			);
		}
	}
};

/**
 * @exports
 */
export default Str;
