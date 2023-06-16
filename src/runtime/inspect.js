/**
 * @imports
 */
import { _await } from '../util.js';

/**
 * @exports
 */
const store = new Map;
export default function( _function, arg ) {
    if ( typeof arg === 'object' && arg ) {
        store.set( _function, arg );
        return;
    }
    const insp = store.get( _function );
    return _await( insp, _insp => _insp && ( arg ? _insp[ arg ] : _insp ) );
}