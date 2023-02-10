
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
        ast = Parser.parse( source, params );
        parseCache.set( cacheKey, ast );
    }
    return ast;
}

// Compiler
export function compile( ast, params = {} ) {
    const compiler = new Compiler( params );
    return compiler.generate( ast );
}

// Serialize
export function serialize( ast, params = {} ) {
    const compiler = new Compiler( params );
    return compiler.serialize( ast );
}
