
/**
 * @imports
 */
import Base from './src/Base.js';

/**
 * @Inspector
 */
export default class Inspector extends Base( HTMLElement ) {

    connectedCallback() {
        this._contentSlot = document.createElement( 'slot' );
        // ----------------
        this.shadowRoot.append( this._contentSlot );
        // ----------------
        super.connectedCallback();
        this._contentSlot.addEventListener( 'slotchange', () => {
            setTimeout( () => { // Allow embedded subscript instances in slotted elements to manifest
                const hostElement = this._contentSlot.assignedNodes().reduce( ( _hostElement, node ) => _hostElement || ( node.subscript instanceof Map ? node : null), null );
                if ( hostElement ) {
                    this.inspectElement( hostElement );
                    const activeButton = this.getAttribute( 'active' );
                    if ( activeButton ) { this.inspectFunction( activeButton ); }
                } else {
                    visualizer.error(`No subscript element found.`);
                }
            }, 0 );
        } );
    }

    inspectElement( hostElement ) {
        if ( this.visualizerElement ) {
            this.visualizerElement.remove();
            this.controlsElement.remove();
        }
        this.visualizerElement = document.createElement( 'cfunctions-visualizer' );
        this.controlsElement = document.createElement( 'div' );
        this.controlsElement.classList.add( 'controls-element' );
        // ----------------
        this.shadowRoot.append( this.visualizerElement, this.controlsElement );
        // ----------------
        this.buttons = {};
        ( hostElement.scripts || [] ).forEach( ( script, id ) => {
            if ( !script.reflex ) return;
            let title = typeof id === 'number' ? `script:${ id }` : `${ id }()`;
            this.buttons[ id ] = this.controlsElement.appendChild( document.createElement( 'button' ) );
            this.buttons[ id ].setAttribute( 'script-id', id );
            this.buttons[ id ].setAttribute( 'title',  title );
            let textElement = this.buttons[ id ].appendChild( document.createElement( 'span' ) );
            textElement.append( ' ',  title );
            let iconElement = this.buttons[ id ].appendChild( document.createElement( 'i' ) );
            let iconClasses = this.getAttribute( `data-icons` ) || `bi bi-${ typeof id === 'number' ? 'code' : 'braces' }`;
            iconClasses.split( ' ' ).map( str => str.trim() ).forEach( str => iconElement.classList.add( str ) );
            this.buttons[ id ].addEventListener( 'click', e => {
                if ( this.active ) { this.active.classList.remove( 'active' ); }
                this.active = this.buttons[ id ];
                this.active.classList.add( 'active' );
                this.inspectFunction( script );
            } );
        } );
    }

    inspectFunction( script ) {
        if ( !script || typeof script === 'string' ) {
            let buttinName = script;
            if ( !script ) { buttinName = Object.keys( this.buttons )[ 0 ]; }
            if ( buttinName ) {
                const button = this.buttons[ buttinName ];
                const event = new MouseEvent( 'click', { view: window, } );
                button.dispatchEvent( event );
            }
            return;
        };
        this.visualizerElement.visualize( script );
    }

    /**
     * ----------
     *  CSS
     * ----------
     */

     get css() {
        return [
            `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css`,
            `
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
                box-sizing: border-box;
            }
            :host {
                position: relative;
                display: block;
                background-color: rgb(75, 75, 75);
            }
            .controls-element {
                position: relative;
                z-index: 10;
            }
            .controls-element button {
                display: inline-flex;
                align-items: center;
                background-color: transparent;
                padding: 0.5rem 1rem;
                border: none;
                color: silver;
            }
            .controls-element button:is(:hover, .active) {
                background-color: dimgray;
                color: gainsboro;
            }
            .controls-element button .bi {
                margin-left: 0.5rem;
            }
            `,
        ]
    }

}

/**
 * @define
 */
customElements.define( 'cfunctions-inspector', Inspector );
