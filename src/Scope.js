
/**
 * @imports
 */
import _isTypeObject from '@webqit/util/js/isTypeObject.js';
import _isUndefined from '@webqit/util/js/isUndefined.js';
import _isFunction from '@webqit/util/js/isFunction.js';
import _isClass from '@webqit/util/js/isClass.js';
import _isString from '@webqit/util/js/isString.js';
import _isNull from '@webqit/util/js/isNull.js';
import _isNumber from '@webqit/util/js/isNumber.js';
import _after from '@webqit/util/str/after.js';
import _before from '@webqit/util/str/before.js';
import _unique from '@webqit/util/arr/unique.js';
import ReferenceError from './ReferenceError.js';

/**
 * @exports
 */
export default class Scope {

	/**
	 * Creates a new context stack.
	 *
	 * @param object	 	params
	 * @param object		params
	 *
	 * @return Scope
	 */
	constructor(stack, params = {}) {
		if (!('main' in stack)) {
			throw new Error('A "main" context must be provided!');
		}
		Object.defineProperty(this, 'stack', {value: stack || {}, enumerable: false});
		Object.defineProperty(this, 'params', {value: params || {}, enumerable: false});
		if (stack.super) {
			Object.defineProperty(this.stack, 'super', {value: Scope.create(stack.super, {errorLevel: params.errorLevel}), enumerable: false});
		}
		Object.defineProperty(this.stack, 'local', {value: stack.local || {}, enumerable: false});
		Object.defineProperty(this.stack, '$local', {value: stack.$local || {}, enumerable: false});
	}

	/**
	 * Binds a callback to changes
	 * that happen in the contexts.
	 *
	 * @param object		 	trap
	 * @param function		 	callback
	 *
	 * @return Scope
	 */
	observe(trap, callback, params = {}) {
		if (this.stack.super) {
			this.stack.super.observe(trap, (e) => {
				if (e.props.filter(prop => !_has(this.stack.local, prop, trap) && !_has(this.stack.main, prop, trap)).length) {
					e.scope = 'super';
					return callback(e);
				}
			}, params);
		}
		
		var _params  = {...params};
		_params.subtree = 'auto';
		_params.tags = (_params.tags || []).slice(0);
		_params.tags.push(this, 'jsen-context',);
		_params.diff = true;

		trap.observe(this.stack, changes => {
			var references = [];
			changes.forEach(c => {
				// Changes firing directly from super and local should be ignored
				if (c.name === 'main') {
					if (c.path.length > 1) {
						references.push(c.path.slice(1));
					} else {
						var keysMain = _unique((_isTypeObject(c.value) ? Object.keys(c.value) : []).concat(c.oldValue && _isTypeObject(c.oldValue) ? Object.keys(c.oldValue) : []));
						references.push(...keysMain.map(k => [k]));
					}
				}
			});
			references = references.filter(ref => !_has(this.stack.local, ref[0], trap));
			if (references.length) {
				var props = references.map(ref => ref[0]);
				return callback({
					props,
					references,
					scope: 'local',
				});
			}
		}, _params);
	}
	
	/**
	 * Unbinds callbacks previously bound
	 * with observe()
	 *
	 * @param object		 	trap
	 * @param object		 	params
	 *
	 * @return Scope
	 */
	unobserve(trap, params = {}) {
		if (this.stack.super) {
			this.stack.super.unobserve(trap, params);
		}
		var _params  = {...params};
		_params.tags = (_params.tags || []).slice(0);
		_params.tags.push(this, 'jsen-context',);
		trap.unobserve(this.stack, null, null, _params);
	}
	
