
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