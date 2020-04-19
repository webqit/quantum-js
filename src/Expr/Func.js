
/**
 * @imports
 */
import _copy from '@web-native-js/commons/obj/copy.js';
import _each from '@web-native-js/commons/obj/each.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import FuncInterface from './FuncInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '../Lexer.js';
import Statements from './Statements.js';

/**
 * ---------------------------
 * Func class
 * ---------------------------
 */				

const Func = class extends FuncInterface {
	 
	/**
	 * @inheritdoc
	 */
	constructor(paramters, statements, arrowFunctionFormatting = {}) {
		super();
		this.paramters = paramters || {};
		this.statements = statements;
		this.arrowFunctionFormatting = arrowFunctionFormatting;
	}
	
	/**
	 * @inheritdoc
	 */
	inherit(Super) {
		if (Super instanceof FuncInterface) {
			var parentParams = Object.keys(Super.paramters);
			var ownParams = Object.keys(this.paramters);
			for (var i = 0; i < Math.max(ownParams.length, parentParams.length); i ++) {
				var nameInParent = parentParams[i];
				var nameInSelf = ownParams[i];
				if (!nameInSelf && nameInParent) {
					throw new Error('Parameter #' + i + ' (' + nameInParent + ') in parent function must be implemented.');
				}
				if (nameInSelf && nameInParent) {
					var defaultValInParent = Super.paramters[nameInParent];
					var defaultValInSelf = this.paramters[nameInSelf];
					if (defaultValInSelf && !defaultValInParent) {
						throw new Error('Parameter #' + i + ' (' + nameInSelf + ') must not have a default value as established in parent function.');
					}
					if (defaultValInSelf && defaultValInParent && defaultValInSelf.jsenType !== defaultValInParent.jsenType) {
						throw new Error('Default value for parameter #' + i + ' (' + nameInSelf + ') must be of type ' + defaultValInParent.jsenType + ' as established in parent function.');
					}
				}
			}
			this.sup = Super;
		}
		return this;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		return (...args) => {
			var newMainContext = {};
			_each(Object.keys(this.paramters), (i, name) => {
				var defaultVal = this.paramters[name];
				if (args.length - 1 < i && !defaultVal) {
					throw new Error('The parameter "' + name + '" is required.');
				}
				newMainContext[name] = args.length > i 
					? args[i] 
					: (this.paramters[name] 
						? this.paramters[name].eval(context, trap) 
						: null);
			});
			// But this newer context should come first
			var nestedContext = new Contexts(newMainContext, context);
			return this.statements.eval(nestedContext, trap);
		};
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		var paramters = [];
		_each(this.paramters, (name, value) => {
			paramters.push(name + (value ? '=' + value.toString(context) : ''));
		});
		if (this.arrowFunctionFormatting) {
			var headNoWrap = this.arrowFunctionFormatting.head === false || (paramters.length === 1 && paramters[0].indexOf('=') === -1);
			var bodyNoWrap = this.arrowFunctionFormatting.body === false
			return (headNoWrap ? paramters[0] : '(' + paramters.join(', ') + ')')
			+ ' => ' + (bodyNoWrap ? this.statements.toString(context) : '{' + this.statements.toString(context) + '}');
		}
		return 'function (' + paramters.join(', ') + ') {' + this.statements.toString(context) + '}';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = Func) {
		expr = expr.trim();
		var splits;
		if (expr.startsWith('function') 
		&& (splits = Lexer.split(expr, []).slice(1).filter(b => b.trim())) && splits.length === 2) {
			var arrowFunctionFormatting = false;
			var funcHead = _unwrap(splits.shift().trim(), '(', ')');
			var funcBody = _unwrap(splits.shift().trim(), '{', '}');
		} else if (!expr.startsWith('function') 
		&& (splits = Lexer.split(expr, ['=>'])) && splits.length === 2) {
			var funcHead = splits.shift().trim();
			var funcBody = splits.shift().trim();
			var arrowFunctionFormatting = {};
			if (_wrapped(funcHead, '(', ')')) {
				funcHead = _unwrap(funcHead, '(', ')');
			} else {
				arrowFunctionFormatting.head = false;
			}
			if (_wrapped(funcBody, '{', '}')) {
				funcBody = _unwrap(funcBody, '{', '}');
			} else {
				arrowFunctionFormatting.body = false;
			}
		} else {
			return;
		}
		var paramters = {};
		Lexer.split(funcHead, [',']).forEach(param => {
			var paramSplit = param.split('=');
			if (paramSplit[1]) {
				paramters[paramSplit[0].trim()] = parseCallback(paramSplit[1].trim());
			} else {
				paramters[param.trim()] = null;
			}
		});
		var statements = parseCallback(funcBody, [Statements], {assert:false}) || parseCallback(funcBody);
		return new Static(paramters, statements, arrowFunctionFormatting);
	}
};

/**
 * @prop object
 */
Func.operators = ['=>',];

/**
 * @exports
 */
export default Func;