
/**
 * @imports
 */
import _last from '@webqit/util/arr/last.js';
import _isUndefined from '@webqit/util/js/isUndefined.js';
import Lexer from '@webqit/util/str/Lexer.js';
import ReferenceInterface from './ReferenceInterface.js';
import DeletionInterface from './DeletionInterface.js';
import SyntaxError from '../SyntaxError.js';
import ReferenceError from '../ReferenceError.js';

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
		try {
			return this.reference.getEval(context, params).del();
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
		return this.operator + ' ' + this.reference.stringify(params);
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
		var parse = Lexer.lex(expr, Object.values(this.operators));
		if (parse.matches.length === 1 && expr.startsWith(parse.matches[0] + ' ')) {
			var reference;
			if (!((reference = parseCallback(parse.tokens.pop().trim(), null, {role: 'DELETION_SPECIFIER'})) instanceof ReferenceInterface)) {
				throw new SyntaxError(expr);
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
