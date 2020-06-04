
/**
 * @imports
 */
import _isNumeric from '@web-native-js/commons/js/isNumeric.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import _intersect from '@web-native-js/commons/arr/intersect.js';
import _unique from '@web-native-js/commons/arr/unique.js';
import MathInterface from './MathInterface.js';
import Lexer from '../Lexer.js';

/**
 * ---------------------------
 * Math class
 * ---------------------------
 */				

const Math = class extends MathInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(val, exprs) {
		super();
		this.val = val;
		this.exprs = exprs;
	}
	
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		return this.exprs.reduce((currentTotal, expr) => {
			var val = expr.val.eval(context, trap);
			var operator = expr.operator.trim();
			if ((!_isNumeric(currentTotal) || !_isNumeric(val)) && operator !== '+') {
				throw new Error('Invalid Math expression: ' + this.toString() + '!');
			}
			switch(operator) {
				case '+':
					return currentTotal + val;
				case '-':
					return currentTotal - val;
				case '*':
					return currentTotal * val;
				case '/':
					return currentTotal / val;
			}
		}, this.val.eval(context, trap));
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return [this.val.toString(context)].concat(
			this.exprs.map(expr => expr.operator + ' ' + expr.val.toString(context))
		).join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Math) {
		var parse = Lexer.lex(expr, _flatten(Static.operators));
		if (parse.tokens.length > 1 && parse.matches.length === parse.tokens.length - 1) {
			var operators = _unique(parse.matches);
			if (_intersect(operators, Math.operators.sup).length && _intersect(operators, Math.operators.sub).length) {
				throw new Error('"Addition/subtraction" and "multiplication/division" operators cannot be used in the same expression: ' + expr + '!');
			}
			return new Static(
				parseCallback(parse.tokens.shift().trim()),
				parse.tokens.map((expr, i) => {return {
					operator: parse.matches[i],
					val: parseCallback(expr.trim())
				};})
			);
		}
	}
};

/**
 * @prop object
 */
Math.operators = {
	sup: ['*', '/'],
	sub: [' + ', ' - '],
};

/**
 * @exports
 */
export default Math;
