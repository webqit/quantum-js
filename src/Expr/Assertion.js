
/**
 * @imports
 */
import _first from '@web-native-js/commons/arr/first.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import _unique from '@web-native-js/commons/arr/unique.js';
import AssertionInterface from './AssertionInterface.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';

/**
 * ---------------------------
 * Assertion class
 * ---------------------------
 */				

const Assertion = class extends AssertionInterface {

	/**
	 * @inheritdoc
	 */
	constructor(exprs, logic) {
		super();
		this.exprs = exprs;
		this.logic = logic;
	}
	 
	/**
	 * @inheritdoc
	 */
	 eval(context = null, env = {}, trap = {}) {
		if (this.logic.toLowerCase() === Assertion.negation.toLowerCase()) {
			return !_first(this.exprs).eval(context, env, trap);
		}
		var operators = _flatten(Assertion.operators);
		var logic = (this.logic || '').trim().toUpperCase();
		var isOr = logic === (Assertion.operators.or || '').trim().toUpperCase();
		var isNor = logic === (Assertion.operators.nor || '').trim().toUpperCase();
		var isAnd = logic === (Assertion.operators.and || '').trim().toUpperCase();
		var isNand = logic === (Assertion.operators.nand || '').trim().toUpperCase();
		var lastResult = true, trues = 0;
		for(var i = 0; i < this.exprs.length; i ++) {
			lastResult = this.exprs[i].eval(context, env, trap);
			if (isAnd && !lastResult) {
				return false;
			}
			if (isNand && !lastResult) {
				return true;
			}
			if (isOr && lastResult) {
				return lastResult;
			}
			trues += lastResult ? 1 : 0;
		}
		if (isOr) {
			// Which is falsey,
			// by virtue of getting here
			return lastResult;
		}
		if (isAnd || isNand) {
			// For AND and NAND, all entries must be true by now,
			// by virtue of getting here.
			// For AND, this means true; for NAND, false
			return isAnd;
		}
		// For NOR, all entries need to be false
		return isNor && trues === 0;
	}
	
	/**
	 * @inheritdoc
	 */
	 toString(context = null) {
		if (this.logic.toLowerCase() === Assertion.negation.toLowerCase()) {
			return this.logic + _first(this.exprs).toString(context);
		}
		return this.exprs.map(expr => expr.toString(context)).join(' ' + this.logic + ' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Assertion) {
		if (expr.toUpperCase().startsWith(Assertion.negation.toUpperCase())) {
			return new Static(
				[parseCallback(expr.substr(Assertion.negation.length))],
				Assertion.negation
			);
		}
		var parse = Lexer.lex(expr, _flatten(Static.operators));
		if (parse.tokens.length > 1) {
			var logic = _unique(parse.matches);
			if (logic.length > 1) {
				throw new Error('"AND" and "OR" logic cannot be asserted in the same expression: ' + expr + '!');
			}
			return new Static(
				parse.tokens.map(expr => parseCallback(expr.trim())),
				_first(logic)
			);
		}
	}
};

/**
 * @prop object
 */
Assertion.negation = '!';

/**
 * @prop object
 */
Assertion.operators = {
	and: '&&',
	or: '||',
};

/**
 * @exports
 */
export default Assertion;
