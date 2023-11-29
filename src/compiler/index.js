
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
            const expr = source.slice( Math.max( 0, pos - 15 ), pos + 15 );
            const cause = [ { expr, line, column }, { source } ];
            if ( params.inBrowser ) console.error( cause );
            throw new ( globalThis[ e.name ] || Error )( message, { cause } );
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
