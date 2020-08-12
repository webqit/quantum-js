
/**
 * @imports
 */
import _wrapped from '@web-native-js/commons/str/wrapped.js';
import _unwrap from '@web-native-js/commons/str/unwrap.js';
import Lexer from '@web-native-js/commons/str/Lexer.js';
import IfInterface from './IfInterface.js';
import Block from './Block.js';
import Scope from '../Scope.js';

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
	eval(context = null, params = {}) {
        var errorLevel = context instanceof Scope ? context.params.errorLevel : undefined;
        var _context = new Scope({
            main:{}, 
            super:context,
        }, {type: 2, errorLevel});
		return  this.assertion.eval(context/** original context */, params)
			? (this.onTrue ? this.onTrue.eval(_context, params) : undefined)
            : (this.onFalse ? this.onFalse.eval(_context, params) : undefined);
	}
	
	/**
	 * @inheritdoc
	 */
	toString(context = null) {
        var onTrue = this.onTrue && this.params.onTrueIsBlock 
            ? '{' + this.onTrue.toString(context) + '}' 
            : (this.onTrue ? this.onTrue.toString(context) : '');
        var onFalse = this.onFalse && this.params.onFalseIsBlock 
            ? '{' + this.onFalse.toString(context) + '}' 
            : (this.onFalse ? this.onFalse.toString(context) : '');
		return 'if (' + this.assertion.toString(context) + ')' + onTrue + (onFalse ? ' else ' + onFalse : '');
	}
	
	/**
	 * @inheritdoc
	 */
	static parse(expr, parseCallback, params = {}) {
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
                onTrue = parseCallback(onTrue, [Block], {assert:false, meta:null}) || parseCallback(onTrue, null, {meta:null});
            } else {
                onTrue = parseCallback(onTrue, null, {meta:null});
            }
            if (onFalse) {
                if (_wrapped(onFalse, '{', '}')) {
                    // The braces gives us the onTrue block
                    onFalseIsBlock = true;
                    onFalse = _unwrap(onFalse, '{', '}').trim();
                    onFalse = parseCallback(onFalse, [Block], {assert:false, meta:null}) || parseCallback(onFalse, null, {meta:null});
                } else {
                    onFalse = parseCallback(onFalse, null, {meta:null});
                }
            }
			return new this(
                assertion, 
                onTrue ? (onTrue.jsenType === 'Block' ? onTrue : new Block([onTrue])) : null, 
                onFalse ? (onFalse.jsenType === 'Block' ? onFalse : new Block([onFalse])) : null, 
                {
                    onTrueIsBlock,
                    onFalseIsBlock,
                }
            );
         }
	}
};

/**
 * @exports
 */
export default If;
