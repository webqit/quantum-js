
/**
 * @imports
 */
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import ReferenceInterface from './ReferenceInterface.js';
import CallInterface from './CallInterface.js';
import Arguments from './Arguments.js';
import Contexts from '../Contexts.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import ReferenceError from '../ReferenceError.js';
import SyntaxError from '../SyntaxError.js';

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
	eval(context = null, env = {}, trap = {}) {
		var reference = this.reference.getEval(context, env, trap);
		var args = this.args.eval(context, env, trap);
		if (_isUndefined(reference.context) || _isUndefined(reference.name)) {
			throw new Error('[Reference Error][' + this + ']: "' + (this.reference.context || this.reference) + '" is undefined!');
		}
		try {
			return Contexts.create(reference.context).exec(reference.name, args, trap);
		} catch(e) {
			if (e instanceof ReferenceError) {
				throw new Error('[Reference Error][' + this + ']: ' + e.message);
			} else if (e instanceof SyntaxError) {
				throw new Error('[Syntax Error][' + this + ']: ' + e.message);
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
	static parse(expr, parseCallback, params = {}, Static = Call) {
		if (!expr.startsWith('(') && expr.endsWith(')') && !Lexer.match(expr, [' ']).length) {
			var tokens = Lexer.split(expr, []);
			var reference, args = tokens.pop();
			if (!((reference = parseCallback(tokens.join(''), null, {lodge: false})) instanceof ReferenceInterface) 
			|| !(args = parseCallback(args, [Arguments]))) {
				throw new Error('Invalid call directive: ' + expr);
			}
			return new Static(reference, args);
		}
	}
};	

/**
 * @exports
 */
export default Call;
