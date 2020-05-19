
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
	static parse(expr, Parsers, params = {}, Static = Jsen) {
		if (expr.length) {
			if (cache[expr]) {
				var _parsed;
				if (_parsed = Jsen.parseOne(expr, cache[expr], params, Static)) {
					return _parsed;
				}
			}
			// -----------------------------
			var parsers = Object.values(Parsers || Static.grammars);
			for (var i = 0; i < parsers.length; i ++) {
				var parsed = Jsen.parseOne(expr, parsers[i], params, Static);
				if (parsed) {
					if (!Parsers) {
						cache[expr] = parsers[i];
					}
					return parsed;
				}
			}
			// -----------------------------
			if (params.assert === false) {
				return;
			}
			throw new Error('[Syntax error:] ' + expr);
		}
	}
	 
	/**
	 * @inheritdoc
	 */

	static parseOne(expr, Parser, params = {}, Static = Jsen) {
		// From this point forward, all vars is within current scope
		var vars = []
		var parsed = Parser.parse(expr, (_expr, _Parsers, _params = {}) => {
			var subStmt = Jsen.parse(_expr, _Parsers, _params ? _merge(params, _params) : params, Static);
			if (_params.lodge !== false) {
				if (_instanceof(subStmt, ReferenceInterface) || _instanceof(subStmt, CallInterface)) {
					vars.push(subStmt);
				} else if (subStmt && !_instanceof(subStmt, FuncInterface) && !_instanceof(subStmt, IfInterface)) {
					subStmt.meta.vars.forEach(_var => vars.push(_var));
				}
			}
			return subStmt;
		});
		// Add/remove vars to scope
		if (parsed) {
			if (!parsed.meta) {
				parsed.meta = {};
			}
			parsed.meta.vars = vars;
			if (_isArray(params.explain)) {
				params.explain.push(expr + ' >>------------->> ' + parsed.jsenType);
			}
		}
		return parsed;
	}
};