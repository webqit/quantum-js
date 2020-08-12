
/**
 * @imports
 */
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import ReferenceInterface from './ReferenceInterface.js';
import ExprInterface from '../ExprInterface.js';
import Scope from '../Scope.js';

/**
 * ---------------------------
 * Reference class
 * ---------------------------
 */				

const Reference = class extends ReferenceInterface {

	/**
	 * @inheritdoc
	 */
	constructor(context, name, backticks = false) {
		super();
		this.context = context;
		this.name = name;
		this.backticks = backticks;
	}
	 
	/**
	 * @inheritdoc
	 */
	getEval(context = null, params = {}) {
		var sourceContext = context, name = this.name;
		if (this.context) {
			if (name instanceof ExprInterface) {
				name = name.eval(context, params);
			}
			sourceContext = this.context.eval(context, params);
		}
		return {context:sourceContext, name:name,};
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		var parts = this.getEval(context, params);
		if (!_isUndefined(parts.context) && !_isUndefined(parts.name)) {
			return Scope.create(parts.context).get(parts.name, params.trap);
		}
		throw new Error('[Reference Error][' + this + ']: "' + (this.context || this) + '" is undefined!');
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		var name = this.name;
		if (this.context) {
			var subjectContext = this.context.toString(context);
			if (name instanceof ExprInterface) {
				name = '[' + name.toString(context) + ']';
			} else if (this.backticks) {
				name = '`' + name + '`';
			}
		} else {
			var subjectContext = context;
			if (this.backticks) {
				name = '`' + name + '`';
			}
		}
		return (subjectContext || '') + (subjectContext && !name.startsWith('[') ? Reference.separator : '') + name;
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (!Lexer.match(expr.trim(), [' ']).length) {
			var splits = Lexer.split(expr, []);
			// ------------------------
			// name, first
			// ------------------------
			var context, name = splits.pop(), backticks;
			var nameSplit = Lexer.split(name.trim(), [this.separator], {preserveDelims:true});
			if (nameSplit.length > 1) {
				name = nameSplit.pop().substr(1);
				splits = splits.concat(nameSplit);
			}
			if (_wrapped(name, '`', '`')) {
				name = _unwrap(name, '`', '`');
				backticks = true;
			}
			// ------------------------
			// context, second
			// ------------------------
			if (splits.length) {
				context = parseCallback(splits.join(''));
				context.isContext = true;
			}
			if (_wrapped(name, '[', ']')) {
				if (!context) {
					throw new Error('Invalid reference: ' + expr + '!');
				}
				name = parseCallback(_unwrap(name, '[', ']'));
			}
			return new this(context, name, backticks);
		}
	}
};

/**
 * @prop string
 */
Reference.separator = '.';

/**
 * @exports
 */
export default Reference;
