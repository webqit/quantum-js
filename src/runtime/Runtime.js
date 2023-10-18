
/**
 * @import
 */
import Observer from '@webqit/observer';
import { _call, _await } from '../util.js';
import AutoIteration from './AutoIteration.js';
import { registry } from './hot-modules-registry.js';
import Autorun from './Autorun.js';
import Scope from './Scope.js';
import State from './State.js';

export default class Runtime extends Autorun {

    locations = [];
    queue = new Set;
    thread = [];

    constructor( context, type, params, scope, closure ) {
        super( context, type, {}/* spec */, -1, scope, closure );
        const { $serial = 0, ...$params } = params;
        this.$serial = $serial;
        this.$params = $params;
        // Random object
        this.$objects = new Scope( undefined, 'objects' );
        this.manage( this.$objects );
        // Imports/exports
        this.exports = Object.create( null );
        this.$promises = { imports: [], exports: [] };
        this.manage( () => {
            Observer.deleteProperties( this.exports, Object.keys( this.exports ) );
            this.$promises.imports.splice( 0 );
            this.$promises.exports.splice( 0 );
        } );
    }

    extractSource( serial, full = false ) {
        const [ [ locStart, line, column ], [ locEnd ] ] = this.locations[ serial ];
        const expr = this.$params.originalSource.slice( locStart, locEnd );
        return full ? { expr, line, column } : expr;
    }

    throw( message, serials, ErrorClass = null, errorCode = null ) {
        let error, $message = errorCode !== null ? `[${ errorCode }]: ${ message }` : message;
        const cause = serials.map( serial => serial !== -1 && this.extractSource( serial, true ) ).filter( x => x );
        cause.push( { source: this.$params.originalSource } );
        error = new ( ErrorClass || Error )( $message, { cause } );
        const fileName = this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.packageName || this.$params.fileName;
        if ( fileName ) { error.fileName = fileName; }
        if ( errorCode ) { error.code = errorCode; }
        throw error;
    }

    push( autorun, callback = null ) {
            // Push stack and execute
            this.thread.unshift( autorun );
            return autorun.execute( returnValue => {
                this.thread.shift();
                callback?.( returnValue );
                return returnValue;
            } );
        try {
        } catch( e ) {
            // Show a nice error
            if ( e.cause && e.trace ) throw e;
            const message = `${ e.message || e }`;
            this.throw( message, [ autorun.serial, autorun.context?.serial ], globalThis[ e.name ] );
        }
    }

    get runtime() { return this; }

    get nowRunning() { return this.thread[ 0 ]; }

    schedule( ...autoruns ) {
        // Determine if active beforehand
        const isActive = this.queue.size;
        for ( const autorun of autoruns ) { this.queue.add( autorun ); }
        if ( isActive ) return;
        // Event Loop
        this.flowControlDirty = false;
        return ( function nextTick( prevReturn, current ) {
            // Find following...
            let following;
            for ( const autorun of this.queue ) {
                // If autorun is higher in source ignore
                // Or a parent autorun has already been run in this event loop which started by aborting all descendants
                if ( current && current.order( autorun ) !== current || autorun.state === 'aborted' ) { this.queue.delete( autorun ); continue; }
                // Get $autorun to be very next to _this.currentMicro
                following = following ? following.order( autorun ) : autorun;
                if ( !current ) { current = following; }
            }
            // Fire events
            if ( !following ) { return ( this.fire( this.flowControlApplied()/* vs .dirty */ ? 'statechange' : 'reflection' ), prevReturn ); }
            // Execute following...
            following.abort();
            // Evaluate and possibly await...
            return this.push( following, returnValue => {
                // Remove from queue
                this.queue.delete( following );
                // Next tick
                return nextTick.call( this, returnValue, following );
            } );
        } ).call( this, undefined, this.nowRunning );
    }

    let( name, serial, closure ) { return this.var( name, serial, closure, 'let' ); }

