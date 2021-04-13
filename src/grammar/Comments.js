
/**
 * @imports
 */
import _after from '@webqit/util/str/after.js';
import _before from '@webqit/util/str/before.js';
import CommentsInterface from './CommentsInterface.js';
import Lexer from '@webqit/util/str/Lexer.js';

/**
 * ---------------------------
 * Comments class
 * ---------------------------
 */				

const Comments = class extends CommentsInterface {

	/**
	 * @inheritdoc
	 */
	constructor(comments, type) {
		super();
		this.comments = comments;
		this.type = type;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
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
		return this.comments
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var _comments = null;
		var _expr = null;
		var type = 0;
		var commentPlacement = 'before';
		// Oneliner comments
		if (expr.startsWith('//')) {
			var splits = Lexer.split(_after(expr, '//'), ["\r\n"]);
			_comments = splits.shift().trim();
			_expr = (splits.shift() || '').trim();
			type = 1;
		} else if (expr.startsWith('/*')) {
			var splits = Lexer.split(_after(expr, '/*'), ["*/"]);
			_comments = splits.shift().trim();
			_expr = splits.shift().trim();
			type = 2;
		} else if (expr.endsWith('*/')) {
			var splits = Lexer.split(_beforeLast(expr, '*/'), ["/*"]);
			_comments = splits.pop().trim();
			_expr = splits.pop().trim();
			type = 2;
			var commentPlacement = 'after';
		}
		if (type) {
			if (type === 2) {
				_comments = Lexer.split(_comments.trim(), ["\r\n"])
					.map(line => line.replace(/^[\*]+/, ''))
					.filter(line => line.trim());
			}
			console.log(_comments, commentPlacement, expr);
			_comments = new this(_comments, type);
		}
		if (_expr) {
			_expr = parseCallback(_expr);
			_expr.meta.commenta = _comments;
			return _expr;
		}
	}
};	

/**
 * @exports
 */
export default Comments;
