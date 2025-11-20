import Parser from './Parser.js';
import Transformer from './Transformer.js';

// Parser
const parseCache = new Map;
export function parse( source, params = {} ) {
    if (typeof source !== 'string') return source;
    const cacheKey = `${ source }${ JSON.stringify( params ) }`;
    let ast = parseCache.get( cacheKey );
    if ( !ast ) { ast = Parser.parse( source, params );
        try { }
        catch( e ) {
            const message = `${ e.message || e }`;
            const { pos, loc: { line, column } = {} } = e;
            const expr = source.slice( Math.max( 0, pos - 15 ), pos + 15 );
            const cause = [ { expr, line, column }, { source } ];
            if ( params.inBrowser ) console.error( cause );
            throw new ( globalThis[ e.name ] || Error )( message, { cause } );
        }
        parseCache.set( cacheKey, ast );
    }
    return ast;
}

// Transformer
export function transform( ast, params = {} ) {
    ast = parse(ast, params);
    const transformer = new Transformer( params );
    return transformer.transform( ast );
}

// Serialize
export function serialize( ast, params = {} ) {
    const transformer = new Transformer( params );
    return transformer.serialize( ast );
}
