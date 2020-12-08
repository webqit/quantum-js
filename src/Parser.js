
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
		var vars = [], deepVars = [], varsUnlodged = [], deepVarsUnlodged = [];
		var parsed = Expr.parse(expr, (_expr, _grammar, _params = {}) => {
			var subStmt = this.parse(_expr, _grammar, _params ? _merge({}, params, _params) : params);
			if (subStmt instanceof ReferenceInterface) {
				var hasCallHead, _context = subStmt;
				while(_context = _context.context) {
					if (_context instanceof CallInterface) {
						hasCallHead = true;
					}
				}
				if (!hasCallHead && subStmt.role !== 'CONTEXT') {
					if (_params.lodge) {
						varsUnlodged.push(subStmt);
					} else {
						vars.push(subStmt);
					}
				}
			} else if (subStmt instanceof CallInterface) {
				varsUnlodged.push(subStmt);
			}
			if (subStmt) {
				subStmt.meta.vars.forEach(_var => vars.push(_var));
				subStmt.meta.deepVars.forEach(_var => deepVars.push(_var));
			}
			return subStmt;
		}, params);

		// Add/remove vars to scope
		if (parsed) {
			if (parsed instanceof IndependentExprInterface) {
				parsed.meta = {
					vars: [], deepVars: [], varsUnlodged: [], deepVarsUnlodged: [], 
				}
			} else {
				parsed.meta = {
					vars, deepVars, varsUnlodged, deepVarsUnlodged,
				};
			}
			if ((parsed instanceof CallInterface)) {
				if (parsed.reference.context && !(parsed.reference.context instanceof CallInterface)) {
					parsed.meta.vars.push(parsed.reference.context);
				}
			} else if ((parsed instanceof IfInterface)) {
				if (parsed.onTrue) {
					parsed.onTrue.meta.vars.concat(parsed.onTrue.meta.deepVars).forEach(_var => {
						_remove(parsed.meta.vars, _var);
						parsed.meta.deepVars.push(_var);
					});
					parsed.onTrue.meta.varsUnlodged.concat(parsed.onTrue.meta.deepVarsUnlodged).forEach(_var => {
						_remove(parsed.meta.varsUnlodged, _var);
						parsed.meta.deepVarsUnlodged.push(_var);
					});
				}
				if (parsed.onFalse) {
					parsed.onFalse.meta.vars.concat(parsed.onFalse.meta.deepVars).forEach(_var => {
						_remove(parsed.meta.vars, _var);
						parsed.meta.deepVars.push(_var);
					});
					parsed.onFalse.meta.varsUnlodged.concat(parsed.onFalse.meta.deepVarsUnlodged).forEach(_var => {
						_remove(parsed.meta.varsUnlodged, _var);
						parsed.meta.deepVarsUnlodged.push(_var);
					});
				}
			}
			if (_isArray(params.explain)) {
				params.explain.push(expr + ' >>------------->> ' + parsed.jsenType);
			}
		}
		return parsed;
	}
};