    var( name, serial, closure, kind = 'var' ) {
        // Uninitialized declarations like: let a;
        if ( !closure ) closure = () => undefined;
        const complete = ( returnValue, autorun ) => {
            let scope = kind === 'var' ? this.scope : autorun.scope;
            // For scripts, hoist all the way to the global scope... or somewhere before where its been defined
            while ( kind === 'var' && ![ 'module', 'function' ].includes( scope.type ) && !Observer.has( scope.state, name ) && scope.context ) {
                scope = scope.context;
            }
            const symbolState = scope.symbols.get( name );
            if ( symbolState && ( symbolState.kind !== kind || ( kind === 'let' && symbolState.serial !== serial ) ) ) {
                throw new Error( `Identifier "${ name }" has already been declared.` );
            }
            scope.symbols.set( name, { serial, kind } );
            Observer.set( scope.state, name, returnValue );
            return returnValue;
        };
        return this.autorun( kind, { complete }, serial, closure );
    }

    update( name, closure, prefix = true ) {
        // Find lexical scope
        let lexicalScope = this.nowRunning?.scope || this.scope/* for updates at the root level; i.e. in static functions */;
        while( lexicalScope && !Observer.has( lexicalScope.state, name ) ) { lexicalScope = lexicalScope.context; }
        // Not found?
        if ( !lexicalScope ) { throw new ReferenceError( `${ name } is not defined.` ); }
        const valueBefore = Observer.get( lexicalScope.state, name );
        return _call( closure, undefined, valueBefore, returnValue => {
             // Set now!
            Observer.set( lexicalScope.state, name, returnValue );
            return prefix ? returnValue : valueBefore;
        } );
    }

    ref( name, depth = 0 ) {
        const nowRunning = this.nowRunning;
        // Find lexical scope
        let lexicalScope = nowRunning?.scope || this.scope/* for ref()s at the root level; i.e. in static functions */;
        while( lexicalScope && !Observer.has( lexicalScope.state, name ) ) { lexicalScope = lexicalScope.context; }
        // Not found?
        if ( !lexicalScope ) { throw new ReferenceError( `${ name } is not defined.` ); }
        // Bind now?
        return this.autobind( nowRunning, lexicalScope.signal( name ), depth );
    }

    obj( val, depth ) { return this.autobind( this.nowRunning, this.$objects.signal( val ), depth ); }

