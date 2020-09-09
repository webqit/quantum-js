
/**
 * @imports
 */
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import ReferenceInterface from './ReferenceInterface.js';
import CallInterface from './CallInterface.js';
import Arguments from './Arguments.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import SyntaxError from '../SyntaxError.js';
import ReferenceError from '../ReferenceError.js';

/**
 * ---------------------------
 * Call class
 * ---------------------------
 */				

const Call = class extends CallInterface {

	/**
	 * @inheritdoc
	 */
	constructor(reference, args) {
		super();
		this.reference = reference;
		this.args = args;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		try {
			var args = this.args.eval(context, params);
			return this.reference.getEval(context, params).exec(args);
		} catch(e) {
			if (e instanceof ReferenceError) {
				throw new ReferenceError('[' + this + ']: ' + e.message);
			} else {
				throw e;
			}
		}
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return this.reference.toString(context) + this.args.toString(context);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (!expr.startsWith('(') && expr.endsWith(')') && !Lexer.match(expr, [' ']).length) {
			var tokens = Lexer.split(expr, []);
			var reference, args = tokens.pop();
			if (!((reference = parseCallback(tokens.join(''), null, {lodge: false})) instanceof ReferenceInterface) 
			|| !(args = parseCallback(args, [Arguments]))) {
				throw new SyntaxError(expr);
			}
			return new this(reference, args);
		}
	}
};	

/**
 * @exports
 */
export default Call;
