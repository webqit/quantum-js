
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
import ReferenceInterface from './ReferenceInterface.js';
import { referencesToPaths, pathStartsWith, pathAfter } from '../util.js';
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

		params = {...params};
		var returned, returnCallback = params.returnCallback;
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
			var isDirectEventTarget = (params.references || []).filter(ref => reads.filter(v => pathStartsWith(v, ref)).length);
			var isIndirectEventTarget = (params.references || []).filter(ref => deepReads.filter(v => pathStartsWith(v, ref)).length);
			var isFirstRunOrDirectOrIndirectReference = !params.references || !params.references.length || (isDirectEventTarget = isDirectEventTarget.length) || (isIndirectEventTarget = isIndirectEventTarget.length);
			var isLocalAssignmentInEventbasedRuntime = params.references/** On the event-based runtime for... */ && context.params.type === 2/** ...onTrue/onFalse blocks */ && (stmt instanceof AssignmentInterface) && stmt.initKeyword/** Local assignments within it ... might be needed by selected references */;
			if (isFirstRunOrDirectOrIndirectReference/** || (isLocalAssignmentInEventbasedRuntime Experimental and currently disabled */) {
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
			} else if (params.references && (stmt instanceof AssignmentInterface) && (stmt.val instanceof ReferenceInterface)) {
				// E.g: app = document.state; (This statement won't evaluate above if reference was "document.state.something")
				// So we need to record that app.something has changed
				params.references = params.references.slice(0);
				let basePath = referencesToPaths([stmt.reference])[0], // app
					leafPath = referencesToPaths([stmt.val])[0]; // document.state
				params.references.forEach(ref/** document.state.something */ => {
					if (pathStartsWith(ref, leafPath)) {
						// app.something
						params.references.push(basePath.concat(pathAfter(ref, leafPath)));
					}
				});
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
