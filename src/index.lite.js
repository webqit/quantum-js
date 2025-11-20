import Observer from '@webqit/observer';
import LiveMode from './runtime/LiveMode.js';
import { _$functionArgs } from './util.js';
import AbstractLiveScript from './AbstractLiveScript.js';
import { compile as $$compile } from './runtime/index.js';

export { Observer, LiveMode }
export { nextKeyword, matchPrologDirective } from './util.js';

export let LiveFunction;

export function AsyncLiveFunction(...args) {
    const { source, params } = _$functionArgs(args);

    const transformedFunction = compile('async-function-source', source, params);
    if (!(transformedFunction instanceof Promise)) return transformedFunction;
    // Introduce a wrapper function that awaits main function
    const wrapperFunction = async function (...args) { return (await transformedFunction).call(this, ...args); }
    Object.defineProperty(wrapperFunction, 'toString', { value: async function (...args) { return (await transformedFunction).toString(...args) } })

    return wrapperFunction;
}

export let LiveScript;

export class AsyncLiveScript extends AbstractLiveScript {
    static sourceType = 'async-script-source';
    static astTools = { parse, transform, serialize };
}

export class LiveModule extends AbstractLiveScript {
    static sourceType = 'module';
    static astTools = { parse, transform, serialize };
}

// ------------------

export function compile(sourceType, source, ...params) {
    return $$compile(sourceType, { parse, transform, serialize }, source, ...params);
}

export function parse(input, params) {
    return exec('parse', input, params);
}

export function transform(input, params) {
    return exec('transform', input, params);
}

export function serialize(input, params) {
    return exec('serialize', input, params);
}

function exec(action, input, params) {
    // To string magic
    const patchToString = (result) => {
        Object.defineProperty(result, 'toString', {
            value: base64 => base64 === 'base64' ? result.transformedSourceBase64 : result.transformedSource
        });
        return result;
    };

    // $useLiveT has been loaded sync?
    if (globalThis.webqit?.$useLiveT) {
        const { parse, transform, serialize } = globalThis.webqit.$useLiveT;
        if (action === 'serialize') return serialize(input, params);
        if (action === 'parse') return parse(input, params);
        if (action === 'transform') {
            const result = transform(input, params);
            return patchToString(result);
        }
    }

    // Load and run $useLiveT async - in the background?
    globalThis.webqit = globalThis.webqit || {};
    if (!globalThis.webqit.$useLiveTWorker) {
        const customUrl = document.querySelector('meta[name="$q-transformer-url"]');
        const transformerUrls = (customUrl?.content.split(',') || []).concat('https://unpkg.com/@webqit/use-live/dist/transformer.js');
        const workerScriptText = `
        const transformerUrls = [ '${transformerUrls.join(`','`)}' ];
        ( function importScript() {
            try { importScripts( transformerUrls.shift().trim() ) } catch( e ) { if ( transformerUrls.length ) { importScript(); } }
        } )();
        const { parse, transform, serialize } = globalThis.webqit.$useLiveT;
        globalThis.onmessage = e => {
            const { action, input, params } = e.data;
            let result;
            if (action === 'serialize') {
                result = serialize(input, params);
            } else if (action === 'parse') {
                result = parse(input, params);
            } else if (action === 'transform') {
                const { toString, ...compilation } = transform(input, params);
                result = compilation;
            }
            e.ports[0]?.postMessage(result);
        };`;
        globalThis.webqit.$useLiveTWorker = new Worker(`data:text/javascript;base64,${btoa(workerScriptText)}`);
    }

    // Run in background
    return new Promise(res => {
        let messageChannel = new MessageChannel;
        webqit.$useLiveTWorker.postMessage({ action, input, params }, [messageChannel.port2]);
        messageChannel.port1.onmessage = e => {
            const result = e.data;
            if (action === 'transform') patchToString(result);
            res(result);
        }
    });
}