
/**
 * @imports
 */
import _wrapped from '@webqit/util/str/wrapped.js';
import _unwrap from '@webqit/util/str/unwrap.js';
import Lexer from '@webqit/util/str/Lexer.js';
import IfInterface from './IfInterface.js';
import ReturnInterface from './ReturnInterface.js';
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
	toString() {
		return this.stringify();
	}
	
	/**
	 * @inheritdoc
	 */
	stringify(params = {}) {
        var onTrue = this.onTrue && this.params.onTrueIsBlock 
            ? '{' + this.onTrue.stringify(params) + '}' 
            : (this.onTrue ? this.onTrue.stringify(params) : '');
        var onFalse = this.onFalse && this.params.onFalseIsBlock 
            ? '{' + this.onFalse.stringify(params) + '}' 
            : (this.onFalse ? this.onFalse.stringify(params) : '');
		return 'if (' + this.assertion.stringify(params) + ')' + onTrue + (onFalse ? ' else ' + onFalse : '');
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
            var abortive;
            var onTrue = rest.shift().trim(), onTrueIsBlock, onFalse = (rest.shift() || '').trim(), onFalseIsBlock;
            if (_wrapped(onTrue, '{', '}')) {
                // The braces gives us the onTrue block
                onTrueIsBlock = true;
                onTrue = _unwrap(onTrue, '{', '}').trim();
            }
            onTrue = parseCallback(onTrue, [Block], {assert:false, meta:null}) || parseCallback(onTrue, null, {meta:null});
            if (onFalse) {
                if (_wrapped(onFalse, '{', '}')) {
                    // The braces gives us the onTrue block
                    onFalseIsBlock = true;
                    onFalse = _unwrap(onFalse, '{', '}').trim();
                }
                onFalse = parseCallback(onFalse, [Block], {assert:false, meta:null}) || parseCallback(onFalse, null, {meta:null});
            } else if (onTrue) {
                abortive = onTrue.stmts.filter(stmt => stmt instanceof ReturnInterface).length;
            }
			const instance = new this(assertion, onTrue, onFalse, {
                    onTrueIsBlock,
                    onFalseIsBlock
                }
            );
            instance.abortive = abortive;
            return instance;
         }
	}
};

/**
 * @exports
 */
export default If;
