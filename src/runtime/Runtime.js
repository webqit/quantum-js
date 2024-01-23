
/**
 * @import
 */
import Observer from '@webqit/observer';
import { _await } from '../util.js';
import { registry } from './hot-module-registry.js';
import AutoAsyncIterator from './AutoAsyncIterator.js';
import AutoIterator from './AutoIterator.js';
import Autorun from './Autorun.js';
import Scope from './Scope.js';
import State from './State.js';

export default class Runtime extends Autorun {

    static AutoAsyncIterator = AutoAsyncIterator;
    static AutoIterator = AutoIterator;

    locations = [];
    queue = new Set;
    thread = [];
    iThread = [];

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
        const fileName = this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.exportNamespace || this.$params.fileName;
        if ( fileName ) { error.fileName = fileName; }
        if ( errorCode ) { error.code = errorCode; }
        if ( this.$params.inBrowser ) console.error( cause );
        throw error;
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
                // Or the unique situation with "for" loops where "test" and "update" expressions tend to self-schedule the AutoIteration instance.
                if ( current && current.order( autorun ) !== current || [ 'aborted', 'running' ].includes( autorun.state ) || this.iThread[ 0 ]?.contains( autorun ) ) {
                    this.queue.delete( autorun ); continue;
                }
                // Get $autorun to be very next to _this.currentMicro
                following = following ? following.order( autorun ) : autorun;
                if ( !current ) { current = following; }
            }
            // Fire events
            if ( !following ) {
                this.fire( 'reflection' );
                if ( this.flowControlApplied() ) { this.fire( 'statechange' ); }
                return prevReturn;
            }
            // Execute following...
            following.abort();
            // Evaluate and possibly await...
            return following.execute( returnValue => {
                // Remove from queue
                this.queue.delete( following );
                // Next tick
                return nextTick.call( this, returnValue, following );
            } );
        } ).call( this, undefined, this.nowRunning );
    }

    execute( callback = null ) {
        return super.execute( returnValue => {
            const actualReturnValue = this.$params.quantumMode
                ? new State( this )
                : returnValue;
            return callback ? callback( actualReturnValue, this ) : actualReturnValue;
        } );
    }

    spawn( isQuantumFunction, thisContext, closure ) {
        const context = this.nowRunning || this;
        const params = {  ...this.$params, $serial: this.$serial + 1, quantumMode: isQuantumFunction };
        const scope = new Scope( context.scope, 'function', { [ 'this' ]: thisContext } );
        const subRuntime = new this.constructor( context, 'function', params, scope, closure );
        return subRuntime.execute();
    }

    async import( ...args ) {
        const source = args.pop();
        const $source = typeof source === 'string' ? { source } : source;
        const onload = modules => {
            if ( $source.forExport || $source.isDynamic ) return modules;
            this.assignModules( args, this.scope.state, modules, source.serial );
        };
        if ( this.$params.experimentalFeatures !== false && registry[ $source.source ] ) {
            return onload( registry[ $source.source ] );
        }
        const promise = ( async () => {
            const moduleName = this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.exportNamespace || this.$params.fileName;
            try { return onload( await import( $source.source ) ); } catch( e ) {
                if ( e.code === 'ERR_MODULE_NOT_FOUND' ) { this.throw( `Cannot find package "${ $source.source }"${ moduleName ? ` imported at "${ moduleName }"` : '' }.`, [ $source.serial ], null, e.code ); }
                throw e;
            }
        } )();
        if ( !$source.isDynamic ) {
            this.$promises[ $source.forExport ? 'exports' : 'imports' ].push( promise );
        }
        return promise;
    }

    async export( ...args ) {
        const source = !Array.isArray( args[ args.length - 1 ] ) ? args.pop() : null;
        // Export from source or from top-level scope!
        const modules = source ? await this.import( { ...source, forExport: true } ) : this.scope.state;
        // Assign imported modules to exports object
        this.assignModules( args, this.exports, modules, source?.serial );
    }

    assignModules( specifiers, target, source, sourceSerial = null ) {
        const observeList = [];
        for ( const [ local, serial, alias ] of specifiers ) {
            if ( local === '*' && alias ) {
                ( this.$params.quantumMode ? Observer : Reflect ).set( target, alias, source );
                continue;
            }
            if ( !Observer.has( source, local ) ) { this.throw( `The requested module does not provide an export named "${ local }".`, [ serial, sourceSerial ] ); }
            ( this.$params.quantumMode ? Observer : Reflect ).set( target, alias || local, Observer.get( source, local ) );
            observeList.push( [ local, serial, alias ] );
        }
        if ( !observeList.length || !this.$params.quantumMode ) return;
        this.once( Observer.observe( source, mutations => {
            for ( const [ local, /* serial */, alias ] of observeList ) {
                for ( const mutation of mutations ) {
                    if ( local === '*' ) { Observer.set( target, mutation.key, mutation.value ); }
                    else if ( mutation.key === local ) { Observer.set( target, alias || local, mutation.value ); }                    
                }
            }
        } ) );
    }
    
    afterExecute( ...args ) {
        if ( this.$params.sourceType === 'module' && this.$params.experimentalFeatures !== false && this.$params.exportNamespace ) {
            registry[ this.$params.exportNamespace ] = this.exports;
            this.once( () => { delete registry[ this.$params.exportNamespace ]; } );
        }
        return super.afterExecute( ...args );
    }

}