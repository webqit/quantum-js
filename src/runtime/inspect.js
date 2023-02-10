
/**
 * @exports
 */
const store = new Map;
export default function( _function, property, value = undefined ) {
    let insp = store.get( _function );
    if ( arguments.length > 2 ) {
        if ( !insp ) {
            insp = new Map;
            store.set( _function, insp );
        }
        insp.set( property, value );
        return;
    }
    return insp && insp.get( property );
}