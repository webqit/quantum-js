/**
 * @imports
 */
import { normalizeTabs } from './util.js';
import { Parser, Compiler, Runtime } from './index.js';

/**
 * @Subscript
 */
export default function Subscript( ...args ) {
    let params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    params.compiler = { ...Subscript.compilerParams, ...( params.compiler || {} ) };
    params.runtime = { ...Subscript.runtimeParams, ...( params.runtime || {} ) };
    let source = normalizeTabs( args.pop() || '' );
    let ast = parse( source );
    let compiler = new Compiler( params.compiler );
    let compilation = compiler.generate( ast );
    return create( this, compilation, args, params.runtime, source );
}

/**
 * @compilerParams
 */
Subscript.compilerParams = {
    globalsNoObserve: [],
    globalsOnlyPaths: false,
    compact: 2,
}

/**
 * @runtimeParams
 */
Subscript.runtimeParams = {}

/**
 * @clone
 */
Subscript.clone = function( _function, defaultThis = null, _compilerParams = {}, _runtimeParams = {} ) {
    if ( typeof _function !== 'function' ) {
        throw new Error( `Expected argument 1 to be of type 'function' but got ${ typeof _function }.` );
    }
    if ( !_function.name ) {
        throw new Error(`Function must have a name.`);
    }
    let rawSource = normalizeTabs( _function.toString().trim() );
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
    let ast = parse( source ).body[ 0 ];
    let bodyStart = ast.body.start + 1/* the opening brace */;
    if ( source.substr( bodyStart, 1 ) === "\n" ) {
        bodyStart += 1;
    }
    let compiler = new Compiler( { ..._compilerParams, ...Subscript.compilerParams, locStart: - bodyStart } );
    let parameters = ast.params.map( paramExpr => compiler.serialize( paramExpr ) );
    let compilation = compiler.generate( { type: 'Program', body: ast.body.body } );
    if ( !compilation.graph.hoistedAwaitKeyword && isAsync ) {
        compilation.graph.hoistedAwaitKeyword = true;
    }
    let originalSource = source.substring( bodyStart, ast.body.end - 1 );
    return create( defaultThis, compilation, parameters, _runtimeParams, originalSource, _function.name );
}

/**
 * @create
 */
const create = function( defaultThis, compilation, parameters = [], _runtimeParams = {}, originalSource = null, sourceName = null ) {
    let runtime = Runtime.create( compilation, parameters, { ..._runtimeParams, ...Subscript.runtimeParams } );
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
}
