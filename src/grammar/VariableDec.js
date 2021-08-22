
/**
 * @imports
 */
import _after from '@webqit/util/str/after.js';
import _isArray from '@webqit/util/js/isArray.js';
import Lexer from '@webqit/util/str/Lexer.js';
import VariableDecInterface from './VariableDecInterface.js';
import Assignment from './Assignment.js';

/**
 * ---------------------------
 * VariableDec class
 * ---------------------------
 */				

const VariableDec = class extends VariableDecInterface {

	/**
	 * @inheritdoc
	 */
	constructor(initKeyword, declarations) {
		super();
		this.initKeyword = initKeyword;
		this.declarations = declarations;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		this.declarations.map(assignment => assignment.eval(context, { ...params, initKeyword: this.initKeyword }));
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
		return this.initKeyword + ' ' + this.declarations.join(', ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		expr = expr.trim();
		var initKeyword = expr.match(/^(var|let|const)/);
		if (initKeyword && (initKeyword = initKeyword[0])) {
			var exprs = [], _exprs = Lexer.split(_after(expr, initKeyword), [',']).map(_expr => _expr.trim());
			for (var i = 0; i < _exprs.length; i ++) {
				var _expr = parseCallback(_exprs[i], [ Assignment ], { ...params, isDeclaration: true });
				if ((_expr.operator && _expr.operator !== '=') || _expr.reference.context) return; // Syntax Error
				exprs.push(_expr);
			}
			return new this(initKeyword, exprs);
		}
	}
};

/**
 * @exports
 */
export default VariableDec;
