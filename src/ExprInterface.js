
/**
 * @imports
 */
import _isObject from '@webqit/util/js/isObject.js';
import _even from '@webqit/util/obj/even.js';

/**
 * ---------------------------
 * ExprInterface
 * ---------------------------
 */				

export default class {
	
	/**
	 * Compares the current instance with another object.
	 *
	 * @param object Expr
	 *
	 * @return bool
	 */
	even(Expr) {
		if (_isObject(Expr) && Expr.jsenType === this.jsenType) {
			return _even(Expr, this);
		}
		return false;
	}
	
	/**
	 * Inherits properties from a super Expr.
	 *
	 * @param ExprInterface Super
	 *
	 * @return this
	 */
	inherit(Super) {
		return this;
	}
	
	/**
	 * Adds comments to the instance.
	 *
	 * @param string	 comments
	 *
	 * @return this
	 */
	withComments(comments) {
		if (!this.meta) {
			this.meta = {};
		}
		this.meta.comments = comments;
		return this;
	}
	
	/**
	 * Adds variables to the instance.
	 *
	 * @param array		 vars
	 *
	 * @return this
	 */
	withVars(vars) {
		if (!this.meta) {
			this.meta = {};
		}
		this.meta.vars = vars;
		return this;
	}
	
	/**
	 * Evaluates the expression instance for a result,
	 * optionally in the context of an object.
	 *
	 * @param object context
	 *
	 * @return mixed
	 */
	//eval(context = null, params = {})
	
	/**
	 * SAttempts to parse a string into the class instance.
	 *
	 * @param string expr
	 * @param object params
	 *
	 * @return ExprInterface
	 */
	//static parse(expr, params = {})
};
