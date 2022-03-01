/**
 * @imports
 */
import Interactable from './Interactable.js';

/**
 * @Ref
 */
export default class Ref extends Interactable() {

    bind( binding ) {
        Object.assign( this, binding );

        this.fullPaths = [];
        this.$fullPaths = [];
        if ( this.ownerProduction.assignee ) {
            this.ownerProduction.assignee.refs.forEach( ref => {
                if ( !ref.depth ) return;
                this.fullPaths.push( [ ...this.path, ...ref.depth ] );
            } );
        }
        if ( !this.fullPaths.length ) {
            this.fullPaths = [ this.path ];
        }

        this.fullPaths.forEach( ( fullPath, pathIndex ) => {
            this.$fullPaths.push( fullPath.map( element => ( 'memoId' in element ) ? `[[computed]]` : element.name ).join( '.' ) );
            
            fullPath.forEach( element => {
                element.anchor.classList.add( 'ref-identifier' );
                element.anchor.classList.add( this.subscriptions ? 'affected' : 'cause' );
                let existingTitle = element.anchor.getAttribute( `title` );
                let currentTitle = '> ' 
                    + this.$fullPaths[ pathIndex ] 
                    + ( this.subscriptions ? ' (Creates a signal)' : ' (Receives a signal)' );
                element.anchor.setAttribute( `title`, existingTitle ? existingTitle + "\n" + currentTitle : currentTitle );
            });

            this._on( pathIndex, 'mouseenter', () => {
                this._setState( pathIndex, 'path', 'hover', true, 0 );
            } )._on( pathIndex, 'mouseleave', () => {
                this._setState( pathIndex, 'path', 'hover', false );
            } );

            if ( this.subscriptions ) {
                this._on( pathIndex, 'click', () => {
                    this.ownerProduction.ownerEffect.signal( fullPath );
                } );
            }
        } );
    }

    _setState( pathIndex, type, state, value, duration = 100 ) {
        this.setStateCallback( pathIndex + '|' + type, state, value, duration, () => {
            if ( value ) {
                this.fullPaths[ pathIndex ].forEach( element => element.anchor.classList.add( `${ type }-${ state }` ) );
            } else {
                this.fullPaths[ pathIndex ].forEach( element => element.anchor.classList.remove( `${ type }-${ state }` ) );
            }
        } );
    }

    setState( type, state, value, duration = 100 ) {
        let [ _index, _type ] = type.split( '|' );
        if ( _type !== undefined ) {
            return this._setState( _index, _type, state, value, duration );
        }
        this.fullPaths.forEach( ( p, i ) => {
            this._setState( i, type, state, value, duration );
        } );
    }

    _on( pathIndex, eventName, callback ) {
        this.fullPaths[ pathIndex ].forEach( pathElement => pathElement.anchor.addEventListener( eventName, callback.bind( this ) ) );
        return this;
    }

    on( eventName, callback ) {
        this.fullPaths.forEach( ( p, i ) => {
            this._on( i, eventName, callback );
        } );
    }
}