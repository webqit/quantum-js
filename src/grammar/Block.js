
/**
 * @imports
 */
import Lexer from '@webqit/util/str/Lexer.js';
import _copy from '@webqit/util/obj/copy.js';
import _flatten from '@webqit/util/arr/flatten.js';
import BlockInterface from './BlockInterface.js';
import IfInterface from './IfInterface.js';
import ReturnInterface from './ReturnInterface.js';
import AssignmentInterface from './AssignmentInterface.js';
import DeletionInterface from './DeletionInterface.js';
import { referencesToPaths, pathStartsWith } from '../util.js';
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

		var returned, returnCallback = params.returnCallback;
		params = {...params};
		params.returnCallback = flag => {
			returned = flag;
		};

		// Current!
		context = Scope.create(context);
		var callEval = (stmt, context, _params) => {
			try {
				return stmt.eval(context, _params);
			} catch(e) {
				if (_params.catch) {
					_params.catch(e);
				}
			};
		};
		
		var results = [], skippedAbort;
		for (var i = 0; i < this.stmts.length; i ++) {
			var stmt = this.stmts[i];
			// Lets be called...
			var reads = referencesToPaths(stmt.meta.reads);
			var deepReads = referencesToPaths(stmt.meta.deep.reads || []);
			var isDirectEventTarget = (params.references || []).filter(f => reads.filter(v => pathStartsWith(v, f)).length);
			var isIndirectEventTarget = (params.references || []).filter(f => deepReads.filter(v => pathStartsWith(v, f)).length);
			if (!params.references || !params.references.length 
			|| (isDirectEventTarget = isDirectEventTarget.length)
			|| (isIndirectEventTarget = isIndirectEventTarget.length)) {
				var _params = params;
				if (isDirectEventTarget) {
					_params = {...params};
					delete _params.references;
				}
				results[i] = callEval(stmt, context, _params);
				if (stmt instanceof ReturnInterface || returned) {
					if (returnCallback) {
						returnCallback(true);
					}
					return results[i];
				}
				if (stmt instanceof IfInterface)
				if (((stmt instanceof IfInterface) && stmt.abortive) || returned === false) {
					skippedAbort = true;
					if (returnCallback) {
						returnCallback(false);
					}
				}
				// Add this change for subsequent statements
				// This is a local change!
				if (params.references && ((stmt instanceof AssignmentInterface) || (stmt instanceof DeletionInterface))) {
					params.references = params.references.concat(referencesToPaths([stmt.reference]));
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
