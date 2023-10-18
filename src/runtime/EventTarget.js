/**
 * @imports
 */
import { other } from "../util.js";

export default class _EventTarget extends EventTarget {

    managedAlways = new Set;
    managedOnce = new Set;

    constructor() {
        super();
        other.setMaxListeners?.( 0, this );
    }

    fire( evenName ) { return this.dispatchEvent( new Event( evenName, { cancelable: true } ) ); }

    on( ...args ) {
        this.addEventListener( ...args );
        return () => this.removeEventListener( ...args );
    }

    abort( total = false ) {
        this.managedAlways.forEach( x => x.abort ? x.abort( total ) : x( total ) );
        this.managedOnce.forEach( x => x.abort ? x.abort( total ) : x( total ) );
        this.managedOnce.clear();
        this.fire( 'abort' );
    }

    manage( x ) { this.managedAlways.add( x ); }
    once( x ) { this.managedOnce.add( x ); }

}