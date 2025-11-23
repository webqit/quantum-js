
/**
 * @import
 */
import Observer from '@webqit/observer';
import { _isTypeObject } from '../util.js';
import EventTarget from './EventTarget.js';

export default class Signal extends EventTarget {

    subscribers = new Set;
    signals = new Map;

    constructor(context, type, state) {
        super();
        this.context = context;
        this.context?.once(() => this.abort());
        this.once(() => this.watchMode(false));
        this.type = type;
        this.state = state;
    }

    get name() { return [...this.context?.signals.keys() || []].find(k => this.context.signals.get(k) === this); }

    signal(name, type = 'prop') {
        let signal = this.signals.get(name);
        if (!signal) {
            // Initialization
            signal = new Signal(
                this,
                type,
                type === 'object' ? name : (_isTypeObject(this.state) ? Observer.get(this.state, name) : undefined)
            );
            this.signals.set(name, signal);
            // Self-start
            if (this.signals.size === 1) { this.watchMode(); }
            // Cleanup
            signal.once(() => {
                // On being killed, auto-delete
                this.signals.delete(name);
                // On empty self-kill
                if (!this.signals.size) { this.watchMode(false); }
            });
        }
        return signal;
    }

    subscribe(autorun) {
        this.subscribers.add(autorun);
        autorun.once(() => {
            // Cleanup
            this.subscribers.delete(autorun);
            // On empty self-kill
            if (!this.subscribers.size) { this.abort(); }
        });
    }

    watchMode(flag = true) {
        this.mutationsWatch?.abort();
        if (!flag || !this.signals.size || !_isTypeObject(this.state)) return;
        this.mutationsWatch = Observer.observe(this.state, mutations => {
            // Find subscribers and organize them by target runtime
            const groupings = {
                map: new Map,
                add(autoruns, mutation, signal) {
                    for (const autorun of autoruns) {
                        if (autorun.runtime.thread.includes(autorun)) {
                            signal.subscribers.delete(autorun);;
                            continue;
                        }
                        if (autorun.spec.beforeSchedule?.(mutation) === false) continue;
                        if (!this.map.has(autorun.runtime)) { this.map.set(autorun.runtime, new Set); }
                        this.map.get(autorun.runtime).add(autorun);
                    }
                }
            };
            for (const mutation of mutations) {
                const signal = this.signals.get(mutation.key);
                if (!signal) continue;
                groupings.add(signal.subscribers, mutation, signal);
                signal.refresh(mutation.value);
            }
            // Dispatch to runtimes...
            const runtimesMap = !groupings.map.size ? groupings.map : [...groupings.map].sort((a, b) => (a[0].$serial > b[0].$serial ? 1 : -1));
            //const runtimesMap = groupings.map;
            for (const [runtime, autoruns] of runtimesMap) {
                if (runtime.state === 'aborted') continue;
                runtime.schedule(...autoruns);
            }
        }, { recursions: 'force-sync' });
    }

    refresh(newState) {
        this.state = newState;
        for (const [name, signal] of this.signals) {
            signal.refresh(Observer.get(this.state ?? {}, name));
        }
        this.watchMode();
    }

}