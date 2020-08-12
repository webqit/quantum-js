
/**
 * @imports
 */
import Lexer from '@web-native-js/commons/str/Lexer.js';
import ConditionInterface from './ConditionInterface.js';

/**
 * ---------------------------
 * Condition class
 * ---------------------------
 */				

export default class Condition extends ConditionInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(assertion, onTrue, onFalse) {
		super();
		this.assertion = assertion;
		this.onTrue = onTrue;
		this.onFalse = onFalse;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		return this.assertion.eval(context, params) 
			? this.onTrue.eval(context, params) 
			: this.onFalse.eval(context, params);
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return [
			this.assertion.toString(context), 
			this.constructor.operators[0], 
			this.onTrue.toString(context),
			this.constructor.operators[1], 
			this.onFalse.toString(context)
		].join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var splits = Lexer.split(expr, this.operators);
		if (splits.length > 1) {
			if (splits.length === 2) {
				throw new Error('Malformed ternary expression: ' + expr + '!');
			}
			return new this(
				parseCallback(splits[0].trim()),
				parseCallback(splits[1].trim()),
				parseCallback(splits[2].trim())
			);
		}
	}
};

/**
 * @prop object
 */
Condition.operators = [
	'?', 
	':',
];