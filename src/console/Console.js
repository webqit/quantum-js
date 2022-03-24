
/**
 * @imports
 */
import CodeBlock from './CodeBlock.js';
import Unit from './Unit.js';

/**
 * @Console
 */
export default class Console extends CodeBlock( Unit ) {

    bind( subscriptFunction, autoRender = true ) {
        if ( autoRender ) {
            // Sets both textarea and codeBlock
            this.innerHTML = subscriptFunction.originalSource;
        }
        setTimeout( () => {
            if ( !this._codeBlock.textContent.length ) return;
            let runtime = subscriptFunction.runtime;
            super.bind( { runtime, graph: runtime.graph } );
        }, 0 );
    }

    createRef( refBinding ) { }

    getTextNodes( from = null ) {
        return super.getTextNodes( from || this._codeBlock );
    }

    /**
     * ----------
     *  CSS
     * ----------
     */

    get css() {
        return super.css.concat([
            `
            .ref-identifier.path-runtime-active {
                text-decoration: underline;
            }
            .ref-identifier:is(.path-runtime-active) {
            }

            .ref-identifier.cause {
                cursor: default;
            }

            .ref-identifier.effect {
                cursor: pointer;
            }

            .ref-identifier.cause:is(.path-hover, .path-runtime-active) {
                color: aqua;
            }
            .token.keyword .ref-identifier.cause:is(.path-hover, .path-runtime-active) {
                color: mediumturquoise;
            }
            
            .ref-identifier.effect:is(.path-hover, .path-runtime-active) {
                color: yellowgreen;
                text-decoration: underline;
            }

            .ref-identifier.cause.effect:is(.path-hover, .path-runtime-active) {
                color: lightgreen;
            }

            subscript-unit.block-hover,
            subscript-unit.block-runtime-active {
                outline: 1px dashed gray;
                outline-offset: 0.1rem;
                border-radius: 0.1rem;
                /*
                background-color: darkblue;
                */
            }
            subscript-unit.block-runtime-active {
                background-color: rgba(100, 100, 100, 0.35);
            }
            `
        ]);
    }

}

/**
 * @define
 */
customElements.define( 'subscript-codeblock', CodeBlock() );
customElements.define( 'subscript-unit', Unit );
customElements.define( 'subscript-console', Console );
