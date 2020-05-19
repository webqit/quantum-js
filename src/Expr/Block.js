
/**
 * @imports
 */
import _unique from '@web-native-js/commons/arr/unique.js';
import _before from '@web-native-js/commons/str/before.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import BlockInterface from './BlockInterface.js';
import ReturnInterface from './ReturnInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '../Lexer.js';

/**
 * ---------------------------
 * Block class
 * ---------------------------
 */				

export default class Block extends BlockInterface {

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
		// Current!
		context = Contexts.create(context);
		// Stringifies JSEN vars
		var stringifyEach = list => _unique(list.map(expr => _before(_before(expr.toString(), '['), '(')));

		var results = [];
		for (var i = 0; i < this.stmts.length; i ++) {
			var stmt = this.stmts[i];
			if (stmt instanceof ReturnInterface) {
				return stmt.eval(context, trap);
			}
			results[i] = stmt.eval(context, trap);
			// Lets be called...
			var props = stringifyEach(stmt.meta.vars);
			//if (props.length)
			(function(stmt, props, prevContext) {
				// Prev?
				if (0) {
					// Lets be called...
					prevContext.unobserve(props, null/** regardless callback */, {
						tags: ['#block', stmt],
					}, trap);
				}
				context.observe(props, (a, b, e) => {
					var evalReturn = stmt.eval(context, trap);
					// If the result of this evaluation is false,
					// e.stopPropagation will be called and subsequent expressions
					// will not be evaluated. So we must not allow false to be returned.
					// All expressions are meant to be evaluated in parallel, independent of each other.
					if (evalReturn !== false) {
						return evalReturn;
					}
				}, {observeDown: true, data: false, tags: ['#block', stmt]}, trap);
			})(stmt, props, this.prevContext);
		}
		this.prevContext = context;
		return results;
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
	static parse(expr, parseCallback, Static = Block) {
		var parse = Lexer.lex(expr + ';', _flatten(Static.operators).concat([Block.testBlockEnd]));
		if (parse.matches.length) {
			return new Static(
				parse.tokens.map(stmt => parseCallback(stmt.trim())).filter(a => a),
				parse.matches[0].trim()
			);
		}
	}

	static testBlockEnd(a, b) {
		// Cases of code blocks that won't end in ";"
		if (a.endsWith('}') && !b.trim().startsWith('else')) {
			return '';
		}
		return false;
	}
};

/**
 * @prop array
 */
Block.operators = [
	';',
	"\r\n",
];
