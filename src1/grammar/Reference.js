
/**
 * @imports
 */
import _isUndefined from '@webqit/util/js/isUndefined.js';
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import Lexer from '@webqit/util/str/Lexer.js';
import ReferenceInterface from './ReferenceInterface.js';
import ExprInterface from '../ExprInterface.js';
import Scope from '../Scope.js';
import SyntaxError from '../SyntaxError.js';
import ReferenceError from '../ReferenceError.js';

/**
 * ---------------------------
 * Reference class
 * ---------------------------
 */				

export default class Reference extends ReferenceInterface {

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
		var isRootVar = !this.context;
		return {
			get() {
				return Scope.create(sourceContext, params).get(name, params.trap);
			},
			del() {
				return Scope.create(sourceContext, params).del(name, params.trap);
			},
			has(prop) {
				return Scope.create(sourceContext, params).has(name, prop, params.trap);
			},
			set(val, initKeyword = null) {
				return Scope.create(sourceContext, params).set(name, val, params.trap, initKeyword, isRootVar);
			},
			exec(args) {
				return Scope.create(sourceContext, params).exec(name, args, params.trap);
			},
		};
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		try {
			return this.getEval(context, params).get();
		} catch(e) {
			if (e instanceof ReferenceError) {
				throw new ReferenceError('[' + this + ']: ' + e.message);
			} else {
				throw e;
			}
		}
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
		var name = this.name;
		if (this.context) {
			var subjectContext = this.context.stringify(params);
			if (name instanceof ExprInterface) {
				name = '[' + name.stringify(params) + ']';
			} else if (this.backticks) {
				name = '`' + name + '`';
			}
		} else {
			var subjectContext = params.context;
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
				context = parseCallback(splits.join(''), null, {role: 'CONTEXT'});
			}
			if (_wrapped(name, '[', ']')) {
				if (!context) {
					throw new SyntaxError(expr);
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