	/**
	 * Tries the handler on the different contexts in the stack.
	 *
	 * @param string|number 	prop
	 * @param function		 	callback
	 * @param function		 	final
	 *
	 * @return Scope
	 */
	handle(prop, callback, final, level = 0) {
		var callMain = () => {
			return callback(this.stack.main, null, () => {
				if (this.stack.super) {
					return this.stack.super.handle(prop, callback, final, level + 1);
				}
				if (final) {
					return final();
				}
			}, level);
		};
		// Normally, we would begin with local...
		// but no if...
		if (prop === 'toString' && this.stack.local.toString === Object.prototype.toString) {
			return callMain();
		}
		// Conditions are right, we begin with local
		return callback(this.stack.local, this.stack.$local, callMain, level);
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
				if (_isFunction(val) && !_isClass(val) && bindThis) {
					return val.bind(contxtObj);
				}
				return val;
			}
			return advance();
		}/* Not good for RQL derived fields , () => {throw new ReferenceError('"' + prop + '" is undefined!');}*/);
	}
	
	/**
	 * Updates a property's value from the first possessing context.
	 * Or adds a new context to set the property.
	 *
	 * @param string|number prop
	 * @param mixed			val
	 * @param object		trap
	 * @param bool			initKeyword
	 * @param bool			isRootVar
	 *
	 * @return bool
	 */
	set(prop, val, trap = {}, initKeyword = false, isRootVar = true) {
		if (this.params.type === 2 && initKeyword === 'var' && this.stack.super) {
			return this.stack.super.set(prop, val, trap, initKeyword);
		}
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
		return this.handle(initKeyword ? true : prop, (contxtObj, localContxtMeta, advance, level) => {
			// Whatever the level of localContext...
			if (localContxtMeta && localContxtMeta[prop] === 'const') {
				throw new LogicalError('CONST ' + prop + ' cannot be modified!');
			}
			// Set this locally, we wont be getting to advance()
			if (initKeyword) {
				localContxtMeta[prop] = initKeyword;
				return _set(contxtObj, prop, val, trap);
			}
			// For any other contex, it must already exists
			if (_has(contxtObj, prop, trap)) {
				return _set(contxtObj, prop, val, trap);
			}
			try {
				return advance();
			} catch(e) {
				if ((e instanceof ReferenceError) && contxtObj && !localContxtMeta && level === 0 && this.params.strictMode === false) {
					// Assign to undeclared variables
					return _set(contxtObj, prop, val, trap);
				}
				throw e;
			}
		}, () => {throw new ReferenceError('"' + prop + '" does not exist in scope!');});
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
				if (contxtMeta) {
					delete contxtMeta[prop];
				}
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
		}, () => {throw new ReferenceError('"' + prop + '" is undefined!');});
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
					throw new ReferenceError('"' + prop + '" is not a function! (Called on type: ' + typeof contxtObj + '.)');
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
			throw new ReferenceError('"' + prop + '()" is undefined!');
		});
	}

	/**
	 * Factory method for making a Scope instance.
	 *
	 * @param array|object 	cntxt
	 * @param object 		params
	 * @param object 		trap
	 *
	 * @return Scope
	 */
	static create(cntxt, params = {}, trap = {}) {
		if (cntxt instanceof Scope) {
			return cntxt;
		}
		var scopeObj = {};
		if (trap.set) {
			trap.set(scopeObj, 'main', cntxt);
		} else {
			scopeObj.main = cntxt;
		}
		return new Scope(scopeObj, params);
	}

	/**
	 * Factory method for making a stack Scope hierarchies.
	 *
	 * @param array		 	cntxts
	 * @param object 		params
	 * @param object 		trap
	 *
	 * @return Scope
	 */
	static createStack(cntxts, params = {}, trap = {}) {
		return cntxts.reverse().reduce((supr, cntxt, i) => {
			if (cntxt instanceof Scope) {
				if (i === 0) {
					return cntxt;
				}
				throw new Error('Only the top-most context is allowed to be an instance of Scope.')
			}
			var scopeObj = {};
			if (trap.set) {
				trap.set(scopeObj, 'main', cntxt);
			} else {
				scopeObj.main = cntxt;
			}
			scopeObj.super = supr;
			return new Scope(scopeObj, params);
		}, null);
	}
};

const _get = (cntxt, prop, trap) => {
	if (_isNull(cntxt) || _isUndefined(cntxt)) {
		return;
	}
	return trap.get && _isTypeObject(cntxt) ? trap.get(cntxt, prop) : (
		cntxt[prop]
	);
};

const _has = (cntxt, prop, trap) => {
	if (_isNull(cntxt) || _isUndefined(cntxt)) {
		return false;
	}
	return trap.has && _isTypeObject(cntxt) ? trap.has(cntxt, prop) : (
		_isTypeObject(cntxt) ? prop in cntxt : !_isUndefined(cntxt[prop])
	);
};