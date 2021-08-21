
/**
 * @imports
 */
import _copy from '@webqit/util/obj/copy.js';
import _each from '@webqit/util/obj/each.js';
import _flatten from '@webqit/util/arr/flatten.js';
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import Lexer from '@webqit/util/str/Lexer.js';
import FuncInterface from './FuncInterface.js';
import Block from './Block.js';
import Scope from '../Scope.js';

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
		this.statements.isIndependent = true;
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
	eval(context = null, params = {}) {
		var instance = this;
		params = {...params};
		delete params.returnCallback;
		return function(...args) {
			var newMainContext = {};
			_each(Object.keys(instance.paramters), (i, name) => {
				var defaultVal = instance.paramters[name];
				if (args.length - 1 < i && !defaultVal) {
					throw new Error('The parameter "' + name + '" is required.');
				}
				newMainContext[name] = args.length > i 
					? args[i] 
					: (instance.paramters[name] 
						? instance.paramters[name].eval(context, params) 
						: null);
			});
			if (!instance.arrowFunctionFormatting) {
				newMainContext['this'] = this;
			}
			// But this newer context should come first
			var errorLevel = context instanceof Scope ? context.params.errorLevel : undefined;
			var nestedContext = new Scope({main:newMainContext, super:context}, {errorLevel});
			var retrn = instance.statements.eval(nestedContext, params);
			if (instance.arrowFunctionFormatting.body === false) {
				return retrn[0];
			}
			return retrn;
		};
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
		var paramters = [];
		_each(this.paramters, (name, value) => {
			paramters.push(name + (value ? '=' + value.stringify(params) : ''));
		});
		if (this.arrowFunctionFormatting) {
			var headNoWrap = this.arrowFunctionFormatting.head === false || (paramters.length === 1 && paramters[0].indexOf('=') === -1);
			var bodyNoWrap = this.arrowFunctionFormatting.body === false
			return (headNoWrap ? paramters[0] : '(' + paramters.join(', ') + ')')
			+ ' => ' + (bodyNoWrap ? this.statements.stringify(params) : '{' + this.statements.stringify(params) + '}');
		}
		return 'function (' + paramters.join(', ') + ') {' + this.statements.stringify(params) + '}';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
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
				paramters[paramSplit[0].trim()] = parseCallback(paramSplit[1].trim(), null, {
					// Any varaibles should be added to public vars
					meta: null,
				});
			} else {
				paramters[param.trim()] = null;
			}
		});
		var block = parseCallback(funcBody, [Block], {assert:false}) || parseCallback(funcBody, null, {
			// Any varaibles should be added to public vars
			meta: null,
		});
		return new this(
			paramters,
			block.jsenType === 'Block' ? block : new Block([block]),
			arrowFunctionFormatting,
		);
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