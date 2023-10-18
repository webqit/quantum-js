
/**
 * @imports
 */
import Parser from './Parser.js';
import Compiler from './Compiler.js';

/**
 * @parse
 */

// Parser
const parseCache = new Map;
export function parse( source, params = {} ) {
    const cacheKey = `${ source }${ JSON.stringify( params ) }`;
    let ast = parseCache.get( cacheKey );
    if ( !ast ) {
        try { ast = Parser.parse( source, params );  }
        catch( e ) {
            const message = `${ e.message || e }`;
            const { pos, loc: { line, column } } = e;
            const expr = source.slice( pos, pos + 20 );
            throw new ( globalThis[ e.name ] || Error )( message, { cause: { trace: [ { expr, line, column } ], source } } );
        }
        ast.originalSource = source;
        parseCache.set( cacheKey, ast );
    }
    return ast;
}

// Compiler
export function compile( ast, params = {} ) {
    const compiler = new Compiler( params );
    return compiler.transform( ast );
}

// Serialize
export function serialize( ast, params = {} ) {
    const compiler = new Compiler( params );
    return compiler.serialize( ast );
}
