
/**
 * @normalizeTabs
 */
export  function normalizeTabs( rawSource ) {
    let rawSourceSplit = rawSource.split(/\n/g);
    if ( rawSourceSplit.length > 1 ) {
        let possibleBodyIndentLevel = rawSourceSplit[ 1 ].split(/[^\s]/)[0].length;
        if ( possibleBodyIndentLevel ) {
            return rawSourceSplit.map( ( line, i ) => {
                if ( !i ) return line;
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