
/**
 * @imports
 */
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import _each from '@webqit/util/obj/each.js';
import { _isString } from '@webqit/util/js/index.js';
import ObjInterface from './ObjInterface.js';
import StrInterface from './StrInterface.js';
import Lexer from '@webqit/util/str/Lexer.js';

/**
 * ---------------------------
 * Object utils
 * ---------------------------
 */				

const Obj = class extends ObjInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(entries) {
		super();
		this.entries = entries || new Map;
	}
	
	/**
	 * @inheritdoc
	 */
	inherit(Super) {
		if (Super instanceof ObjInterface) {
			Array.from(Super.entries.keys()).forEach(key => {
				if (!this.entries.has(key)) {
					this.entries.set(key, Super.entries.get(key));
				}
			});
		}
		return this;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		var items = {};
		Array.from(this.entries.keys()).forEach(key => {
			var name = _isString(key) ? key : key.eval(context, params);
			var val = this.entries.get(key);
			if (val) {
				val = val.eval(context, params);
			} else {
				val = name;
			}
			items[name] = val;
		});
		return items;
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
		var str = [];
		Array.from(this.entries.keys()).forEach(key => {
			var name = key, value = this.entries.get(key);
			if (!_isString(name)) {
				name = key.stringify(params);
				if (!(key instanceof StrInterface)) {
					name = `[${name}]`;
				}
			}
			if (value && !value.byShorthand) {
				str.push(name + Obj.operators.sub + ' ' + value.stringify(params));
			} else {
				str.push(name);
			}
		});
		return '{ ' + str.join(Obj.operators.sup + ' ') + ' }';
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		if (_wrapped(expr, '{', '}') && !Lexer.match(expr.trim(), [' ']).length) {
			var entries = new Map;
			var _entriesSplit = Lexer.split(_unwrap(expr, '{', '}'), [Obj.operators.sup])
				.map(n => n.trim()).filter(n => n);
			_each(_entriesSplit, (key, expr) => {
				var entry = Lexer.split(expr, [Obj.operators.sub], {limit:1}/*IMPORTANT*/);
				var name = entry.shift().trim(), value;
				if (_wrapped(name, '"', '"') || _wrapped(name, "'", "'") || _wrapped(name, '[', ']')) {
					if (_wrapped(name, '[', ']')) {
						name = name.slice(1, -1);
					} else if (!entry.length) {
						// Syntax error
						return;
					}
					name = parseCallback(name, null, params);
				}
				if (entry.length) {
					if (!entry[0]) {
						// Syntax error
						return;
					}
					value = parseCallback(entry[0].trim(), null, params);
				} else if (_isString(name)) {
					value = parseCallback(name, null, params);
					value.byShorthand = true;
				}
				entries.set(name, value);
			});
			return new this(entries);
		}
	}
};

/**
 * @prop object
 */
Obj.operators = {
	sup: ',',
	sub: ':',
};

/**
 * @exports
 */
export default Obj;
