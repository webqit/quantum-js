
/**
 * @imports
 */
import { normalizeTabs } from './util.js';
import { resolveParams } from './params.js';
import { parse, compile, serialize } from './compiler/index.js';
import Runtime from './runtime/Runtime.js';
import inspect from './runtime/inspect.js';

/**
 * @SubscriptFunction
 */
export default function SubscriptFunction( ...args ) {
    const params = resolveParams( typeof args[ args.length - 1 ] === 'object' ? args.pop() : {} );
    const source = normalizeTabs( args.pop() || '' );
    const parameters = args;
    // --------------------
    const ast = parse( source, params.parserParams );
    const compilation = compile( ast, params.compilerParams );
    return Runtime.createFunction( undefined, compilation, parameters, params.runtimeParams, this, source );
}

/**
 * @inspect
 */
Object.defineProperty( SubscriptFunction, 'inspect', { value: inspect } );

/**
 * @SubscriptFunctionClone
 */
export function SubscriptFunctionClone( _function, defaultThis = null, params = {} ) {
    if ( typeof _function !== 'function' ) {
        throw new Error( `Expected argument 1 to be of type 'function' but got ${ typeof _function }.` );
    }
    if ( !_function.name ) {
        throw new Error(`Function must have a name.`);
    }
    params = resolveParams( params );
    const rawSource = normalizeTabs( _function.toString(), true );
    let source = rawSource, isAsync;
    if ( rawSource.startsWith( 'async ' ) ) {
        params.runtimeParams.async = true;
        source = source.substring( 6 );
        isAsync = true;
    }
    if ( !source.startsWith( 'function ' ) && !source.startsWith( 'function(' ) ) {
        if ( source.trim().startsWith( '[' ) ) {
            let computedName, roughSPlit = source.split(/\](?:[\s]+)?\(/g).filter( str => str );
            [ computedName, source ] = roughSPlit.reduce( ( prev, str, i ) => {
                if ( Array.isArray( prev ) ) return prev;
                str = `${ prev }${ str || '' }]`;
                try {
                    parse( str );
                    return [ str, `${ _function.name }(${ roughSPlit.slice( i + 1 ).join( '] (' ) }`]
                } catch( e ) { return `${ str } (`; }
            }, '' );
        }
        source = 'function ' + source;
    }
    const ast = parse( source, params.parserParams ).body[ 0 ];
    let bodyStart = ast.body.start + 1/* the opening brace */;
    if ( source.substr( bodyStart, 1 ) === "\n" ) {
        bodyStart += 1;
    }
    const originalSource = source.substring( bodyStart, ast.body.end - 1 );
    const compilation = compile( { type: 'Program', body: ast.body.body }, { ...params.compilerParams, locStart: - bodyStart } );
    const parameters = ast.params.map( paramExpr => serialize( paramExpr ) );
    return Runtime.createFunction( _function.name, compilation, parameters, params.runtimeParams, defaultThis, originalSource );
}

/**
 * @SubscriptClass
 */
export const SubscriptClass = Class => class extends ( Class || class {} ) {

    constructor() {
        super();
        const _static = this.constructor;
        _static.subscriptMethods.forEach( methodName => {
            if ( !this[ methodName ] ) {
                throw new Error( `${ methodName } is not a method.` );
            }
            if ( methodName === 'constructor' ) {
                throw new Error( `Class constructors cannot be subscript methods.` );
            }
            this[ methodName ] = _static.implementMethod( this[ methodName ], this );
        } );
    }
    
    static implementMethod( method, thisBinding = null ) {
        return SubscriptFunctionClone( method, thisBinding, {
            compilerParams: this.compilerParams,
            runtimeParams: this.runtimeParams,
        } );
    }

    static get subscriptMethods() {
        return [];
    }

    static get runtimeParams() {
        return {};
    }

    static get compilerParams() {
        return {};
    }

}