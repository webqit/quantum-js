
/**
 * @imports
 */
import _last from '@web-native-js/commons/arr/last.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import PresenceInterface from './PresenceInterface.js';
import ReferenceInterface from './ReferenceInterface.js';
import Contexts from '../Contexts.js';
import Lexer from '../Lexer.js';

/**
 * ---------------------------
 * Presence class
 * ---------------------------
 */				

const Presence = class extends PresenceInterface {

	/**
	 * @inheritdoc
	 */
	constructor(prop, reference, operator = 'in') {
		super();
		this.prop = prop;
		this.reference = reference;
		this.operator = operator;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		var reference = this.reference.getEval(context, trap);
		var prop = this.prop.eval(context, trap);
		if (!_isUndefined(reference.context) && !_isUndefined(reference.name)) {
			return Contexts.create(reference.context).has(reference.name, prop, trap);
		}
		throw new Error('"' + this + '" is undefined!');
	}
	 
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
		return [this.prop.toString(context), this.operator, this.reference.toString(context)].join(' ');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}, Static = Presence) {
		var parse = Lexer.lex(expr, Static.operators);
		if (parse.tokens.length === 2) {
			var prop, reference;
			if (!(prop = parseCallback(parse.tokens.shift().trim()))
			|| !((reference = parseCallback(parse.tokens.shift().trim())) instanceof ReferenceInterface)) {
				throw new Error('Invalid presence check expression: ' + expr);
			}
			return new Static(prop, reference, parse.matches[0].trim());
		}
	}
};	

/**
 * @prop array
 */
Presence.operators = [' in '];

/**
 * @exports
 */
export default Presence;
