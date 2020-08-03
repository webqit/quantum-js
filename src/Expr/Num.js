
/**
 * @imports
 */
import _isNumeric from '@web-native-js/commons/js/isNumeric.js';
import NumInterface from './NumInterface.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';

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
	toString(context = null) {
		return this.int + (this.dec ? '.' + this.dec : null);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Num) {
		if (_isNumeric(expr)) {
			var expr = expr.split('.');
			return new Static(
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
