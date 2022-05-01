
/**
 * @imports
 */
import Unit from './Unit.js';

export default class Runtime extends Unit {

    static create( compilation, parameters = [], params = {} ) {
        const _Function = compilation.graph.hoistedAwaitKeyword ? Object.getPrototypeOf( async function() {} ).constructor : Function;
        const callee = params.compileFunction 
            ? params.compileFunction( compilation.source, [ compilation.identifier ].concat( parameters ) )
            : new _Function( compilation.identifier, ...parameters, compilation.source );
        const runtime = new this( null, compilation.graph, callee, params );
        return runtime;
    }

    constructor( ownerUnit, graph, callee, params = {}, exits = null ) {
        super( ownerUnit, graph, callee, params = {}, exits );
        this.observers = [];
    }

    observe( unitUrl, callback ) {
        if ( !this.params.devMode ) {
            // Only allow observers in dev mode
            //throw new Error( `Observers are allowed only in dev mode.` );
        }
        this.observers.push( { unitUrl, callback } );
    }

    fire( unitUrl, event, refs ) {
        ( this.observers || [] ).forEach( observer => {
            if ( observer.unitUrl !== unitUrl ) return;
            observer.callback( event, refs );
        } );
    }

}