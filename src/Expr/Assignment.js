
/**
 * @imports
 */
import _last from '@web-native-js/commons/arr/last.js';
import _before from '@web-native-js/commons/str/before.js';
import _after from '@web-native-js/commons/str/after.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import AssignmentInterface from './AssignmentInterface.js';
import ReferenceInterface from './ReferenceInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '../Lexer.js';

/**
 * ---------------------------
 * Assignment class
 * ---------------------------
 */				

const Assignment = class extends AssignmentInterface {

	/**
	 * @inheritdoc
	 */
	constructor(initKeyword, reference, val, operator = '=') {
		super();
		this.initKeyword = initKeyword;
		this.reference = reference;
		this.val = val;
		this.operator = operator;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		var reference = this.reference.getEval(context, trap);
		var val = this.val.eval(context, trap);
		if (!_isUndefined(reference.context) && !_isUndefined(reference.name)) {
			return Contexts.create(reference.context).set(reference.name, val, trap, this.initKeyword);
		}
		throw new Error('"' + this + '" is undefined!');
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return (this.initKeyword ? this.initKeyword + ' ' : '')
			+ [this.reference.toString(context), this.operator, this.val.toString(context)].join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = Assignment) {
		var parse = Lexer.lex(expr, Static.operators);
		if (parse.tokens.length === 2) {
			var initKeyword, reference = parse.tokens.shift().trim(), val = parse.tokens.shift().trim();
			if (['var', 'let', 'const'].includes(_before(reference, ' '))) {
				initKeyword = _before(reference, ' ');
				reference = _after(reference, ' ').trim();
			}
			if (!((reference = parseCallback(reference)) instanceof ReferenceInterface) 
			|| !(val = parseCallback(val))) {
				throw new Error('Invalid assignment expression: ' + expr);
			}
			return new Static(initKeyword, reference, val, parse.matches[0].trim());
		}
	}
};	

/**
 * @prop array
 */
Assignment.operators = [' = '];

/**
 * @exports
 */
export default Assignment;
