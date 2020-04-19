
/**
 * @imports
 */
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import Lexer from '../Lexer.js';
import IfInterface from './IfInterface.js';
import Statements from './Statements.js';

/**
 * ---------------------------
 * Condition class
 * ---------------------------
 */				

const If = class extends IfInterface {
	
	/**
	 * @inheritdoc
	 */
	constructor(assertion, onTrue, onFalse, params = {}) {
		super();
		this.assertion = assertion;
		this.onTrue = onTrue;
		this.onFalse = onFalse;
		this.params = params;
	}
	 
	/**
	 * @inheritdoc
	 */
	eval(context = null, trap = {}) {
		return this.assertion.eval(context, trap) 
			? (this.onTrue ? this.onTrue.eval(context, trap) : undefined)
			: (this.onFalse ? this.onFalse.eval(context, trap) : undefined);
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
        var onTrue = this.params.onTrueIsBlock 
            ? '{' + this.onTrue.toString(context) + '}' 
            : (this.onTrue ? this.onTrue.toString(context) : '');
        var onFalse = this.params.onFalseIsBlock 
            ? '{' + this.onFalse.toString(context) + '}' 
            : (this.onFalse ? this.onFalse.toString(context) : '');
		return 'if (' + this.assertion.toString(context) + ')' + onTrue + (onFalse ? ' else ' + onFalse : '');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, Static = If) {
        expr = expr.trim();
        var splits;
        if (expr.startsWith('if') 
		&& (splits = Lexer.split(expr, [], {limit:2}/*IMPORTANT*/).slice(1).filter(b => b.trim())) && splits.length === 2) {
            var assertion = parseCallback(_unwrap(splits.shift().trim(), '(', ')').trim());
            var rest = Lexer.split(splits.shift().trim(), ['else'], {limit:1}/*IMPORTANT*/);
            var onTrue = rest.shift().trim(), onTrueIsBlock, onFalse = (rest.shift() || '').trim(), onFalseIsBlock;
            if (_wrapped(onTrue, '{', '}')) {
                // The braces gives us the onTrue block
                onTrueIsBlock = true;
                onTrue = _unwrap(onTrue, '{', '}').trim();
                onTrue = parseCallback(onTrue, [Statements], {assert:false}) || parseCallback(onTrue);
            } else {
                onTrue = parseCallback(onTrue);
            }
            if (onFalse) {
                if (_wrapped(onFalse, '{', '}')) {
                    // The braces gives us the onTrue block
                    onFalseIsBlock = true;
                    onFalse = _unwrap(onFalse, '{', '}').trim();
                    onFalse = parseCallback(onFalse, [Statements], {assert:false}) || parseCallback(onFalse);
            } else {
                    onFalse = parseCallback(onFalse);
                }
            }
			return new Static(assertion, onTrue, onFalse, {onTrueIsBlock, onFalseIsBlock});
         }
	}
};

/**
 * @exports
 */
export default If;
