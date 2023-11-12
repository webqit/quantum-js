
/**
 * @import
 */
import Observer from '@webqit/observer';
import { _await, _call } from '../util.js';
import EventTarget from './EventTarget.js';
import Scope from './Scope.js';

export default class Autorun extends EventTarget {

    state;

    constructor( context, type, spec, serial, scope, closure ) {
        super();
        // We are to be managed by context
        context?.once( this );
        this.context = context;
        this.type = type;
        this.spec = spec;
        this.scope = scope;
        if ( context?.scope !== scope ) {
            // It's own scope, so we manage it
            this.manage( scope );
        }
        this.serial = serial;
        if ( closure ) { this.closure = closure; }
        if ( context?.type === 'iteration' ) { this.path = context.path.concat( this.spec.index ); }
        else if ( context?.type === 'round' ) { this.path = context.path.concat( this.serial ); }
        else { this.path = ( context?.path || [] ).slice( 0, -1 ).concat( this.serial ); }
        this.flowControl = new Map;
    }

    get runtime() { return this.context.runtime; }

    contains( node ) { return this === node.context || ( node.context && this.contains( node.context ) ); }

    order( node ) {
        if ( !node ) return this;
        const [ a, b ] = node.path.length < this.path.length ? [ node, this ] : [ this, node ];
        return a.path.reduce( ( prev, key, i ) => {
            return prev && key <= b.path[ i ];
        }, true ) && a || b;
    }

    beforeExecute() {
        this.state = 'running';
        // Get record and reset
        const flowControlBefore = this.flowControl;
        this.flowControl = new Map;
        return flowControlBefore;
    }

    execute( callback = null ) {
        try {
            this.runtime.thread.unshift( this );
            return _await( this.beforeExecute(), stateBefore => {
                return _call( this.closure, this, this, returnValue => {
                    if ( this.spec.complete ) { returnValue = this.spec.complete( returnValue, this ); }
                    this.afterExecute( stateBefore );
                    this.runtime.thread.shift();
                    return callback ? callback( returnValue, this ) : returnValue;
                } );
            } );
        } catch( e ) {
            // Show a nice error
            if ( e.cause ) throw e;
            const message = `${ e.message || e }`;
            this.runtime.throw( message, [ this.serial, this.context?.serial ], globalThis[ e.name ] );
        }
    }

    afterExecute( flowControlBefore ) {
        this.state = 'complete';
        // Compare records... and hoist differences
        const flowControlAfter = this.flowControl;
        // Handle downstream
        this.handleDownstream( flowControlAfter.size, flowControlBefore.size );
        this.handleRightstream( flowControlAfter.size, flowControlBefore.size );
        for ( const cmd of [ 'break', 'continue', 'return' ] ) {
            if ( flowControlAfter.has( cmd ) && !flowControlAfter.get( cmd ).endpoint ) { this.hoistFlowControl( cmd, flowControlAfter.get( cmd ).arg ); }
            else if ( flowControlBefore.has( cmd ) && !flowControlBefore.get( cmd ).endpoint ) { this.hoistFlowControl( cmd, flowControlBefore.get( cmd ).arg, true ); }
        }
    }

    typed( as, value, name = undefined ) {
        const valueType = Array.isArray( value ) ? 'array' : ( value === null ? 'null' : typeof value );
        if ( valueType === as || ( as === 'iterable' && value?.[ Symbol.iterator ] ) || ( as === 'desctructurable' && ![ 'undefined', 'null' ].includes( valueType ) ) ) return value;
        if ( as === 'iterable' ) { throw new Error( `value is not iterable.` ); }
        if ( as === 'desctructurable' ) { throw new Error( ( name ? `Cannot access ${ name }; ` : '' ) + `object not desctructurable.` ); }
        throw new Error( `value must be of type ${ as }.` );
    }

    let( name, serial, closure, spec = {} ) { return this.var( name, serial, closure, { ...spec, kind: 'let' } ); }

    const( name, serial, closure, spec = {} ) { return this.var( name, serial, closure, { ...spec, kind: 'const' } ); }

    var( name, serial, closure, spec = {} ) {
        spec = { kind: 'var'/* as default */, ...spec };
        // Uninitialized declarations like: let a;
        if ( !closure ) closure = () => undefined;
        const $closure = !spec.restOf ? closure : ( ...args ) => {
            try { return closure( ...args ); }
            catch( e ) { throw new Error( `Cannot declare ${ name }; ${ e.message }` ); }
        };
        const complete = ( returnValue, autorun ) => {
            let scope = spec.kind === 'var' ? this.runtime.scope : autorun.scope;
            // For scripts, hoist all the way to the global scope... or somewhere before where its been defined
            while ( spec.kind === 'var' && ![ 'module', 'function' ].includes( scope.type ) && !Observer.has( scope.state, name ) && scope.context ) {
                scope = scope.context;
            }
            let symbolState = scope.symbols.get( name );
            if ( symbolState && ( symbolState.kind !== spec.kind || ( spec.kind === 'let' && symbolState.serial !== serial ) ) ) {
                throw new Error( `Identifier "${ name }" has already been declared.` );
            }
            symbolState?.reader?.abort(); // Any previous reader? Type "var" cannot rely on autorun lifecycle cleanup
            symbolState = { serial, kind: spec.kind }; // New state!
            let assignedValue = returnValue;
            if ( spec.restOf ) {
                if ( spec.type === 'array' ) {
                    assignedValue = [];
                } else { assignedValue = {}; }
                symbolState.reader = Observer.read( returnValue, assignedValue, { except: spec.restOf, spread: spec.type === 'array' } );
                autorun.once( symbolState.reader ); // Lifecycle cleanup
            }
            scope.symbols.set( name, symbolState );
            Observer.set( scope.state, name, assignedValue );
            return assignedValue;
        };
        return this.autorun( spec.kind, { complete, ...spec }, serial, $closure );
    }

