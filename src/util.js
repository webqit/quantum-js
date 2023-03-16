
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