    autobind( nowRunning, baseSignal, depth ) {
        // The below is such as when an iteraton item is deleted and thus aborted but has to run its last
        if ( nowRunning.state === 'aborted' ) return baseSignal.state;
        return ( function proxy( signal, depth ) {
            // Do bindings first
            if ( nowRunning ) {
                // nowRunning won't be available for ref()s at the root level; i.e. in static functions
                signal.subscribe( nowRunning );
            }
            // Return bare value here?
            if ( !depth || !signal.state || typeof signal.state !== 'object' ) {
                return typeof signal.state === 'function'
                    // We're returning a proxy for functions instead of: signal.context.state[ signal.name ].bind( signal.context.state );
                    ? Observer.proxy( signal.state, { membrane: signal } )
                    : signal.state;
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
        const context = this.nowRunning || this;
        // Handle certain types with their own class
        let AutorunClass = Autorun;
        if ( type === 'iteration' ) {
            AutorunClass = AutoIteration;
        }
        // See if a subscope is needed
        let scope = context.scope;
        if ( [ 'block', 'round' ].includes( type ) ) { scope = new Scope( context.scope, type ); }
        // Instantiate
        const autorun = new AutorunClass( context, type, spec, serial, scope, closure );
        // Create certain relationships
        if ( type === 'round' ) {
            // "for", "while", "do-while" rounds
            context.add( spec.index, autorun );
            if ( context.terminated() ) return;
        }
        if ( type === 'rest' ) {
            // Declare a "rest" block for the context
            context.restBlock = autorun;
            // For now
            if ( context.flowControlApplied() ) return;
        }
        // Push stack and execute
        return this.push( autorun );
    }

    run( isStatefulFunction, closure ) {
        const params = { $serial: this.$serial + 1, ...this.$params };
        const context = this.nowRunning || this;
        const scope = new Scope( context.scope, 'function' );
        const subRuntime = new Runtime( context, 'function', params, scope, closure );
        return subRuntime.execute( returnValue => {
            if ( !isStatefulFunction ) return returnValue;
            return new State( subRuntime );
        } );
    }

    function( isDeclaration, isStatefulFunction, serial, $function ) {
        // Declare in current scope
        if ( isDeclaration ) {
            const scope = this.nowRunning?.scope || this.scope;
            Observer.set( scope.state, $function.name, $function );
        }
        // Metarise function
        const _this = this;
        Object.defineProperty( $function, 'toString', { value: function( $fSource = false ) {
            if ( $fSource && isStatefulFunction ) return Function.prototype.toString.call( $function );
            const originalSource = _this.extractSource( serial );
            return originalSource.startsWith( 'static ' ) ? originalSource.replace( 'static ', '' ) : originalSource;
        } } );
        return $function;
    }

    class( isDeclaration, $class, methodsSpec ) {
        // Declare in current scope
        if ( isDeclaration ) {
            const scope = this.nowRunning?.scope || this.scope;
            Observer.set( scope.state, $class.name, $class );
        }
        // Metarise methods
        methodsSpec.forEach( ( { name, static: isStatic, isStatefulFunction, serial } ) => {
            this.function( false, isStatefulFunction, serial, isStatic ? $class[ name ] : $class.prototype[ name ] )
        } );
        return $class;
    }

    async import( ...args ) {
        const source = args.pop();
        const $source = typeof source === 'string' ? { source } : source;
        const onload = modules => {
            // Return for exporting?
            if ( $source.forExport ) return modules;
            // Assign imported modules to top-level scope
            this.assignModules( args, this.scope.state, modules, source.serial );
        };
        if ( $source.source.startsWith( '#' ) && this.$params.experimentalFeatures !== false && registry[ $source.source.slice( 1 ) ] ) {
            return onload( registry[ $source.source.slice( 1 ) ] );
        }
        const promise = ( async () => {
            const moduleName = this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.packageName || this.$params.fileName;
            try { return onload( await import( $source.source ) ); } catch( e ) {
                if ( e.code === 'ERR_MODULE_NOT_FOUND' ) { this.throw( `Cannot find package "${ $source.source }"${ moduleName ? ` imported at "${ moduleName }"` : '' }.`, [ $source.serial ], null, e.code ); }
                throw e;
            }
        } )();
        this.$promises[ $source.forExport ? 'exports' : 'imports' ].push( promise );
        return promise;
    }

    async export( ...args ) {
        const source = !Array.isArray( args[ args.length - 1 ] ) ? args.pop() : null;
        // Export declaration???
        if ( !source && args[ 0 ].length === 2 && typeof args[ 0 ][ 1 ] !== 'number' ) {
            for ( const [ value, alias ] of args ) { Observer.set( this.exports, alias, value ); }
            return;
        }
        // Export from source or from top-level scope!
        const modules = source ? await this.import( { ...source, forExport: true } ) : this.scope.state;
        // Assign imported modules to exports object
        this.assignModules( args, this.exports, modules, source?.serial );
    }

    assignModules( specifiers, target, source, sourceSerial = null ) {
        const observeList = [];
        for ( const [ local, serial, alias ] of specifiers ) {
            if ( local === '*' && alias ) {
                Observer.set( target, alias, source );
                continue;
            }
            if ( !Observer.has( source, local ) ) { this.throw( `The requested module does not provide an export named "${ local }".`, [ serial, sourceSerial ] ); }
            Observer.set( target, alias || local, Observer.get( source, local ) );
            observeList.push( [ local, serial, alias ] );
        }
        if ( !observeList.length ) return;
        this.once( Observer.observe( source, mutations => {
            for ( const [ local, /* serial */, alias ] of observeList ) {
                for ( const mutation of mutations ) {
                    if ( local === '*' ) { Observer.set( target, mutation.key, mutation.value ); }
                    else if ( mutation.key === local ) { Observer.set( target, alias || local, mutation.value ); }                    
                }
            }
        } ) );
    }

    after( ...args ) {
        if ( this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.packageName ) {
            if ( this.$params.packageName.startsWith( '#' ) ) throw new Error( `Experimental hot package names cannot start with a "#".` );
            registry[ this.$params.packageName ] = this.exports;
            this.once( () => { delete registry[ this.$params.packageName ]; } );
        }
        return super.after( ...args );
    }

}