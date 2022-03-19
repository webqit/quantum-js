/**
 * @imports
 */
import { normalizeTabs } from './util.js';
import { Parser, Compiler, Runtime } from './index.js';

/**
 * @SubscriptFunction
 */
export default function SubscriptFunction( ...args ) {
    let params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    params.compiler = { ...SubscriptFunction.compilerParams, ...( params.compiler || {} ) };
    params.runtime = { ...SubscriptFunction.runtimeParams, ...( params.runtime || {} ) };
    let source = normalizeTabs( args.pop() || '' );
    let compilation, parameters = args;
    if ( SubscriptFunction.cache[ source ] && !params.compiler.devMode && compare( parameters, SubscriptFunction.cache[ source ][ 1 ] ) && deepEql( params.compiler, SubscriptFunction.cache[ source ][ 2 ] ) ) {
        // ----------------
        [ compilation, parameters ] = SubscriptFunction.cache[ source ];
        // ----------------
    } else {
        let ast = parse( source );
        let compiler = new Compiler( params.compiler );
        compilation = compiler.generate( ast );
        // ----------------
        SubscriptFunction.cache[ source ] = [ compilation, parameters, params.compiler ];
        // ----------------
    }
    return create( this, compilation, args, params.runtime, source );
}
SubscriptFunction.cache = {};

/**
 * @compilerParams
 */
SubscriptFunction.compilerParams = {
    globalsNoObserve: [],
    globalsOnlyPaths: false,
    compact: 2,
}

/**
 * @runtimeParams
 */
SubscriptFunction.runtimeParams = {}

/**
 * @clone
 */
SubscriptFunction.cloneCache = {};
SubscriptFunction.clone = function( _function, defaultThis = null, _compilerParams = {}, _runtimeParams = {} ) {
    if ( typeof _function !== 'function' ) {
        throw new Error( `Expected argument 1 to be of type 'function' but got ${ typeof _function }.` );
    }
    if ( !_function.name ) {
        throw new Error(`Function must have a name.`);
    }
    let rawSource = normalizeTabs( _function.toString() );
    let source = rawSource, isAsync;
    if ( rawSource.startsWith( 'async ' ) ) {
        isAsync = true;
        source = source.substring( 6 );
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
    let compilation, parameters, originalSource;
    if ( SubscriptFunction.cloneCache[ source ] && !_compilerParams.devMode && deepEql( _compilerParams, SubscriptFunction.cloneCache[ source ][ 3 ] ) ) {
        // ----------------
        [ compilation, parameters, originalSource ] = SubscriptFunction.cloneCache[ source ];
        // ----------------
    } else {
        let ast = parse( source ).body[ 0 ];
        let bodyStart = ast.body.start + 1/* the opening brace */;
        if ( source.substr( bodyStart, 1 ) === "\n" ) {
            bodyStart += 1;
        }
        let compiler = new Compiler( { ..._compilerParams, ...SubscriptFunction.compilerParams, locStart: - bodyStart } );
        parameters = ast.params.map( paramExpr => compiler.serialize( paramExpr ) );
        compilation = compiler.generate( { type: 'Program', body: ast.body.body } );
        if ( !compilation.graph.hoistedAwaitKeyword && isAsync ) {
            compilation.graph.hoistedAwaitKeyword = true;
        }
        originalSource = source.substring( bodyStart, ast.body.end - 1 );
        // ----------------
        SubscriptFunction.cloneCache[ source ] = [ compilation, parameters, originalSource, _compilerParams ];
        // ----------------
    }
    return create( defaultThis, compilation, parameters, _runtimeParams, originalSource, _function.name );
}

/**
 * @create
 */
const create = function( defaultThis, compilation, parameters = [], _runtimeParams = {}, originalSource = null, sourceName = null ) {
    let runtime = Runtime.create( compilation, parameters, { ..._runtimeParams, ...SubscriptFunction.runtimeParams } );
    let _function = function( ...args ) {
        return runtime.call( this === undefined ? defaultThis : this, ...args );
    };
    _function.thread = runtime.thread.bind( runtime );
    _function.dispose = runtime.dispose.bind( runtime );
    Object.defineProperty( _function, 'runtime', { value: runtime } );
    Object.defineProperty( _function, 'sideEffects', { configurable: true, value: runtime.graph.sideEffects } );
    Object.defineProperty( _function, 'subscriptSource', { configurable: true, value: compilation.source } );
    Object.defineProperty( _function, 'originalSource', { configurable: true, value: originalSource } );
    Object.defineProperty( _function, 'length', { configurable: true, value: parameters.length } );
    Object.defineProperty( _function, 'name', { configurable: true, value: sourceName } );
    let ownSource = ( compilation.graph.hoistedAwaitKeyword ? 'async ' : '' ) + 'function' + ( sourceName ? ' ' + sourceName : '' );
    _function.toString = () => `${ ownSource }(${ parameters.join( ', ' ) }) {${ originalSource }}`;
    return _function;
}

/**
 * @parse
 */
const parseCache = new Map;
const parse = function( source, params = {} ) {
    params = {
        ecmaVersion: '2020',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        allowSuperOutsideMethod: true,
        preserveParens: false,
        ...params
    };
    let ast = parseCache.get( source );
    if ( !ast ) {
        ast = Parser.parse( source, params );
        parseCache.set( source, ast );
    }
    return ast;
};

/**
 * @deepEql
 */
const compare = ( a, b ) => {
    if ( typeof a === 'object' && a && typeof b === 'object' && b ) return deepEql( a, b );
    if ( Array.isArray( a ) && Array.isArray( b ) && a.length === b.length ) return a.every( valueA => b.some( valueB => compare( valueA, valueB ) ) );
    return a === b;
}
const deepEql = function( a, b ) {
    for ( let key in a ) {
        if ( !compare( a[ key ], b[ key ] ) ) return false;
    }
    return true;
};
