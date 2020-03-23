
/**
 * @imports
 */
import _flatten from '@web-native-js/commons/arr/flatten.js';
import StatementsInterface from './StatementsInterface.js';
import ReturnInterface from './ReturnInterface.js';
import Lexer from '../Lexer.js';

/**
 * ---------------------------
 * Statements class
 * ---------------------------
 */				

const Statements = class extends StatementsInterface {

	/**
	 * @inheritdoc
	 */
	constructor(stmts, delim) {
		super();
		this.stmts = stmts || [];
		this.delim = delim;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		var stmts = [];
		for (var i = 0; i < this.stmts.length; i ++) {
			if (this.stmts[i] instanceof ReturnInterface) {
				return this.stmts[i].eval(context, trap);
			} else {
				stmts[i] = this.stmts[i].eval(context, trap);
			}
		}
		return stmts;
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return this.stmts.map(stmt => stmt.toString(context)).join(this.delim);
	}
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = Statements) {
		var parse = Lexer.lex(expr, _flatten(Static.operators).concat([(a, b) => {
			// Cases of code blocks that won't end in ";"
			if (a.endsWith('}') && !b.trim().startsWith('else')) {
				return '';
			}
			return false;
		}]));
		if (parse.matches.length) {
			return new Static(
				parse.tokens.map(stmt => parseCallback(stmt.trim())).filter(a => a),
				parse.matches[0].trim()
			);
		}
	}
};

/**
 * @prop array
 */
Statements.operators = [
	';',
	"\r\n",
];

/**
 * @exports
 */
export default Statements;
