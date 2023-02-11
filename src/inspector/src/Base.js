
/**
 * @Console2
 */
export default Element => class Base extends Element {

    constructor() {
        super();
        this.attachShadow( { mode: 'open' } );
    }

    connectedCallback() {
        [].concat( this.css ).forEach( css => {
            if ( css.includes( '{' ) && css.includes( ':' ) && css.includes( ';' ) ) {
                let cssElement = this.shadowRoot.appendChild( document.createElement( 'style' ) );
                cssElement.textContent = css;
            } else {
                let cssElement = this.shadowRoot.appendChild( document.createElement( 'link' ) );
                cssElement.setAttribute( 'rel', 'stylesheet' );
                cssElement.setAttribute( 'href', css );
            }
        } );
    }

    /**
     * ----------
     *  CSS
     * ----------
     */

     get css() {
        return []
    }

}