    update( name, closure, spec = {} ) {
        // Find lexical scope
        let lexicalScope = this.scope;
        while( lexicalScope && !Observer.has( lexicalScope.state, name ) ) { lexicalScope = lexicalScope.context; }
        // Validation
        if ( !lexicalScope ) { throw new ReferenceError( `${ name } is not defined.` ); }
        let symbolState = lexicalScope.symbols.get( name );
        if ( symbolState?.kind === 'const' ) { throw new ReferenceError( `Assignment to constant variable "${ name }".` ); }
        const valueBefore = Observer.get( lexicalScope.state, name );
        const $closure = !spec.restOf ? closure : ( ...args ) => {
            try { return closure( ...args ); }
            catch( e ) { throw new Error( `Cannot update ${ name }; ${ e.message }` ); }
        };
        return _call( $closure, undefined, valueBefore, returnValue => {
            // Operation
            symbolState?.reader?.abort(); // Any previous reader?
            let assignedValue = returnValue;
            if ( spec.restOf ) {
                symbolState = symbolState || {}; // New state!
                if ( spec.type === 'array' ) {
                    assignedValue = [];
                } else { assignedValue = {}; }
                symbolState.reader = Observer.read( returnValue, assignedValue, { except: spec.restOf, spread: spec.type === 'array' } );
                this.once( symbolState.reader ); // Lifecycle cleanup
            }
            // Set now!
            Observer.set( lexicalScope.state, name, assignedValue );
            return [ 'postinc', 'postdec' ].includes( spec.kind ) ? valueBefore : assignedValue;
        } );
    }

    ref( name, ...rest ) {
        let depth = 0, hint = {};
        if ( typeof rest[ 0 ] === 'number' ) {
            depth = rest.shift();
            hint = rest.shift() || {};
        } else if ( typeof rest[ 0 ] === 'object' ) {
            hint = rest.shift();
        }
        // Find lexical scope
        let lexicalScope = this.scope;
        while( lexicalScope && !Observer.has( lexicalScope.state, name ) ) { lexicalScope = lexicalScope.context; }
        // Not found?
        if ( !lexicalScope ) {
            if ( hint.isTypeCheck ) return;
            throw new Error( `${ name } is not defined.` );
        }
        // Bind now?
        const kind = lexicalScope.symbols.get( name )?.kind;
        const baseSignal = lexicalScope.signal( name, kind );
        if ( hint.typed ) { this.typed( hint.typed, baseSignal.state, name ); }
        return this.autobind( baseSignal, depth, hint );
    }

    obj( val, ...rest ) {
        let depth = 0, hint = {};
        if ( typeof rest[ 0 ] === 'number' ) {
            depth = rest.shift();
            hint = rest.shift() || {};
        } else if ( typeof rest[ 0 ] === 'object' ) {
            hint = rest.shift();
        }
        return this.autobind( this.runtime.$objects.signal( val, 'object' ), depth, hint );
    }

    autobind( baseSignal, depth, hint ) {
        const isStatefulFunction = this.runtime.$params.isStatefulFunction;
        const isConst = baseSignal.type  === 'const';
        const isRuntime = this === this.runtime;
        const isAborted = this.state === 'aborted';
        const nowRunning = this;
        return ( function proxy( signal, depth ) {
            // Do bindings first
            if ( isStatefulFunction && !isConst && !isRuntime && !isAborted ) {
                signal.subscribe( nowRunning );
            }
            // Return bare value here?
            if ( !depth || !signal.state || typeof signal.state !== 'object' ) {
                let returnValue = signal.state;
                if ( typeof signal.state === 'function' ) {
                    // We're returning a proxy for functions instead of: signal.context.state[ signal.name ].bind( signal.context.state );
                    returnValue = Observer.proxy( signal.state, { membrane: signal } );
                }
                return returnValue;
            }
            // Return dynamic value
            let propertyAlreadyBound;
            return Observer.proxy( signal.state, {}, traps => ( {
                ...traps,
                get( target, name, receiver = null ) {
                    // Constructs are always going to for one property access: ref('a').b, and we need to prevent .c from creating a binding
                    if ( propertyAlreadyBound ) { return traps.get( target, name, receiver ); }
                    propertyAlreadyBound = true;
                    return proxy( signal.signal( name ), depth - 1 );
                },
            } ) );
        } )( baseSignal, depth );
    }

