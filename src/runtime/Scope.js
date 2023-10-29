
/**
 * @import
 */
import Signal from './Signal.js';

export default class Scope extends Signal {

    symbols = new Map;
    constructor( context, type, state = undefined ) {
        super( context, type, state || Object.create( null ) );
    }

}