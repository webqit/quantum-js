
/**
 * @imports
 */
import Subscript from '../Subscript.js';
import Base from './Base.js';
import './index.js';

/**
 * @Console2
 */
export default class Player extends Base( HTMLElement ) {

    connectedCallback() {
        this.consoleElement = document.createElement( 'subscript-console' );
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
        this.shadowRoot.append( this.controlsElement, this.consoleElement );
        // ----------------
        super.connectedCallback();
        setTimeout( () => {
            this.consoleElement.innerHTML = this.innerHTML;
            setTimeout( () => {
                this.loadConsole();
            }, 0 );
        }, 0 );
    }

    loadConsole() {
        this.program = Subscript( this.consoleElement.source /* innerHTML normalized */ );
        this.consoleElement.bind( this.program, false );
    }

    switchEditable( editable ) {
        this.consoleElement.editable = editable;
        if ( editable ) {
            if ( this.program ) {
                this.program.dispose();
                this.program = null;
            }
        } else {
            if ( !this.program ) {
                this.loadConsole();
            }
            this.program();
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
                background-color: dimgray;
                color: gainsboro;
            }
            .controls-element button .bi {
                margin-right: 0.5rem;
            }
            .controls-element button .bi.bi-play {
                font-size: larger;
            }

            :host(.layout2) {
                display: flex;
                display: -webkit-flex;
            }
            :host(.layout2) subscript-console {
                flex-grow: 1;
            }
            :host(.layout2) .controls-element {
                flex-basis: 1rem;
            }
            :host(.layout2) .controls-element button {
                padding: 1rem;
            }
            :host(.layout2) .controls-element button span {
                display: none;
            }
            :host(.layout2) .controls-element button .bi {
                margin-right: 0;
            }
            `,
        ]
    }

}

customElements.define( 'subscript-player', Player );
