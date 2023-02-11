
/**
 * @imports
 */
import SubscriptFunction from '../SubscriptFunctionLite.js';
import Base from './src/Base.js';

/**
 * @Console2
 */
export default class Sandbox extends Base( HTMLElement ) {

    connectedCallback() {
        this.autoMode = this.getAttribute( 'auto-mode' );
        this.visualizerElement = document.createElement( 'cfunctions-visualizer' );
        this.controlsElement = document.createElement( 'div' );
        this.controlsElement.classList.add( 'controls-element' );
        this.buttons = {};
        [ 'edit', 'play' ].forEach( type => {
            let title = type.substring( 0, 1 ).toUpperCase() + type.substring( 1 );
            this.buttons[ type ] = this.controlsElement.appendChild( document.createElement( 'button' ) );
            this.buttons[ type ].classList.add( type );
            this.buttons[ type ].setAttribute( 'title',  title );
            let iconElement = this.buttons[ type ].appendChild( document.createElement( 'i' ) );
            let iconClasses = this.getAttribute( `data-${ type }-icon` ) || `bi bi-${ type === 'edit' ? 'pencil' : type }`;
            iconClasses.split( ' ' ).map( str => str.trim() ).forEach( str => iconElement.classList.add( str ) );
            let textElement = this.buttons[ type ].appendChild( document.createElement( 'span' ) );
            textElement.append( ' ',  title );
            this.buttons[ type ].addEventListener( 'click', e => {
                if ( this.active ) {
                    this.active.classList.remove( 'active' );
                }
                this.active = this.buttons[ type ];
                this.active.classList.add( 'active' );
            } );
        } );

        this.buttons.edit.addEventListener( 'click', e => this.switchEditable( true ) );
        this.buttons.play.addEventListener( 'click', e => this.switchEditable( false ) );

        // ----------------
        this.shadowRoot.append( this.controlsElement, this.visualizerElement );
        // ----------------
        super.connectedCallback();
        setTimeout( () => {
            this.visualizerElement.innerHTML = this.innerHTML;
            setTimeout( () => {
                this.loadConsole();
                if ( !this.autoMode ) return;
                this.buttons[ this.autoMode ].dispatchEvent( new MouseEvent( 'click' ) );
            }, 0 );
        }, 0 );
    }

    loadConsole() {
        this.fn = SubscriptFunction( this.visualizerElement.source /* innerHTML normalized */, { devMode: true } );
        this.visualizerElement.visualize( this.fn, false );
    }

    switchEditable( editable ) {
        this.visualizerElement.editable = editable;
        if ( editable ) {
            if ( this.fn ) {
                this.fn.dispose();
                this.fn = null;
            }
        } else {
            if ( !this.fn ) { this.loadConsole(); }
            this.fn();
        }
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
            .controls-element button {
                display: inline-flex;
                align-items: center;
                background-color: transparent;
                padding: 0.5rem 1rem;
                border: none;
                color: silver;
            }
            .controls-element button:is(:hover, .active) {
                background-color: var(--active-bg-color, dimgray);
                color: var(--active-color, gainsboro);
            }
            .controls-element button .bi {
                margin-right: 0.5rem;
            }
            .controls-element button .bi.bi-play {
                font-size: larger;
            }

            @media (min-width: 800px) {
                :host(.layout2) {
                    display: flex;
                    display: -webkit-flex;
                }
                :host(.layout2) cfunctions-visualizer {
                    flex-grow: 1;
                }
                :host(.layout2) .controls-element {
                    flex-basis: 1rem;
                }
                :host(.layout2) .controls-element button {
                    width: 100%;
                    text-align: center;
                    display: block;
                    padding: 1rem;
                }
                :host(.layout2) .controls-element button span {
                    display: none;
                }
                :host(.layout2) .controls-element button .bi {
                    margin-right: 0;
                }
            }
            `,
        ]
    }

}

/**
 * @define
 */
customElements.define( 'cfunctions-sandbox', Sandbox );
