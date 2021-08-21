
/**
 * @imports
 */
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import ArrInterface from './ArrInterface.js';
import Lexer from '@webqit/util/str/Lexer.js';

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
	toString() {
		return this.stringify();
	}
	
	/**
	 * @inheritdoc
	 */
	stringify(params = {}) {
		return '[' + this.exprs.map(expr => expr.stringify(params)).join(', ') + ']';
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
