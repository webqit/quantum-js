
/**
 * @imports
 */
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import ArrInterface from './ArrInterface.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';

/**
 * ---------------------------
 * Array utils
 * ---------------------------
 */				

const Arr = class extends ArrInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(exprs) {
		super();
		this.exprs = exprs || [];
	}
	
	/**
	 * @inheritdoc
	 */
	inherit(Super) {
		if (Super instanceof ArrInterface) {
			var newExprs = Super.exprs.filter(exprA => {
				return this.exprs.reduce((uniqueSoFar, exprB) => uniqueSoFar && !exprA.even(exprB), true);
			});
			this.exprs = newExprs.concat(this.exprs);
		}
		return this;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		return this.exprs.map(expr => expr.eval(context, params));
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return '[' + this.exprs.map(expr => expr.toString(context)).join(', ') + ']';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (_wrapped(expr, '[', ']') && !Lexer.match(expr.trim(), [' ']).length) {
			var splits = Lexer.split(_unwrap(expr, '[', ']'), [','])
				.map(n => n.trim()).filter(n => n).map(expr => parseCallback(expr));
			return new this(splits);
		}
	}
};

/**
 * @export
 */
export default Arr;
