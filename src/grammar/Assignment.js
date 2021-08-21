
/**
 * @imports
 */
import _isNumber from '@webqit/util/js/isNumber.js';
import _isArray from '@webqit/util/js/isArray.js';
import Lexer from '@webqit/util/str/Lexer.js';
import AssignmentInterface from './AssignmentInterface.js';
import ReferenceInterface from './ReferenceInterface.js';
import SyntaxError from '../SyntaxError.js';
import ReferenceError from '../ReferenceError.js';

/**
 * ---------------------------
 * Assignment class
 * ---------------------------
 */				

const Assignment = class extends AssignmentInterface {

	/**
	 * @inheritdoc
	 */
	constructor(reference, val, operator = '=', incrDecrIsPost = false) {
		super();
		this.reference = reference;
		this.val = val;
		this.operator = operator;
		this.incrDecrIsPost = incrDecrIsPost;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		var val, initKeyword, initialVal, reference = this.reference.getEval(context, params);
		if (['++', '--'].includes(this.operator)) {
			initialVal = this.reference.eval(context, params);
			if (!_isNumber(initialVal)) {
				throw new Error(this.reference + ' must be a number!');
			}
			if (this.operator === '++') {
				val = initialVal + 1;
			} else {
				val = initialVal - 1;
			}
		} else if (['+=', '-=', '*=', '/='].includes(this.operator)) {
			var operandA = reference.get();
			var operandB = this.val.eval(context, params);
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
			initKeyword = params.initKeyword;
			val = this.val ? this.val.eval(context, params) : undefined;
		}
		try {
			reference.set(val, initKeyword);
			if (params && _isArray(params.references)) {
				_pushUnique(params.references, this.reference.toString());
			}
			return this.incrDecrIsPost ? initialVal : val;
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
		if (['++', '--'].includes(this.operator)) {
			return this.incrDecrIsPost 
				? this.reference.stringify(params) + this.operator
				: this.operator + this.reference.stringify(params);
		}
		return [this.reference.stringify(params), this.operator.trim(), this.val ? this.val.stringify(params) : ''].filter(a => a).join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		expr = expr.trim();
		var isDeclaration, parse = Lexer.lex(expr, this.operators.concat([testBlockEnd]));
		if (params.isDeclaration) {
			params = { ...params };
			delete params.isDeclaration;
			isDeclaration = true;
		}
		if (parse.matches.length || isDeclaration) {
			var reference,
				val,
				operator = (parse.matches[0] || '').trim(),
				isIncrDecr = ['++', '--'].includes(operator),
				incrDecrIsPost;
			if (isIncrDecr) {
				incrDecrIsPost = (expr.trim().endsWith('++') || expr.trim().endsWith('--'));
				reference = parse.tokens[incrDecrIsPost ? 'shift' : 'pop']().trim();
			} else {
				reference = parse.tokens.shift().trim();
				val = (parse.tokens.shift() || '').trim();
			}
			if (!((reference = parseCallback(reference, null, { ...params, role: 'ASSIGNMENT_SPECIFIER' })) instanceof ReferenceInterface) 
			|| (!isIncrDecr && (val && !(val = parseCallback(val, null, params)) && !isDeclaration))) {
				throw new SyntaxError(expr);
			}
			return new this(reference, val, operator, incrDecrIsPost);
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
