
/**
 * @imports
 */
import { resolveParams } from './params.js';
import { normalizeTabs } from './util.js';
import Runtime from './runtime/Runtime.js';
import inspect from './runtime/inspect.js';

/**
 * @ContractFunctionLite
 */
export default function ContractFunctionLite( ...args ) {
    if ( typeof window !== 'object' ) throw new Error( `No window in context.` );
    // --------------------
    const params = resolveParams( typeof args[ args.length - 1 ] === 'object' ? args.pop() : {} );
    const source = normalizeTabs( args.pop() || '' );
    const parameters = args;
    const createFunction = compilation => Runtime.createFunction( undefined, compilation, parameters, params.runtimeParams, this, source );
    // --------------------
    // ContractCompiler has been loaded sync?
    if ( window.webqit?.ContractCompiler && !params.runtimeParams.async ) {
        const { parse, compile } = window.webqit.ContractCompiler;
        const ast = parse( source, params.parserParams );
        return createFunction( compile( ast, params.compilerParams ) );
    }
    window.webqit = window.webqit || {};
    // Load and run ContractCompiler async - in the background?
    if ( !window.webqit.ContractCompilerWorker ) {
        const customUrl = document.querySelector( 'meta[name="contract-compiler-url"]' );
        const compilerUrls = ( customUrl?.content.split( ',' ) || [] ).concat( 'https://unpkg.com/@webqit/contract/dist/compiler.js' );
        const workerScriptText = `
        const compilerUrls = [ '${ compilerUrls.join( `','` ) }' ];
        ( function importScript() {
            try { importScripts( compilerUrls.shift().trim() ) } catch( e ) { if ( compilerUrls.length ) { importScript(); } }
        } )();
        const { parse, compile } = self.webqit.ContractCompiler;
        self.onmessage = e => {
            const { source, params } = e.data;
            const ast = parse( source, params.parserParams );
            const compilation = compile( ast, params.compilerParams );
            compilation.identifier = compilation.identifier.toString();
            e.ports[ 0 ]?.postMessage( compilation );
        };`;
        window.webqit.ContractCompilerWorker = new Worker( `data:text/javascript;base64,${ btoa( workerScriptText ) }` );
    }
    return createFunction( new Promise( res => {
        let messageChannel = new MessageChannel;
        webqit.ContractCompilerWorker.postMessage( { source, params }, [ messageChannel.port2 ] );
        messageChannel.port1.onmessage = e => res( e.data );
    } ) );
}

/**
 * @inspect
 */
Object.defineProperty( ContractFunctionLite, 'inspect', { value: inspect } );
