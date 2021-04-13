
/**
 * @imports
 */
import _isNumeric from '@webqit/util/js/isNumeric.js';
import NumInterface from './NumInterface.js';
import Lexer from '@webqit/util/str/Lexer.js';

/**
 * ---------------------------
 * Num (number) class
 * ---------------------------
 */				

const Num = class extends NumInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(int, dec = 0) {
		super();
		this.int = int;
		this.dec = dec;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval() {
		return parseFloat(this.int + (this.dec ? '.' + this.dec : null));
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
		return this.int + (this.dec ? '.' + this.dec : null);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (_isNumeric(expr)) {
			var expr = expr.split('.');
			return new this(
				parseInt(expr.shift()),
				parseInt(expr.shift())
			);
		}
	}
};

/**
 * @exports
 */
export default Num;
