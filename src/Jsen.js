
/**
 * @imports
 */
import _merge from '@web-native-js/commons/obj/merge.js';
import _remove from '@web-native-js/commons/arr/remove.js';
import _isArray from '@web-native-js/commons/js/isArray.js';
import _instanceof from '@web-native-js/commons/js/instanceof.js';
import ReferenceInterface from './Expr/ReferenceInterface.js';
import CallInterface from './Expr/CallInterface.js';

/**
 * ---------------------------
 * Jsen (base) class
 * ---------------------------
 */				

const Jsen = class {
	 
	/**
	 * @inheritdoc
	 */
	static parse(expr, Parsers, params = {}, Static = Jsen) {
		if (!params.meta) {
			params.meta = {vars: []};
		}
		if (expr.length) {
			var parsers = Object.values(Parsers || Static.grammars);
			for (var i = 0; i < parsers.length; i ++) {
				// From this point forward, all vars is within current scope
				var varsScope = params.meta && _isArray(params.meta.vars) ? params.meta.vars.length : 0;
				var parsed = parsers[i].parse(expr, (_expr, _Parsers, _params = {}) => Jsen.parse(_expr, _Parsers, _params ? _merge(params, _params) : params, Static));
				// Add/remove vars to scope
				if (parsed) {
					if (!parsed.meta) {
						parsed.meta = {};
					}
					// Reap vars into scope expr
					parsed.meta.vars = params.meta.vars.slice(varsScope);
					// Add vars to scope
					if (_instanceof(parsed, ReferenceInterface) || _instanceof(parsed, CallInterface)) {
						_remove(parsed.meta.vars, parsed.context);
						_remove(params.meta.vars, parsed.context);
						params.meta.vars.push(parsed);
					} 
				}
				if (parsed && _isArray(params.explain)) {
					params.explain.push(expr + ' >>------------->> ' + parsed.jsenType);
				}
				if (parsed) {
					return parsed;
				}
			}
			if (params.assert === false) {
				return;
			}
			throw new Error('[Syntax error:] ' + expr);
		}
	}
};

/**
 * @exports
 */
export default Jsen;
