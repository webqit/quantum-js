
/**
 * @imports
 */
import _merge from '@onephrase/util/obj/merge.js';
import _isEmpty from '@onephrase/util/js/isEmpty.js';
import _remove from '@onephrase/util/arr/remove.js';
import _isArray from '@onephrase/util/js/isArray.js';
import _instanceof from '@onephrase/util/js/instanceof.js';
import ReferenceInterface from './Expr/ReferenceInterface.js';
import CallInterface from './Expr/CallInterface.js';
import IndependentExprInterface from './IndependentExprInterface.js';
import IfInterface from './Expr/IfInterface.js';
import SyntaxError from './SyntaxError.js';

/**
 * ---------------------------
 * Jsen (base) class
 * ---------------------------
 */				
const cache = {};
export default class Jsen {
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, Parsers, params = {}) {
		if (expr.length) {
			if (cache[expr] && !Parsers && params.allowCache !== false) {
				var _parsed;
				if (_parsed = this.parseOne(expr, cache[expr], params)) {
					return _parsed;
				}
			}
			// -----------------------------
			var parsers = Object.values(Parsers || this.grammars);
			for (var i = 0; i < parsers.length; i ++) {
				var parsed = this.parseOne(expr, parsers[i], params);
				if (parsed) {
					if (!Parsers && params.allowCache !== false) {
						cache[expr] = parsers[i];
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

	static parseOne(expr, Parser, params = {}) {
		// From this point forward, all vars is within current scope
		var vars = [], deepVars = [],
			varsUnlodged = [], deepVarsUnlodged = [];
		var parsed = Parser.parse(expr, (_expr, _Parsers, _params = {}) => {
			var subStmt = this.parse(_expr, _Parsers, _params ? _merge({}, params, _params) : params);
			if (_instanceof(subStmt, ReferenceInterface) || _instanceof(subStmt, CallInterface)) {
				if (_params.lodge !== false) {
					vars.push(subStmt);
				} else {
					varsUnlodged.push(subStmt);
				}
			}
			if (subStmt) {
				if (_params.lodge !== false) {
					subStmt.meta.vars.forEach(_var => vars.push(_var));
					subStmt.meta.deepVars.forEach(_var => deepVars.push(_var));
				} else {
					subStmt.meta.varsUnlodged.forEach(_var => varsUnlodged.push(_var));
					subStmt.meta.deepVarsUnlodged.forEach(_var => deepVarsUnlodged.push(_var));
				}
			}
			return subStmt;
		}, params);

		// Add/remove vars to scope
		if (parsed) {
			if (!parsed.meta) {
				parsed.meta = {};
			}
			parsed.meta.vars = vars;
			parsed.meta.deepVars = deepVars;
			parsed.meta.varsUnlodged = varsUnlodged;
			parsed.meta.deepVarsUnlodged = deepVarsUnlodged;
			if (_instanceof(parsed, CallInterface)) {
				if (parsed.reference.context) {
					parsed.meta.vars.push(parsed.reference.context);
				}
			} else if (_instanceof(parsed, IndependentExprInterface)) {
				parsed.meta.vars.splice(0);
				parsed.meta.deepVars.splice(0);
				parsed.meta.varsUnlodged.splice(0);
				parsed.meta.deepVarsUnlodged.splice(0);
			} else if (_instanceof(parsed, IfInterface)) {
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