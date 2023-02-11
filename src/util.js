
/**
 * @normalizeTabs
 */
export  function normalizeTabs( rawSource, isFunc = false ) {
    let rawSourceSplit = rawSource.split(/\n/g);
    if ( rawSourceSplit.length > 1 ) {
        while ( !rawSourceSplit[ 0 ].trim().length ) rawSourceSplit.shift();
        let possibleBodyIndentLevel = rawSourceSplit[ isFunc ? 1 : 0 ].split(/[^\s]/)[ 0 ].length;
        if ( possibleBodyIndentLevel ) {
            return rawSourceSplit.map( ( line, i ) => {
                let possibleIndent = line.substring( 0, possibleBodyIndentLevel );
                if ( !possibleIndent.trim().length ) {
                    return line.substring( possibleBodyIndentLevel );
                }
                // Last line?
                if ( possibleIndent.trim() === '}' && i === rawSourceSplit.length - 1 ) {
                    return '}';
                }
                return line;
            } ).join( "\n" );
        }
    }
    return rawSource;
}

export const _await = ( maybePromise, callback ) => (
    maybePromise instanceof Promise ? maybePromise.then( callback ) : callback( maybePromise )
);

export  const _compare = ( a, b ) => {
    if ( typeof a === 'object' && a && typeof b === 'object' && b ) return _deepEql( a, b );
    if ( Array.isArray( a ) && Array.isArray( b ) && a.length === b.length ) return a.every( valueA => b.some( valueB => _compare( valueA, valueB ) ) );
    return a === b;
};

export  const _deepEql = function( a, b ) {
    for ( let key in a ) {
        if ( !_compare( a[ key ], b[ key ] ) ) return false;
    }
    return true;
};

// ------------------
// Obsolete
// ------------------

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