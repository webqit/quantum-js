
/**
 * @imports
 */
import Effect from './Effect.js';

export default class Runtime extends Effect {

    static create( compilation, parameters = [], params = {} ) {
        const _Function = compilation.graph.hoistedAwaitKeyword ? Object.getPrototypeOf( async function() {} ).constructor : Function;
        const callee = new _Function( compilation.identifier, ...parameters, compilation.source );
        const runtime = new this( null, compilation.graph, callee, params );
        return runtime;
    }

    constructor( parentEffect, graph, callee, params = {}, exits = null ) {
        super( parentEffect, graph, callee, params = {}, exits );
        this.observers = [];
    }

    observe( effectUrl, callback ) {
        if ( !this.params.devMode ) {
            // TODO: Only allow observers in dev mode
            //throw new Error( `Observers are allowed only in dev mode.` );
        }
        this.observers.push( { effectUrl, callback } );
    }

    fire( effectUrl, event, refs ) {
        ( this.observers || [] ).forEach( observer => {
            if ( observer.effectUrl !== effectUrl ) return;
            observer.callback( event, refs );
        } );
    }

}