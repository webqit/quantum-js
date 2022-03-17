
/**
 * @imports
 */
import { normalizeTabs } from '../util.js';
import Base from './Base.js';

/**
 * @CodeBlock
 */
export default CodeBlock => class extends Base( CodeBlock || HTMLElement ) {

    static get observedAttributes() {
        return [ 'name', 'editable', 'placeholder' ];
    }

    connectedCallback() {
        let escape = html => html.replace( new RegExp( '&', 'g' ), '&amp;' ).replace( new RegExp( '<', 'g' ), '&lt;' );
        this._lang = 'javascript';
        this._editable = this.getAttribute( 'editable' );
        this._styledBlock = this.getAttribute( 'styled-block' ) || 'pre';
        // ----------------
        this._div = document.createElement( 'div' );
        this._preBlock = this._div.appendChild( document.createElement( 'pre' ) );
        this._codeBlock = this._preBlock.appendChild( document.createElement( 'code' ) );
        this._div.classList.add( 'line-numbers' );
        this._div.classList.add( 'container' );
        //this._preBlock.setAttribute( 'data-label', 'Test' );
        //this._div.classList.add( 'match-braces' );
        //this._preBlock.setAttribute( 'data-line', '1' );
        if ( this._lang ) {
            this._preBlock.classList.add( 'language-' + this._lang );
            this._codeBlock.classList.add( 'language-' + this._lang );
        }
        this._contentSlot = document.createElement( 'slot' );
        this._contentSlot.setAttribute( 'aria-hidden', 'true' );
        this._contentSlot.setAttribute( 'hidden', 'true' );
        this._initialSlotEvent = false;
        this._contentSlot.addEventListener( 'slotchange', () => {
            let html = this._contentSlot.assignedNodes().reduce( ( _html, node ) => _html + ( node.outerHTML || node.nodeValue || '' ), '' );
            if ( !this._initialSlotEvent ) {
                html = normalizeTabs( html );
                this._initialSlotEvent = true;
            }
            if ( this._textarea ) {
                this._textarea.value = html;
            }
            this.source = escape( html );
        } );
        // ----------------
        if ( this._editable === 'true' ) {
            this._addEditor();
        }
        // ----------------
        this.shadowRoot.append( this._contentSlot, this._textarea || '', this._div );
        // ----------------
        super.connectedCallback();
    }

    get source() {
        return this._codeBlock.textContent;
    }

    set source( text ) {
        if ( text.endsWith( "\n" ) ) {
            text += " ";
        }
        this._codeBlock.innerHTML = '';
        this._codeBlock.innerHTML = text;
        this._highlightCodeBlock();
        this._syncScrolling();
    }

    get name() {
        return this._name;
    }

    set name( newValue ) {
        return this.setAttribute( 'name', newValue );
    }

    get placeholder() {
        return this._placeholder;
    }

    set placeholder( newValue ) {
        return this.setAttribute( 'placeholder', newValue );
    }

    get editable() {
        return this._editable;
    }

    set editable( newValue ) {
        return this.setAttribute( 'editable', newValue === true ? 'true' : ( newValue === false ? 'false' : newValue ) );
    }

    _addEditor() {
        this._placeholder = this.getAttribute( 'placeholder' ),
        this._name = this.getAttribute( 'name' );
        this._textarea = this._div.appendChild( document.createElement( 'textarea' ) );
        this._textarea.placeholder = this._placeholder || this._lang;
        this._textarea.spellcheck = false;
        this._textarea.name = this._name || '';
        this._textarea.value = this._codeBlock.textContent;
        this._preBlock.setAttribute( 'aria-hidden', 'true' );
        this._scrollBlock = this.getAttribute( 'scroll-block' ) === 'code' ? this._codeBlock : this._preBlock;
        this._textarea.addEventListener( 'input', e => { this.source = e.target.value } );
        this._textarea.addEventListener( 'input', () => this._syncScrolling() );
        this._textarea.addEventListener( 'scroll', () => this._syncScrolling() );
        this._textarea.addEventListener( 'keydown', e => this._handleTabKeyEvent( e ) );
    }

    _handleTabKeyEvent( e ) {
        if ( !this._textarea ) return;
        if ( e.key !== 'Tab' ) return;
        e.preventDefault()
        let text = this._textarea.value,
            selectionStart = this._textarea.selectionStart, // where cursor moves after tab - moving forward by 1 indent
            selectionEnd = this._textarea.selectionEnd; // where cursor moves after tab - moving forward by 1 indent
        if ( selectionStart === selectionEnd ) {
            let beforeSelection = text.slice( 0, selectionStart ); // text before tab
            let afterSelection = text.slice( selectionEnd, text.length ); // text after tab
            let cursorLocation = selectionEnd + 1; // where cursor moves after tab - moving forward by 1 char to after tab
            // Add tab char
            this._textarea.value = beforeSelection + "\t" + afterSelection;
            // Move cursor
            this._textarea.selectionStart = cursorLocation;
            this._textarea.selectionEnd = cursorLocation;
        } else {
            let lines = text.split( "\n" ),
                letter_i = 0,
                numberIndents = 0,
                firstLineIndents = 0;
            for ( let i = 0; i < lines.length; i ++ ) {
                letter_i += lines[ i ].length;
                if( selectionStart < letter_i && selectionEnd > letter_i - lines[ i ].length ) {
                    if( e.shiftKey ) {
                        if ( lines[ i ][ 0 ] === "\t" ) {
                            lines[ i ] = lines[i].slice( 1 );
                            if ( numberIndents === 0 ) firstLineIndents --;
                            numberIndents --;
                        }
                    } else {
                        lines[ i ] = "\t" + lines[ i ];
                        if ( numberIndents === 0 ) firstLineIndents ++;
                        numberIndents ++;
                    }
                }
            }
            this._textarea.value = lines.join( "\n" );
            // Move cursor
            this._textarea.selectionStart = selectionStart + firstLineIndents;
            this._textarea.selectionEnd = selectionEnd + numberIndents;
        }
        this.source = this._textarea.value;
    }

    _syncScrolling() {
        if ( !this._scrollBlock ) return;
        this._scrollBlock.scrollTop = this._textarea.scrollTop;
        this._scrollBlock.scrollLeft = this._textarea.scrollLeft;
    }

    _highlightCodeBlock() {
        Prism.highlightElement( this._codeBlock );
    }

    disconnectedCallback() {
        Array.from( this.shadowRoot.childNodes ).forEach( node => node.remove() );
    }

    attributeChangedCallback( name, oldValue, newValue ) {
        if ( !this.childNodes.length ) {
            return;
        }
        switch ( name ) {
            case 'name':
                this._name = newValue;
                this._textarea.name = newValue;
                break;
            case 'placeholder':
                this._placeholder = newValue;
                this._textarea.placeholder = newValue;
                break;
            case 'editable':
                this._editable = newValue;
                if ( this._textarea ) {
                    this._textarea.disabled = newValue === 'false';
                } else if ( newValue === 'true' ) {
                    this._addEditor();
                }
                if ( newValue === 'true' ) {
                    this._textarea.focus();
                }
                break;
        }
    }

    /**
     * ----------
     *  CSS
     * ----------
     */

    get css() {
        return [
            `https://unpkg.com/@webqit/subscript/src/console/assets/prism.css`,
            `https://unpkg.com/@webqit/subscript/src/console/assets/vs-code-dark.css`,
            `
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
                box-sizing: border-box;
            }
            :host {
                /* Allow other elems to be inside */
                position: relative;
                top: 0;
                left: 0;
                display: block;
                
                /* Normal inline styles */
                
                font-size: 0.8rem;
                font-family: monospace;
                line-height: 1.2rem;
                tab-size: 2;
                caret-color: darkgrey;
                white-space: pre;
                overflow: hidden;
            }
            .container {
                min-height: 100%;
                width: 100%;
                display: flex;
            }
            .container > * {
                width: 100%;
            }
            
            textarea, ${ this._styledBlock } {
                /* Both elements need the same text and space styling so they are directly on top of each other */
                margin: 0px !important;
                padding-top: var(--vertical-padding, 1.5rem) !important;
                padding-bottom: var(--vertical-padding, 1.5rem) !important;
                padding-left: var(--horizontal-padding, 1rem) !important;
                padding-right: var(--horizontal-padding, 1rem) !important;
                border: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            ${ this._styledBlock === 'code' ? 'pre' : 'code' } {
                margin: 0px !important;
                border: 0px !important;
                padding: 0px !important;
                overflow: auto !important;
                width: 100% !important;
                height: 100% !important;
            }
            .line-numbers :is(textarea, pre[class*=language-]) {
                padding-left:3.8rem !important;
            }
            textarea, pre, pre * {
                /* Also add text styles to highlighing tokens */
                font-size: inherit !important;
                font-family: inherit !important;
                line-height: inherit !important;
                tab-size: inherit !important;
            }
            
            textarea, pre {
                /* In the same place */
                position: absolute;
                top: 0;
                left: 0;
            }
            textarea[disabled] {
                pointer-events: none !important;
            }
            
            /* Move the textarea in front of the result */
            
            textarea {
                z-index: 1;
            }
            pre {
                z-index: 0;
            }
            
            /* Make textarea almost completely transparent */
            
            textarea {
                color: transparent;
                background: transparent;
                caret-color: inherit!important; /* Or choose your favourite color */
            }
            
            /* Can be scrolled */
            textarea, pre {
                overflow: auto !important;
            
                white-space: inherit !important;
                word-spacing: normal !important;
                word-break: normal !important;
                word-wrap: normal !important;
            }
            
            /* No resize on textarea; stop outline */
            textarea {
                resize: none;
                outline: none !important;
            }
            .line-numbers-rows {
                border: none !important;
                color: dimgray !important;
            }
            `,
        ]
    }

}
