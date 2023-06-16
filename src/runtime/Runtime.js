
/**
 * @imports
 */
import { _await } from '../util.js';
import Reflex from './Reflex.js';

export default class Runtime extends Reflex {

    static create( compilation, parameters = [], runtimeParams = {} ) {
        const isAsync = runtimeParams.async || compilation.graph.hoistedAwaitKeyword;
        const _Function = isAsync ? Object.getPrototypeOf( async function() {} ).constructor : Function;
        const callee = runtimeParams.compileFunction 
            ? runtimeParams.compileFunction( compilation.source, [ compilation.identifier + '' ].concat( parameters ) )
            : new _Function( compilation.identifier + '', ...parameters, compilation.source );
        compilation.graph.locations = compilation.locations;
        return new this( null, compilation.graph, callee, runtimeParams );
    }

    static createFunction( sourceName, compilation, parameters = [], runtimeParams = {}, defaultThis, originalSource = null ) {
        runtimeParams = { ...runtimeParams, functionType: 'Constructor', };
        if ( compilation instanceof Promise ) { runtimeParams = { ...runtimeParams, async: true, }; }
        const createCallback = instance => {
            // Subsequent calls avoid recompilation
            if ( instance ) { return new this( null, instance.graph, instance.callee, runtimeParams ); }
            // Supports lazy compilation. So, input compilation may be a Promise
            return _await( compilation, _compilation => applyReflection( this.create( _compilation, parameters, runtimeParams ) ) );
        };
        const applyReflection = instance => {
            if ( instance.graph.originalSource && !instance.graph.originalSourceModified ) {
                const ownSource = `${ runtimeParams.async || instance.graph.hoistedAwaitKeyword ? 'async ' : '' }function ${ sourceName || 'anonymous' }`;
                const originalSourceIndented = instance.graph.originalSource.split(/\n/g).map( line => `    ${ line }` ).join( `\n` );
                instance.graph.originalSource = `${ ownSource }(${ parameters.join( ', ' ) }) {\n${ originalSourceIndented }\n}`;
                instance.graph.originalSourceModified = true;
            }
            if ( sourceName ) { Object.defineProperty( instance.callee, 'name', { configurable: true, value: sourceName } ); }
            return instance;
        };
        return this.prototype.createFunction( createCallback, defaultThis );
    }

}