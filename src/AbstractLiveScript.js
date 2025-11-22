
import { _await } from './util.js';
import { compile as $compile } from './runtime/index.js';

export default class AbstractLiveScript {
    constructor(...args) {
        const $static = this.constructor;
        const params = typeof args[args.length - 1] === 'object' ? args.pop() : {};
        this.source = args.pop() || '';
        this.$program = $compile($static.sourceType, $static.astTools, this.source, { ...params, forDynamicBinding: true });
    }

    execute() {
        return _await(this.$program, ([precompiled, $$cx]) => _await(precompiled($$cx), (runtime) => runtime.execute()));
    }

    bind(thisContext, env = undefined) {
        return _await(this.$program, ([precompiled, $$cx]) => precompiled({ ...$$cx, thisContext, env }));
    }

    toString($qSource = false) {
        if (!$qSource) return this.source;
        return _await(this.$program, ([precompiled]) => precompiled + '');
    }
}