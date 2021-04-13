
/**
 * @imports
 */
import _first from '@webqit/util/arr/first.js';
import _flatten from '@webqit/util/arr/flatten.js';
import _unique from '@webqit/util/arr/unique.js';
import AssertionInterface from './AssertionInterface.js';
import Lexer from '@webqit/util/str/Lexer.js';

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
	 eval(context = null, params = {}) {
		var Assertion = this.constructor;
		if (this.logic.toLowerCase() === Assertion.negation.toLowerCase()) {
			return !_first(this.exprs).eval(context, params);
		}
		var operators = _flatten(Assertion.operators);
		var logic = (this.logic || '').trim().toUpperCase();
		var isOr = logic === (Assertion.operators.or || '').trim().toUpperCase();
		var isNor = logic === (Assertion.operators.nor || '').trim().toUpperCase();
		var isAnd = logic === (Assertion.operators.and || '').trim().toUpperCase();
		var isNand = logic === (Assertion.operators.nand || '').trim().toUpperCase();
		var lastResult = true, trues = 0;
		for(var i = 0; i < this.exprs.length; i ++) {
			lastResult = this.exprs[i].eval(context, params);
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
	toString() {
		return this.stringify();
	}
	
	/**
	 * @inheritdoc
	 */
	stringify(params = {}) {
		var Assertion = this.constructor;
		if (this.logic.toLowerCase() === Assertion.negation.toLowerCase()) {
			return this.logic + _first(this.exprs).stringify(params);
		}
		return this.exprs.map(expr => expr.stringify(params)).join(' ' + this.logic.trim() + ' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (expr.toUpperCase().startsWith(this.negation.toUpperCase())) {
			return new this(
				[parseCallback(expr.substr(this.negation.length))],
				this.negation
			);
		}
		var parse = Lexer.lex(expr, _flatten(this.operators));
		if (parse.tokens.length > 1) {
			var logic = _unique(parse.matches);
			if (logic.length > 1) {
				throw new Error('"AND" and "OR" logic cannot be asserted in the same expression: ' + expr + '!');
			}
			return new this(
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
