
/**
 * @imports
 */
import _last from '@web-native-js/commons/arr/last.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import ReferenceInterface from './ReferenceInterface.js';
import DeletionInterface from './DeletionInterface.js';
import Scope from '../Scope.js';

/**
 * ---------------------------
 * Deletion class
 * ---------------------------
 */				

const Deletion = class extends DeletionInterface {

	/**
	 * @inheritdoc
	 */
	constructor(reference, operator = 'delete') {
		super();
		this.reference = reference;
		this.operator = operator;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, params = {}) {
		var reference = this.reference.getEval(context, params);
		if (!_isUndefined(reference.context) && !_isUndefined(reference.name)) {
			return Scope.create(reference.context).del(reference.name, params.trap);
		}
		throw new Error('[Reference Error][' + this + ']: "' + (this.context || this) + '" is undefined!');
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return this.operator + ' ' + this.reference.toString(context);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var parse = Lexer.lex(expr, Object.values(this.operators));
		if (parse.matches.length === 1 && expr.startsWith(parse.matches[0] + ' ')) {
			var reference;
			if (!((reference = parseCallback(parse.tokens.pop().trim())) instanceof ReferenceInterface)) {
				throw new Error('Invalid delete directive: ' + expr);
			}
			return new this(reference, parse.matches[0].trim());
		}
	}
};	

/**
 * @prop array
 */
Deletion.operators = {
	red: 'reduce', 
	del: 'delete',
};

/**
 * @exports
 */
export default Deletion;
