
/**
 * @imports
 */
import _merge from '@web-native-js/commons/obj/merge.js';
import _isEmpty from '@web-native-js/commons/js/isEmpty.js';
import _remove from '@web-native-js/commons/arr/remove.js';
import _isArray from '@web-native-js/commons/js/isArray.js';
import _instanceof from '@web-native-js/commons/js/instanceof.js';
import ReferenceInterface from './Expr/ReferenceInterface.js';
import CallInterface from './Expr/CallInterface.js';
import FuncInterface from './Expr/FuncInterface.js';
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
		var vars = [], deepVars = [];
		var parsed = Parser.parse(expr, (_expr, _Parsers, _params = {}) => {
			var subStmt = this.parse(_expr, _Parsers, _params ? _merge(params, _params) : params);
			if (_params.lodge !== false) {
				if (_instanceof(subStmt, ReferenceInterface) || _instanceof(subStmt, CallInterface)) {
					vars.push(subStmt);
				}
				if (subStmt) {
					subStmt.meta.vars.forEach(_var => vars.push(_var));
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
			parsed.meta.deepVars = [];
			parsed.meta.deepVars = [];
			if (_instanceof(parsed, CallInterface)) {
				if (parsed.reference.context) {
					parsed.meta.vars.push(parsed.reference.context);
				}
			} else if (_instanceof(parsed, FuncInterface)) {
				parsed.meta.vars.splice(0);
			} else if (_instanceof(parsed, IfInterface)) {
				if (parsed.onTrue) {
					parsed.onTrue.meta.vars.forEach(_var => {
						_remove(parsed.meta.vars, _var);
						parsed.meta.deepVars.push(_var);
					});
				}
				if (parsed.onFalse) {
					parsed.onFalse.meta.vars.forEach(_var => {
						_remove(parsed.meta.vars, _var);
						parsed.meta.deepVars.push(_var);
					});
				}
			} else {
				parsed.meta.vars.push(...deepVars);
			}
			if (_isArray(params.explain)) {
				params.explain.push(expr + ' >>------------->> ' + parsed.jsenType);
			}
		}
		return parsed;
	}
};