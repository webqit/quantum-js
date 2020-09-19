
/**
 * @imports
 */
import Lexer from '@onephrase/util/str/Lexer.js';
import _copy from '@onephrase/util/obj/copy.js';
import _unique from '@onephrase/util/arr/unique.js';
import _before from '@onephrase/util/str/before.js';
import _flatten from '@onephrase/util/arr/flatten.js';
import BlockInterface from './BlockInterface.js';
import ReturnInterface from './ReturnInterface.js';
import AssignmentInterface from './AssignmentInterface.js';
import Scope from '../Scope.js';

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
	eval(context = null, params = {}) {
		// Current!
		params = params ? _copy(params) : {};
		context = Scope.create(context);
		// Stringifies JSEN vars
		var stringifyEach = list => _unique(list.map(expr => _before(_before(expr.toString(), '['), '(')));
		var callEval = (stmt, context, _params) => {
			try {
				return stmt.eval(context, _params);
			} catch(e) {
				if (_params.catch) {
					_params.catch(e);
				}
			};
		};

		var results = [];
		for (var i = 0; i < this.stmts.length; i ++) {
			var stmt = this.stmts[i];
			// Lets be called...
			var vars = stringifyEach(stmt.meta.vars);
			var deepVars = stringifyEach(stmt.meta.deepVars || []);
			var isDirectEventTarget = (params.references || []).filter(f => vars.filter(v => (v + '.').startsWith(f + '.')).length);
			var isIndirectEventTarget = (params.references || []).filter(f => deepVars.filter(v => (v + '.').startsWith(f + '.')).length);
			if (!params.references || !params.references.length 
			|| (isDirectEventTarget = isDirectEventTarget.length)
			|| (isIndirectEventTarget = isIndirectEventTarget.length)) {
				var _params = params;
				if (isDirectEventTarget) {
					_params = _copy(params);
					delete _params.references;
				}
				if (stmt instanceof ReturnInterface) {
					return callEval(stmt, context, _params);
				}
				results[i] = callEval(stmt, context, _params);
				// Add this change for subsequent statements
				if (params.references && (stmt instanceof AssignmentInterface)) {
					params.references = params.references.concat(stringifyEach([stmt.reference]));
				}
			}
		}

		return results;
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
		return this.stmts.map(stmt => stmt.stringify(params)).join(this.delim);
	}
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var parse = Lexer.lex(expr + ';', _flatten(this.operators).concat([Block.testBlockEnd]));
		if (parse.matches.length) {
			return new this(
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
