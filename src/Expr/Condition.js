
/**
 * @imports
 */
import Lexer from '../Lexer.js';
import ConditionInterface from './ConditionInterface.js';

/**
 * ---------------------------
 * Condition class
 * ---------------------------
 */				

const Condition = class extends ConditionInterface {
	
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
	eval(context = null, trap = {}) {
		return this.assertion.eval(context, trap) 
			? this.onTrue.eval(context, trap) 
			: this.onFalse.eval(context, trap);
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return [
			this.assertion.toString(context), 
			Condition.operators[0], 
			this.onTrue.toString(context),
			Condition.operators[1], 
			this.onFalse.toString(context)
		].join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = Condition) {
		var splits = Lexer.split(expr, Static.operators);
		if (splits.length > 1) {
			if (splits.length === 2) {
				throw new Error('Malformed ternary expression: ' + expr + '!');
			}
			return new Static(
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
Condition.operators = ['?', ':'];

/**
 * @exports
 */
export default Condition;
