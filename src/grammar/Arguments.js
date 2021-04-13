
/**
 * @imports
 */
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import Lexer from '@webqit/util/str/Lexer.js';
import ArgumentsInterface from './ArgumentsInterface.js';

/**
 * ---------------------------
 * Arguments class
 * ---------------------------
 */				

const Arguments = class extends ArgumentsInterface {
	 
	/**
	 * @inheritdoc
	 */
	constructor(list = []) {
		super();
		this.list = list;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		return this.list.map(arg => arg.eval(context, params));
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
		return '(' + this.list.map(arg => arg.stringify(params)).join(', ') + ')';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var args; expr = expr.trim();
		if (_wrapped(expr, '(', ')') && !Lexer.match(expr, [' ']).length) {
			return new this(
				Lexer.split(_unwrap(expr, '(', ')'), [',']).map(arg => parseCallback(arg.trim()))
			);
		}
	}
};

/**
 * @exports
 */
export default Arguments;