    autorun( type, ...rest ) {
        let closure = rest.pop();
        const serial = rest.pop();
        const spec = rest.pop() || {};
        // Handle certain types with their own class
        let AutorunClass = Autorun, scope = this.scope;
        if ( type === 'iteration' ) {
            const staticDefs = this.runtime.constructor;
            AutorunClass = closure.constructor.name === 'AsyncFunction' ? staticDefs.AutoAsyncIterator : staticDefs.AutoIterator;
        }
        if ( [ 'block', 'iteration' ].includes( type ) ) { scope = new Scope( scope, type ); }
        // Instantiate
        const autorun = new AutorunClass( this, type, spec, serial, scope, closure );
        if ( type === 'downstream' ) {
            // Declare a "downstream" for the context
            this.downstream = autorun;
            // For now
            if ( this.flowControlApplied() ) return;
        }
        // Push stack and execute
        return autorun.execute();
    }

    function( isDeclaration, isStatefulFunction, serial, $function ) {
        // Declare in current scope
        if ( isDeclaration ) { Observer.set( this.scope.state, $function.name, $function ); }
        // Metarise function
        const _this = this;
        Object.defineProperty( $function, 'toString', { value: function( $fSource = false ) {
            if ( $fSource && isStatefulFunction ) return Function.prototype.toString.call( $function );
            const originalSource = _this.runtime.extractSource( serial );
            return originalSource.startsWith( 'static ' ) ? originalSource.replace( 'static ', '' ) : originalSource;
        } } );
        return $function;
    }

    class( isDeclaration, $class, methodsSpec ) {
        // Declare in current scope
        if ( isDeclaration ) { Observer.set( this.scope.state, $class.name, $class ); }
        // Metarise methods
        methodsSpec.forEach( ( { name, static: isStatic, isStatefulFunction, serial } ) => {
            this.function( false, isStatefulFunction, serial, isStatic ? $class[ name ] : $class.prototype[ name ] )
        } );
        return $class;
    }

    async import( ...args ) { return this.runtime.import( ...args ); }

    async export( ...args ) { return this.runtime.export( ...args ); }

    continue( label ) { return this.applyFlowControl( 'continue', label ); }

    break( label ) { return this.applyFlowControl( 'break', label ); }

    return( arg ) { return this.applyFlowControl( 'return', arg ); }

    applyFlowControl( cmd, arg, unset = false ) {
        const sizeBefore = this.flowControl.size;
        if ( unset ) { this.flowControl.delete( cmd ); }
        else { this.flowControl.set( cmd, { arg } ); }
        if ( this.type === 'round' ) { this.context.breakpoint = this; }
        if ( this.type === 'round' && [ 'break', 'continue' ].includes( cmd ) && arg === this.context?.spec.label ) {
            if ( !unset ) { this.flowControl.get( cmd ).endpoint = true; }
            if ( this.state !== 'running' ) { this.handleRightstream( this.flowControl.size, sizeBefore ); }
            return;
        }
        // Notice that no hoisting and no "downstream" handling if in active scope
        // as that would be done at after() hook!
        if ( this.state !== 'running' ) {
            this.handleDownstream( this.flowControl.size, sizeBefore );
            this.hoistFlowControl( ...arguments );
        }
    }

    hoistFlowControl( ...args ) { return this.context?.applyFlowControl( ...args ); }

    flowControlApplied( cmd, arg ) {
        if ( !arguments.length ) return this.flowControl.size || false;
        if ( arguments.length === 1 ) return this.flowControl.has( cmd );
        return this.flowControl.get( cmd )?.arg === arg;
    }

    handleDownstream( sizeAfter, sizeBefore ) {
        let downstream;
        if ( this.type !== 'block' // If this is "downstream", the "downstream" you see from parent scope will be self
        || !( downstream = this.context?.downstream ) ) return;
        if ( sizeAfter ) { downstream.abort(); }
        else if ( sizeBefore ) {
            downstream.state = 'resuming'; // Just something other than "aborted"
            this.runtime.schedule( downstream );
        }
    }

    handleRightstream( sizeAfter, sizeBefore ) {
        if ( this.type !== 'round' ) return;
        let nextRound = this, returnees = new Set;
        while( nextRound = nextRound.nextRound ) {
            if ( sizeAfter ) { nextRound.abort(); }
            else if ( sizeBefore && nextRound.state !== 'inert' ) {
                nextRound.state = 'resuming'; // Just something other than "aborted"
                returnees.add( nextRound );
            }
        }
        if ( returnees.size ) { this.runtime.schedule( ...returnees ); }
        if ( !sizeAfter && sizeBefore ) {
            this.runtime.on( 'reflection', () => {
                if ( this.context.iterating ) return;
                this.context.iterate();
            }, { once: true } );
        }
    }

    abort( total = false ) {
        if ( total ) {
            if ( this.context?.breakpoint === this ) { delete this.context.breakpoint; }
            this.flowControl.clear();
        }
        this.state = total ? 'inert' : 'aborted';
        return super.abort( total );
    }
    
}