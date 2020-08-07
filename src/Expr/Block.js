
/**
 * @imports
 */
import _unique from '@web-native-js/commons/arr/unique.js';
import _before from '@web-native-js/commons/str/before.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import _copy from '@web-native-js/commons/obj/copy.js';
import BlockInterface from './BlockInterface.js';
import ReturnInterface from './ReturnInterface.js';
import AssignmentInterface from './AssignmentInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';

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
	eval(context = null, env = {}, trap = {}) {
		// Current!
		env = env ? _copy(env) : {};
		context = Contexts.create(context);
		var errorLevel = context.params.errorLevel;
		// Stringifies JSEN vars
		var stringifyEach = list => _unique(list.map(expr => _before(_before(expr.toString(), '['), '(')));
		var callEval = (stmt, context, env, trap) => {
			if (errorLevel !== 2) {
				try {
					return stmt.eval(context, env, trap);
				} catch(e) {
					if (errorLevel === 1) {
						console.warn(e.message);
					}
				};
				return;
			}
			return stmt.eval(context, env, trap);
		};

		var results = [];
		for (var i = 0; i < this.stmts.length; i ++) {
			var stmt = this.stmts[i];
			// Lets be called...
			var vars = stringifyEach(stmt.meta.vars);
			var deepVars = stringifyEach(stmt.meta.deepVars || []);
			var isDirectEventTarget = (env.references || []).filter(f => vars.filter(v => (v + '.').startsWith(f + '.')).length);
			var isIndirectEventTarget = (env.references || []).filter(f => deepVars.filter(v => (v + '.').startsWith(f + '.')).length);
			if (!env.references || !env.references.length 
			|| (isDirectEventTarget = isDirectEventTarget.length)
			|| (isIndirectEventTarget = isIndirectEventTarget.length)) {
				if (stmt instanceof ReturnInterface) {
					return callEval(stmt, context, !isDirectEventTarget ? env : null, trap);
				}
				results[i] = callEval(stmt, context, !isDirectEventTarget ? env : null, trap);
				// Add this change for subsequent statements
				if (env.references && (stmt instanceof AssignmentInterface)) {
					env.references = env.references.concat(stringifyEach([stmt.reference]));
				}
			}
		}

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
	static parse(expr, parseCallback, params = {}, Static = Block) {
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
