import Observer from '@webqit/observer';
import LiveProgramHandle from './runtime/LiveProgramHandle.js';
import { _$functionArgs } from './util.js';
import { parse, transform, serialize } from './transformer/index.js';
import { compile as $$compile } from './runtime/index.js';
import AbstractLiveScript from './AbstractLiveScript.js';

export { Observer, LiveProgramHandle }
export { nextKeyword, matchPrologDirective } from './util.js';

export function LiveFunction(...$args) {
    const { source, args, params } = _$functionArgs($args);
    return compile('function-source', source, args, params);
}

export function AsyncLiveFunction(...$args) {
    const { source, args, params } = _$functionArgs($args);
    return compile('async-function-source', source, args, params);
}

export class LiveScript extends AbstractLiveScript {
    static sourceType = 'script';
    static astTools = { parse, transform, serialize };
}

export class AsyncLiveScript extends AbstractLiveScript {
    static sourceType = 'async-script';
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

export {
    parse,
    transform,
    serialize
}