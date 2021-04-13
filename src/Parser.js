
/**
 * @imports
 */
import _merge from '@webqit/util/obj/merge.js';
import _isEmpty from '@webqit/util/js/isEmpty.js';
import _remove from '@webqit/util/arr/remove.js';
import _isArray from '@webqit/util/js/isArray.js';
import ReferenceInterface from './grammar/ReferenceInterface.js';
import CallInterface from './grammar/CallInterface.js';
import IndependentExprInterface from './IndependentExprInterface.js';
import IfInterface from './grammar/IfInterface.js';
import SyntaxError from './SyntaxError.js';

/**
 * ---------------------------
 * Parser class
 * ---------------------------
 */				
const cache = {};
export default class Parser {
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, grammar, params = {}) {
		if (expr.length) {
			if (cache[expr] && !grammar && params.allowCache !== false) {
				var _parsed;
				if (_parsed = this.parseOne(expr, cache[expr], params)) {
					return _parsed;
				}
			}
			// -----------------------------
			var _grammar = Object.values(grammar || this.grammar);
			for (var i = 0; i < _grammar.length; i ++) {
				var parsed = this.parseOne(expr, _grammar[i], params);
				if (parsed) {
					if (!grammar && params.allowCache !== false) {
						cache[expr] = _grammar[i];
					}
					return parsed;
				}
			}
			// -----------------------------
			if (params.assert === false) {
				return;
			}
			throw new SyntaxError(expr);
		}
	}
	 
	/**
	 * @inheritdoc
	 */

	static parseOne(expr, Expr, params = {}) {
		// From this point forward, all vars is within current scope
		var meta = createMeta();
		var parsed = Expr.parse(expr, (_expr, _grammar, _params = {}) => {
			var subStmt = this.parse(_expr, _grammar, _params ? _merge({}, params, _params) : params);
			if (subStmt instanceof ReferenceInterface) {
				var hasCallHead, _context = subStmt;
				while(_context = _context.context) {
					if (_context instanceof CallInterface) {
						hasCallHead = true;
					}
				}
				subStmt.role = _params.role;
				if (!hasCallHead && _params.role !== 'CONTEXT') {
					var type = _params.role === 'ASSIGNMENT_SPECIFIER' ? 'writes' 
						: (_params.role === 'DELETION_SPECIFIER' ? 'deletes' 
							: (_params.role === 'CALL_SPECIFIER' ? '_calls' : 'reads'));
					meta[type].push(subStmt);
				}
			} else if (subStmt instanceof CallInterface) {
				meta.calls.push(subStmt);
			}
			if (subStmt) {
				Object.keys(subStmt.meta).forEach(type => {
					if (type === 'deep') return;
					subStmt.meta[type].forEach(_var => meta[type].push(_var));
				});
				Object.keys(subStmt.meta.deep).forEach(type => {
					if (!meta.deep[type]) {
						meta.deep[type] = [];
					}
					subStmt.meta.deep[type].forEach(_var => meta.deep[type].push(_var));
				});
			}
			return subStmt;
		}, params);

		// Add/remove vars to scope
		if (parsed) {
			if (parsed instanceof IndependentExprInterface) {
				parsed.meta = createMeta();
			} else {
				parsed.meta = meta;
			}
			if (parsed instanceof CallInterface) {
				if (parsed.reference.context && !(parsed.reference.context instanceof CallInterface)) {
					parsed.meta.reads.push(parsed.reference.context);
				}
			} else if ((parsed instanceof IfInterface)) {
				['onTrue', 'onFalse'].forEach(branch => {
					if (parsed[branch]) {
						Object.keys(createMeta()).forEach(type => {
							if (type === 'deep') return;
							var variables = parsed.onTrue.meta[type].concat(parsed.onTrue.meta.deep[type] || []);
							variables.forEach(_var => {
								_remove(parsed.meta[type], _var);
								if (!parsed.meta.deep[type]) {
									parsed.meta.deep[type] = [];
								}
								parsed.meta.deep[type].push(_var);
							});
						});
					}
				});
			}
			if (_isArray(params.explain)) {
				params.explain.push(expr + ' >>------------->> ' + parsed.jsenType);
			}
		}
		return parsed;
	}
};

function createMeta() {
	return {reads: [], writes: [], deletes: [], calls: [], _calls: [], deep: {},};
};