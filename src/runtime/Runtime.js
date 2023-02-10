
/**
 * @imports
 */
import { _await } from '../util.js';
import Contract from './Contract.js';
import inspection from './inspect.js';

export default class Runtime extends Contract {

    static create( compilation, parameters = [], runtimeParams = {} ) {
        const isAsync = runtimeParams.async || compilation.graph.hoistedAwaitKeyword;
        const _Function = isAsync ? Object.getPrototypeOf( async function() {} ).constructor : Function;
        const callee = runtimeParams.compileFunction 
            ? runtimeParams.compileFunction( compilation.source, [ compilation.identifier + '' ].concat( parameters ) )
            : new _Function( compilation.identifier + '', ...parameters, compilation.source );
        return new this( null, compilation.graph, callee, runtimeParams );
    }

    static createFunction( sourceName, compilation, parameters = [], runtimeParams = {}, defaultThis, originalSource = null ) {
        runtimeParams = { ...runtimeParams, functionType: 'Constructor', };
        if ( compilation instanceof Promise ) { runtimeParams = { ...runtimeParams, async: true, }; }
        const createCallback = contract => {
            // Subsequent calls avoid recompilation
            if ( contract ) { return new this( null, contract.graph, contract.callee, runtimeParams ); }
            // Supports lazy compilation. So, input compilation may be a Promise
            return _await( compilation, _compilation => applyReflection( this.create( _compilation, parameters, runtimeParams ) ) );
        };
        const applyReflection = contract => { 
            if ( contract.graph.originalSource && !contract.graph.originalSourceModified ) {
                const ownSource = `${ runtimeParams.async || contract.graph.hoistedAwaitKeyword ? 'async ' : '' }function ${ sourceName || 'anonymous' }`;
                const originalSourceIndented = contract.graph.originalSource.split(/\n/g).map( line => `    ${ line }` ).join( `\n` );
                contract.graph.originalSource = `${ ownSource }(${ parameters.join( ', ' ) }) {\n${ originalSourceIndented }\n}`;
                contract.graph.originalSourceModified = true;
            }
            if ( sourceName ) { Object.defineProperty( contract.callee, 'name', { configurable: true, value: sourceName } ); }
            return contract;
        };
        const _function = this.prototype.createFunction( createCallback, defaultThis );
        inspection( _function, 'locations', _await( compilation, _compilation => ( {
            locations: _compilation.locations,
        } ) ) );
        return _function;
    }

}