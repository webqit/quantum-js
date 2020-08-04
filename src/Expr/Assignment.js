
/**
 * @imports
 */
import _last from '@web-native-js/commons/arr/last.js';
import _before from '@web-native-js/commons/str/before.js';
import _after from '@web-native-js/commons/str/after.js';
import _isNumber from '@web-native-js/commons/js/isNumber.js';
import _isArray from '@web-native-js/commons/js/isArray.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import AssignmentInterface from './AssignmentInterface.js';
import ReferenceInterface from './ReferenceInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';

/**
 * ---------------------------
 * Assignment class
 * ---------------------------
 */				

const Assignment = class extends AssignmentInterface {

	/**
	 * @inheritdoc
	 */
	constructor(initKeyword, reference, val, operator = '=', postIncrDecr = false) {
		super();
		this.initKeyword = initKeyword;
		this.reference = reference;
		this.val = val;
		this.operator = operator;
		this.postIncrDecr = postIncrDecr;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, env = {}, trap = {}) {
		var val, initialVal, reference = this.reference.getEval(context, env, trap);
		if (['++', '--'].includes(this.operator)) {
			initialVal = this.reference.eval(context, env, trap);
			if (!_isNumber(initialVal)) {
				throw new Error(this.reference + ' must be a number!');
			}
			if (this.operator === '++') {
				val = initialVal + 1;
			} else {
				val = initialVal - 1;
			}
		} else if (['+=', '-=', '*=', '/='].includes(this.operator)) {
			var operandA = this.reference.eval(context, env, trap);
			var operandB = this.val.eval(context, env, trap);
			if (this.operator !== '+=' && (!_isNumber(operandA) || !_isNumber(operandB))) {
				throw new Error(this + ' - operands must each be a number!');
			}
			if (this.operator === '*=') {
				val = operandA * operandB;
			} else if (this.operator === '/=') {
				val = operandA / operandB;
			} else if (this.operator === '-=') {
				val = operandA - operandB;
			} else {
				val = operandA + operandB;
			}
		} else {
			val = this.val.eval(context, env, trap);
		}
		if (!_isUndefined(reference.context) && !_isUndefined(reference.name)) {
			if (env && _isArray(env.references)) {
				_pushUnique(env.references, this.reference.toString());
			}
			if (Contexts.create(reference.context).set(reference.name, val, trap, this.initKeyword)) {
				return this.postIncrDecr ? initialVal : val;
			};
			throw new Error('[' + this + '] Operation failed!');
		}
		throw new Error('"' + this + '" is undefined!');
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		if (['++', '--'].includes(this.operator)) {
			return this.postIncrDecr 
				? this.reference.toString(context) + this.operator
				: this.operator + this.reference.toString(context);
		}
		return (this.initKeyword ? this.initKeyword + ' ' : '')
			+ [this.reference.toString(context), this.operator, this.val.toString(context)].join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Assignment) {
		var parse = Lexer.lex(expr, Static.operators.concat([testBlockEnd]));
		if (parse.matches.length) {
			var initKeyword, reference, val, operator = parse.matches[0].trim(), isIncrDecr = ['++', '--'].includes(operator), postIncrDecr;
			if (isIncrDecr) {
				postIncrDecr = (expr.trim().endsWith('++') || expr.trim().endsWith('--'));
				reference = parse.tokens[postIncrDecr ? 'shift' : 'pop']().trim();
			} else {
				reference = parse.tokens.shift().trim();
				val = parse.tokens.shift().trim();
			}
			if (['var', 'let', 'const'].includes(_before(reference, ' '))) {
				if (operator !== '=') {
					throw new Error('Invalid declaration: ' + expr);
				}
				initKeyword = _before(reference, ' ');
				reference = _after(reference, ' ').trim();
			}
			if (!((reference = parseCallback(reference, null, {lodge: false})) instanceof ReferenceInterface) 
			|| (!isIncrDecr && !(val = parseCallback(val)))) {
				throw new Error('Invalid assignment expression: ' + expr);
			}
			return new Static(initKeyword, reference, val, operator, postIncrDecr);
		}
	}
};	

/**
 * @prop array
 */
Assignment.operators = [
	'+=',
	'-=',
	'*=',
	'/=',
	'++',
	'--',
];

const testBlockEnd = (a, b) => {
	// Match exactly "=", not "=>", "==", "==="
	if (!a.endsWith('=') && b.startsWith('=') && !b.startsWith('=>') && !b.startsWith('==') && !b.startsWith('===')) {
		return '=';
	}
	return false;
};

/**
 * @exports
 */
export default Assignment;
