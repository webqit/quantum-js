
/**
 * @imports
 */
import Contract from './Contract.js';

export default class Runtime extends Contract {

    static create( compilation, parameters = [], runtimeParams = {} ) {
        const _Function = compilation.graph.hoistedAwaitKeyword ? Object.getPrototypeOf( async function() {} ).constructor : Function;
        const callee = runtimeParams.compileFunction 
            ? runtimeParams.compileFunction( compilation.source, [ compilation.identifier + '' ].concat( parameters ) )
            : new _Function( compilation.identifier + '', ...parameters, compilation.source );
        const runtime = new this( null, compilation.graph, callee, runtimeParams );
        return runtime;
    }

    constructor( ownerContract, graph, callee, runtimeParams = {}, exits = null ) {
        super( ownerContract, graph, callee, runtimeParams = {}, exits );
        this.observers = [];
    }

    observe( contractUrl, callback ) {
        if ( !this.params.devMode ) {
            // Only allow observers in dev mode
            //throw new Error( `Observers are allowed only in dev mode.` );
        }
        this.observers.push( { contractUrl, callback } );
    }

    fire( contractUrl, event, refs ) {
        ( this.observers || [] ).forEach( observer => {
            if ( observer.contractUrl !== contractUrl ) return;
            observer.callback( event, refs );
        } );
    }

}