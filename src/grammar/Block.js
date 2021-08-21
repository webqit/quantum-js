
/**
 * @imports
 */
import Lexer from '@webqit/util/str/Lexer.js';
import _copy from '@webqit/util/obj/copy.js';
import _flatten from '@webqit/util/arr/flatten.js';
import _arrAfter from '@webqit/util/arr/after.js';
import _arrStartsWith from '@webqit/util/arr/startsWith.js';
import BlockInterface from './BlockInterface.js';
import IfInterface from './IfInterface.js';
import ReturnInterface from './ReturnInterface.js';
import AssignmentInterface from './AssignmentInterface.js';
import DeletionInterface from './DeletionInterface.js';
import ReferenceInterface from './ReferenceInterface.js';
import VariableDecInterface from './VariableDecInterface.js';
import { referencesToPaths } from '../util.js';
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
	constructor(stmts, delims) {
		super();
		this.stmts = stmts || [];
		this.delims = delims;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {

		params = { ...params };
		var returned, returnCallback = params.returnCallback;
		params.returnCallback = flag => {
			returned = flag;
		};

		// Current!
		context = Scope.create(context, params);
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
			var reads = getReadPaths(stmt);
			var deepReads = getReadPaths(stmt, true);
			var isDirectEventTarget = (params.references || []).filter(ref => reads.filter(v => _arrStartsWith(v, ref)).length);
			var isIndirectEventTarget = (params.references || []).filter(ref => deepReads.filter(v => _arrStartsWith(v, ref)).length);
			var isFirstRunOrDirectOrIndirectReference = !params.references || !params.references.length || (isDirectEventTarget = isDirectEventTarget.length) || (isIndirectEventTarget = isIndirectEventTarget.length);
			var isLocalAssignmentInEventbasedRuntime = params.references/** On the event-based runtime for... */ && context.params.scopeType === 2/** ...onTrue/onFalse blocks */ && (stmt instanceof AssignmentInterface) && stmt.initKeyword/** Local assignments within it ... might be needed by selected references */;
			var changedVariables = [];
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
				if (params.references) {
					if ((((stmt instanceof AssignmentInterface) || (stmt instanceof DeletionInterface)) && (changedVariables = [stmt]))
					|| ((stmt instanceof VariableDecInterface) && (changedVariables = stmt.declarations))) {
						params.references = params.references.concat(referencesToPaths(changedVariables.map(stmt => stmt.reference)));
					}
				}
			} else if (params.references && (
				((stmt instanceof AssignmentInterface) && (changedVariables = [stmt])) || ((stmt instanceof VariableDecInterface) && (changedVariables = stmt.declarations))
			)) {
				changedVariables.forEach(stmt => {
					if (stmt.val instanceof ReferenceInterface) {
						// E.g: app = document.state; (This statement won't evaluate above if reference was "document.state.something")
						// So we need to record that app.something has changed
						params.references = params.references.slice(0);
						let basePath = referencesToPaths([stmt.reference])[0], // app
							leafPath = referencesToPaths([stmt.val])[0]; // document.state
						params.references.forEach(ref/** document.state.something */ => {
							if (_arrStartsWith(ref, leafPath)) {
								// app.something
								params.references.push(basePath.concat(_arrAfter(ref, leafPath)));
							}
						});
					}
				});
			}
		}

		return this.delims[this.delims.length - 1] === ',' ? results.pop() : results;
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
		return this.stmts.map((stmt, i) => stmt.stringify(params) + (this.delims[i] || '')).join(' ');
	}
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var _parse;
		if (params.delim === ',') {
			params = { ...params };
			delete params.delim;
			_parse = Lexer.lex(expr, [',']);
		} else {
			_parse = Lexer.lex(expr + ';', [ Block.testBlockEnd ]);
		}
		if (_parse.matches.length) {
			var statements = [];
			var delims = [];
			_parse.tokens.forEach((stmt, i) => {
				if (!(stmt = stmt.trim())) {
					return;
				}
				statements.push(stmt);
				delims.push(_parse.matches[i]);
			});
			delims.pop(); // IMPORTANT: The last one that will always be undefined
			return new this(
				statements.map(stmt => parseCallback(stmt, null, params)),
				delims,
			);
		}
	}
	
	/**
	 * @inheritdoc
	 */

	static parseSingleOrMultiple(expr, parseCallback, params = {}) {
		var _parse = parseCallback(expr, [ this ], { ...params, delim: ',', assert: false });
		if (!_parse) {
			_parse = parseCallback(expr, null, params);
		} else if (_parse.stmts.length === 1) {
			_parse = _parse.stmts[0];
		}
		return _parse;
	}

	static testBlockEnd(a, b, tokens) {
		// Cases of code blocks that won't end in ";"
		if (a.endsWith('}') && !b.trim().startsWith('else')) {
			return '';
		}
		if (b.startsWith("\r\n")) {
			return "\r\n";
		}
		if (b.startsWith(';')) {
			return ';';
		}
		if (b.startsWith(',')) {
			var ongoingToken = tokens.length && tokens[tokens.length - 1];
			if (ongoingToken.startsWith('var') || ongoingToken.startsWith('let') || ongoingToken.startsWith('const') || ongoingToken.startsWith('return')) {
				return false;
			}
			return ',';
		}
		return false;
	}
};

/**
 * @prop array
 */
Block.operators = [];

const getReadPaths = (stmt, deep = false) => {
	if (!stmt.$readPaths) {
		stmt.$readPaths = referencesToPaths(stmt.meta.reads || []);
		stmt.$deepReadPaths = referencesToPaths(stmt.meta.deep.reads || []);
	}
	return deep ? stmt.$deepReadPaths : stmt.$readPaths;
};
