
/**
 * @imports
 */
import _isUndefined from '@webqit/util/js/isUndefined.js';
import ReferenceInterface from './ReferenceInterface.js';
import CallInterface from './CallInterface.js';
import Arguments from './Arguments.js';
import Lexer from '@webqit/util/str/Lexer.js';
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
	toString() {
		return this.stringify();
	}
	
	/**
	 * @inheritdoc
	 */
	stringify(params = {}) {
		return this.reference.stringify(params) + this.args.stringify(params);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (expr.endsWith(')') && !Lexer.match(expr, [' ']).length) {
			var tokens = Lexer.split(expr, []);
			var reference, args = tokens.pop();
			if (!((reference = parseCallback(tokens.join(''), null, {role: 'CALL_SPECIFIER'})) instanceof ReferenceInterface) 
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
