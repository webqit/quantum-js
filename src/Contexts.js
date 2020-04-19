
/**
 * @imports
 */
import _isTypeObject from '@web-native-js/commons/js/isTypeObject.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import _isFunction from '@web-native-js/commons/js/isFunction.js';
import _isString from '@web-native-js/commons/js/isString.js';
import _isNumber from '@web-native-js/commons/js/isNumber.js';

/**
 * @exports
 */
export default class Contexts {

	/**
	 * Creates a new context stack.
	 *
	 * @param any		 	mainContext
	 * @param Contexts	 	superContext
	 * @param object	 	localContext
	 * @param object	 	localContextMeta
	 *
	 * @return Contexts
	 */
	constructor(mainContext, superContext = null, localContext = {}, localContextMeta = {}) {
		this.mainContext = mainContext;
		this.superContext = superContext ? Contexts.create(superContext) : null;
		this.localContext = localContext
		this.localContextMeta = localContextMeta
	}
	
	/**
	 * Tries the handler on the different contexts in the stack.
	 *
	 * @param string|number 	prop
	 * @param function		 	callback
	 * @param function		 	final
	 *
	 * @return Contexts
	 */
	handle(prop, callback, final, level = 0) {
		var callMain = () => {
			return callback(this.mainContext, null, () => {
				if (this.superContext) {
					return this.superContext.handle(prop, callback, final, level + 1);
				}
				if (final) {
					return final();
				}
			}, level);
		};
		if (prop === 'toString' && this.localContext.toString === Object.prototype.toString) {
			return callMain();
		}
		return callback(this.localContext, this.localContextMeta, callMain, level);
	}

	/**
	 * Returns a property's value from the first possessing context.
	 *
	 * @param string|number prop
	 * @param object		trap
	 * @param bool			bindThis
	 *
	 * @return mixed
	 */
	get(prop, trap = {}, bindThis = true) {
		if (prop instanceof String) {
			// incase we recieved new String()
			prop = prop + '';
		}
		return this.handle(prop, (contxtObj, contxtMeta, advance, level) => {
			var val = _get(contxtObj, prop, trap);
			// asking first mught not go well generally && _has(this[i], prop, trap)
			if (!_isUndefined(val) || _has(contxtObj, prop, trap)) {
				if (_isFunction(val) && bindThis) {
					return val.bind(contxtObj);
				}
				return val;
			}
			return advance();
		});
	}
	
	/**
	 * Updates a property's value from the first possessing context.
	 * Or adds a new context to set the property.
	 *
	 * @param string|number prop
	 * @param mixed			val
	 * @param object		trap
	 * @param bool			initKeyword
	 *
	 * @return bool
	 */
	set(prop, val, trap = {}, initKeyword = false) {
		if (prop instanceof String) {
			// incase we recieved new String()
			prop = prop + '';
		}
		const _set = (cntxt, prop, val, trap) => {
			if (trap.set) {
				return trap.set(cntxt, prop, val);
			}
			cntxt[prop] = val;
			return true;
		};
		return this.handle(initKeyword ? true : prop, (contxtObj, localContxtMeta, advance) => {
			// Whatever the level of localContext...
			if (localContxtMeta && localContxtMeta[prop] === 'const') {
				throw new Error('CONST ' + prop + 'cannot be modified!');
			}
			// Set this locally, we wont be getting to advance()
			if (initKeyword) {
				if (!['var', 'let', 'const'].includes(initKeyword)) {
					throw new Error('Unrecognized declarator: ' + initKeyword + '!');
				}
				localContxtMeta[prop] = initKeyword;
				return _set(contxtObj, prop, val, trap);
			}
			// For any other contex, it must already exists
			if (_has(contxtObj, prop, trap)) {
				return _set(contxtObj, prop, val, trap);
			}
			return advance();
		}, () => {throw new Error('"' + prop + '" is undefined!');});
	}
	
	/**
	 * Deletes a property from the first possessing context.
	 *
	 * @param string|number prop
	 * @param object		trap
	 *
	 * @return bool
	 */
	del(prop, trap = {}) {
		if (prop instanceof String) {
			// incase we recieved new String()
			prop = prop + '';
		}
		return this.handle(prop, (contxtObj, contxtMeta, advance) => {
			if (_has(contxtObj, prop, trap)) {
				if (trap.deleteProperty || trap.del) {
					return (trap.deleteProperty || trap.del)(contxtObj, prop);
				}
				delete contxtObj[prop];
				return true;
			}
			return advance();
		});
	}

	/**
	 * Tests if a property exists in any context.
	 *
	 * @param string|number prop
	 * @param string|number prop2
	 * @param object		trap
	 *
	 * @return bool
	 */
	has(prop, prop2, trap = {}) {
		if (prop instanceof String) {
			// incase we recieved new String()
			prop = prop + '';
		}
		if (prop2 instanceof String) {
			// incase we recieved new String()
			prop2 = prop2 + '';
		}
		return this.handle(prop, (contxtObj, contxtMeta, advance) => {
			if (_has(contxtObj, prop, trap)) {
				var contextObj2 = _get(contxtObj, prop, trap);
				return _has(contextObj2, prop2, trap);
			}
			return advance();
		}, () => {throw new Error('"' + prop + '" is undefined!');});
	}
	
	/**
	 * Tests if a property exists in any context.
	 *
	 * @param string|number prop
	 * @param array			args
	 * @param object		trap
	 *
	 * @return mixed
	 */
	exec(prop, args, trap = {}) {
		if (prop instanceof String) {
			// incase we recieved new String()
			prop = prop + '';
		}
		return this.handle(prop, (contxtObj, contxtMeta, advance) => {
			var fn = _get(contxtObj, prop, trap);
			if (!_isUndefined(fn) || _has(contxtObj, prop, trap)) {
				if (!_isFunction(fn)) {
					if (trap.exec) {
						return trap.exec(contxtObj, prop, args);
					}
					throw new Error('"' + prop + '" is not a function! (Called on type: ' + typeof contxtObj + '.)');
				}
				if (trap.apply) {
					return trap.apply(fn, contxtObj, args);
				}
				return fn.apply(contxtObj, args);
			}
			return advance();
		}, () => {
			if (trap.execUnknown) {
				return trap.execUnknown(this, prop, args);
			}
			throw new Error('"' + prop + '()" is undefined!');
		});
	}

	/**
	 * Factory method for making a Contexts instance.
	 *
	 * @param array|object 	cntxt
	 *
	 * @return Contexts
	 */
	static create(cntxt) {
		return cntxt instanceof Contexts ? cntxt : new Contexts(cntxt);
	}
};

const _get = (cntxt, prop, trap) => trap.get ? trap.get(cntxt, prop) 
	: ((_isTypeObject(cntxt) && cntxt) || _isString(cntxt) || _isNumber(cntxt) ? cntxt[prop] : undefined);;

const _has = (cntxt, prop, trap) => trap.has ? trap.has(cntxt, prop) : (
	_isTypeObject(cntxt) && cntxt ? prop in cntxt : !_isUndefined(cntxt[prop])
);

class LocalContext {};