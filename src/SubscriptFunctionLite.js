
/**
 * @imports
 */
import { resolveParams } from './params.js';
import { normalizeTabs } from './util.js';
import Runtime from './runtime/Runtime.js';
import inspect from './runtime/inspect.js';

/**
 * @SubscriptFunctionLite
 */
export default function SubscriptFunctionLite( ...args ) {
    if ( typeof window !== 'object' ) throw new Error( `No window in context.` );
    // --------------------
    const params = resolveParams( typeof args[ args.length - 1 ] === 'object' ? args.pop() : {} );
    const source = normalizeTabs( args.pop() || '' );
    const parameters = args;
    const createFunction = compilation => Runtime.createFunction( undefined, compilation, parameters, params.runtimeParams, this, source );
    // --------------------
    // SubscriptCompiler has been loaded sync?
    if ( window.wq?.SubscriptCompiler && !params.runtimeParams.async ) {
        const { parse, compile } = window.wq.SubscriptCompiler;
        const ast = parse( source, params.parserParams );
        return createFunction( compile( ast, params.compilerParams ) );
    }
    // Load and run SubscriptCompiler async - in the background?
    if ( !window.wq?.SubscriptCompilerWorker ) {
        const customUrl = document.querySelector( 'meta[name="subscript-compiler-url"]' );
        const compilerUrl = customUrl?.content || `https://unpkg.com/@webqit/subscript/dist/compiler.js`;
        const workerScriptText = `
        importScripts( '${ compilerUrl }' );
        const { parse, compile } = self.wq.SubscriptCompiler;
        self.onmessage = e => {
            const { source, params } = e.data;
            const ast = parse( source, params.parserParams );
            const compilation = compile( ast, params.compilerParams );
            compilation.identifier = compilation.identifier.toString();
            e.ports[ 0 ]?.postMessage( compilation );
        };`;
        window.wq = window.wq || {};
        window.wq.SubscriptCompilerWorker = new Worker( `data:text/javascript;base64,${ btoa( workerScriptText ) }` );
    }
    return createFunction( new Promise( res => {
        let messageChannel = new MessageChannel;
        wq.SubscriptCompilerWorker.postMessage( { source, params }, [ messageChannel.port2 ] );
        messageChannel.port1.onmessage = e => res( e.data );
    } ) );
}

/**
 * @inspect
 */
Object.defineProperty( SubscriptFunctionLite, 'inspect', { value: inspect } );
