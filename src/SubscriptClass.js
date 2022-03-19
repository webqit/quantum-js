
/**
 * @imports
 */
import SubscriptFunction from './SubscriptFunction.js';

/**
 * ---------------------------
 * SubscriptClass Mixin
 * ---------------------------
 */

export const Mixin = Class => class extends ( Class || class {} ) {

    static get subscriptMethods() {
        return [];
    }
    
    static implementMethod( method, thisBinding = undefined ) {
       return SubscriptFunction.clone( method, thisBinding );
    }

    /**
     * @constructor()
     */
    constructor() {
        super();
        const subscriptConstructor = this.constructor;
        subscriptConstructor.subscriptMethods.forEach( methodName => {
            if ( !this[ methodName ] ) {
                throw new Error( `${ methodName } is not a method.` );
            }
            if ( methodName === 'constructor' ) {
                throw new Error( `Class constructors cannot be subscript methods.` );
            }
            this[ methodName ] = subscriptConstructor.implementMethod( this[ methodName ], this );
        } );
    }

}