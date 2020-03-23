
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
export default class Contexts extends Array {
	
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
		for(var i = 0; i < this.length; i ++) {
			var val = _get(this[i], prop, trap);
			// asking first mught not go well generally && _has(this[i], prop, trap)
			if (!_isUndefined(val) || _has(this[i], prop, trap)) {
				if (_isFunction(val) && bindThis) {
					return val.bind(this[i]);
				}
				return val;
			}
		}
	}
	
	/**
	 * Updates a property's value from the first possessing context.
	 * Or adds a new context to set the property.
	 *
	 * @param string|number prop
	 * @param mixed			val
	 * @param object		trap
	 *
	 * @return bool
	 */
	set(prop, val, trap = {}) {
		const _set = (cntxt, prop, val, trap) => {
			if (trap.set) {
				return trap.set(cntxt, prop, val);
			}
			cntxt[prop] = val;
			return true;
		};
		for(var i = 0; i < this.length; i ++) {
			if (_has(this[i], prop, trap)) {
				return _set(this[i], prop, val, trap);
			}
		}
		// No possessing context?
		// Set to first context?
		if (_isTypeObject(this[0]) && this[0]) {
			return _set(this[0], prop, val, trap);
		}
		return false;
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
		for(var i = 0; i < this.length; i ++) {
			if (_has(this[i], prop, trap)) {
				if (trap.deleteProperty || trap.del) {
					return (trap.deleteProperty || trap.del)(this[i], prop);
				}
				delete this[i][prop];
				return true;
			}
		}
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
		for(var i = 0; i < this.length; i ++) {
			if (_has(this[i], prop, trap)) {
				var context = _get(this[i], prop, trap);
				return _has(context, prop2, trap);
			}
		}
		throw new Error('"' + prop + '" is undefined!');
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
		for(var i = 0; i < this.length; i ++) {
			var fn = _get(this[i], prop, trap);
			if (!_isUndefined(fn) || _has(this[i], prop, trap)) {
				if (!_isFunction(fn)) {
					if (trap.exec) {
						return trap.exec(this[i], prop, args);
					}
					throw new Error('"' + prop + '" is not a function! (Called on type: ' + typeof this[i] + '.)');
				}
				if (trap.apply) {
					return trap.apply(fn, this[i], args);
				}
				return fn.apply(this[i], args);
			}
		}
		if (trap.execUnknown) {
			return trap.execUnknown(this, prop, args);
		}
		throw new Error('"' + prop + '" is undefined! (Called on types: ' + this.map(c => typeof c).join(', ') + '.)');
	}
	
	/**
	 * Factory method for making a Contexts instance.
	 *
	 * @param array|object 	cntxt
	 *
	 * @return Contexts
	 */
	static create(cntxt) {
		return cntxt instanceof Contexts ? cntxt 
			: (cntxt ? new Contexts(cntxt) : new Contexts());
	}
};

const _get = (cntxt, prop, trap) => trap.get ? trap.get(cntxt, prop) 
	: ((_isTypeObject(cntxt) && cntxt) || _isString(cntxt) || _isNumber(cntxt) ? cntxt[prop] : undefined);
const _has = (cntxt, prop, trap) => trap.has ? trap.has(cntxt, prop) : (
	 _isTypeObject(cntxt) && cntxt ? prop in cntxt : !_isUndefined(cntxt[prop])
);
