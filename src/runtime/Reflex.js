
/**
 * @imports
 */
import { _await } from '../util.js';
import inspection from './inspect.js';

export default class Reflex {

    constructor( ownerReflex, graph, callee, params = {}, $thread = null, exits = null ) {
        this.ownerReflex = ownerReflex;
        this.graph = graph;
        this.callee = callee;
        this.params = !ownerReflex ? { ...params, isReflexFunction: true } : params;
        this.exits = exits || new Map;
        this.$thread = $thread || { entries: new Map, sequence: [], ownerReflex: this };
        this.subReflexes = new Map;
        this.observers = [];
        this.reflex = function( reflexId, arg1, arg2 = null, arg3 = null ) {
            if ( !this.graph.subReflexes[ reflexId ] ) {
                throw new Error( `[${ this.graph.type }:${ this.graph.lineage }]: Graph not found for child reflex ${ reflexId }.` );
            }

            let subGraph = this.graph.subReflexes[ reflexId ];
            let subParams = {
                ...this.params,
                isIterationReflex: arguments.length === 3,
                iterationId: arguments.length === 3 && arg1,
                isFunctionReflex: arguments.length === 4,
                functionType: arguments.length === 4 && arg1,
                isReflexFunction: arguments.length === 4 && arg2,
                functionScope: ( this.params.isFunctionReflex && this.graph.lineage ) || this.params.functionScope,
            };

            if ( subParams.isIterationReflex ) {
                // This is an iteration reflex
                let callee = arg2;
                // Create iteration
                let iterationInstanceReflex = new Reflex( this, subGraph, callee, subParams, this.$thread, this.exits );
                // Add iteration
                let iterations = this.subReflexes.get( reflexId );
                if ( !iterations ) {
                    iterations = new Map;
                    this.subReflexes.set( reflexId, iterations );
                }
                // Dispose all existing
                if ( iterations.has( subParams.iterationId ) ) {
                    iterations.get( subParams.iterationId ).dispose();
                }
                iterations.set( subParams.iterationId, iterationInstanceReflex );
                return iterationInstanceReflex.call();
            }

            let callee, subReflex, returnValue;
            // Dispose existing
            if ( this.subReflexes.has( reflexId ) ) {
                this.subReflexes.get( reflexId ).dispose();
            }

            if ( subParams.isFunctionReflex ) {
                // Function reflexes
                callee = arg3;
                const createCallback = () => new Reflex( this, subGraph, callee, subParams );
                if ( subParams.functionType !== 'FunctionDeclaration' ) {
                    returnValue = this.createFunction( createCallback );
                } else {
                    let subReflex = createCallback();
                    if ( subParams.apiVersion > 1 ) {
                        returnValue = function( ...args ) {
                            let _returnValue = subReflex.call( this, ...args );
                            _returnValue = _await( _returnValue, __returnValue => [ _returnValue, subReflex.thread.bind( subReflex ), subReflex ] );
                            subReflex = createCallback();
                            return _returnValue;
                        }
                        returnValue.target = subReflex;
                    } else {
                        returnValue = subReflex;
                    }
                }
            } else {
                // Regular reflexes
                callee = arg1, subReflex = new Reflex( this, subGraph, callee, subParams, this.$thread, this.exits );
                this.subReflexes.set( reflexId, subReflex );
                returnValue = subReflex.call();
            }

            return returnValue;
        }.bind( this );
        // ---------------------------
        this.reflex.memo = Object.create( null );
        if ( this.ownerReflex && ![ 'FunctionDeclaration', 'FunctionExpression' ].includes( this.graph.type ) ) {
            this.reflex.args = this.ownerReflex.reflex.args;
        }
        // ---------------------------
        this.reflex.exiting = function( keyword, arg ) {
            if ( !arguments.length ) return this.exits.size;
            let exitMatch = this.exits.get( keyword ) === arg;
            if ( exitMatch ) this.exits.clear();
            return exitMatch;
        }.bind( this );
        // ---------------------------
        this.reflex.exit = function( keyword, arg ) {
            this.exits.set( keyword, arg );
        }.bind( this );
        // ---------------------------
        this.reflex.functions = new Map;
        this.reflex.functions.declaration = ( functionDeclaration, callTarget ) => {
            this.reflex.functions.set( functionDeclaration, callTarget );
            this.applyReflection( functionDeclaration, typeof callTarget === 'function' ? callTarget.target : callTarget );
        }
    }

    fire( reflexUrl, event, refs ) {
        if ( !this.ownerReflex ) return;
        const ret = this.ownerReflex.fire( reflexUrl, event, refs );
        this.observers.forEach( observer => {
            if ( observer.reflexUrl !== reflexUrl ) return;
            observer.callback( event, refs );
        } );
        return ret;
    }

    observe( reflexUrl, callback ) {
        if ( !this.params.isFunctionReflex ) return;
        this.observers.push( { reflexUrl, callback } );
    }

    call( $this, ...$arguments ) {
        if ( this.disposed ) {
            throw new Error( `[${ this.graph.type }:${ this.graph.lineage }]: Instance not runable after having been disposed.` );
        }
        if ( !this.ownerReflex ) {
            this.reflex.args = $arguments;
            Object.defineProperty( this.reflex.args, Symbol.toStringTag, { value: 'Arguments' } );
        }
        let returnValue = this.callee.call( $this, this.reflex, ...$arguments );
        if ( this.graph.$sideEffects ) {
            for ( let referenceId in this.graph.effects ) {
                for ( let effectRef of this.graph.effects[ referenceId ].refs ) {
                    // Build side effects
                    this.buildThread( [], effectRef, [], 0, true );
                }
            }
        }
        return _await( returnValue, () => {
            if ( !this.ownerReflex || this.params.isFunctionReflex ) {
                let exitReturnValue = this.exits.get( 'return' );
                this.exits.clear();
                if ( exitReturnValue !== undefined ) return exitReturnValue;
            }
            return returnValue;
        } );
    }

    iterate( keys = [] ) {
        if ( this.disposed ) return false;
        if ( ![ 'ForOfStatement', 'ForInStatement' ].includes( this.graph.type ) || this.subReflexes.size !== 1 ) {
            throw new Error( `Reflex ${ this.graph.lineage } is not an iterator.` );
        }
        let [ [ /* iterationReflexId */, iterationInstances ] ] = this.subReflexes;
        let prev
        if ( !keys.length || ( keys.includes( 'length' ) && this.graph.type === 'ForOfStatement' ) ) {
            for ( let [ /* iterationId */, iterationInstance ] of iterationInstances ) {
                prev = _await( prev, () => iterationInstance.call() );
            }
        } else {
            for ( let key of keys ) {
                let instance = iterationInstances.get( key ) || iterationInstances.get( parseInt( key ) );
                if ( !instance ) continue;
                prev = _await( prev, () => instance.call() );
            }
        }
        return prev;
    }

    thread( ...eventRefs ) {
        if ( this.disposed ) return false;
        this.$thread.active = true;
        for ( let referenceId in this.graph.effects ) {
            for ( let effectRef of this.graph.effects[ referenceId ].refs ) {
                for ( let eventRef of eventRefs ) {
                    eventRef = Array.isArray( eventRef ) ? eventRef : [ eventRef ];
                    let [ isMatch, remainder, computes ] = this.matchRefs( eventRef, effectRef );
                    if ( !isMatch ) continue;
                    this.buildThread( eventRef, effectRef, computes, remainder );
                }
            }
        }
        return this.runThread();
    }

    runThread() {
        let execute = ( entry, refs ) => {
            if ( [ 'ForOfStatement', 'ForInStatement' ].includes( entry.graph.type ) 
            && refs.every( ref => ref.executionPlan.isIterationReflexTarget ) ) {
                let targets = refs.map( ref => ref.executionPlan.iterationTarget );
                this.fire( entry.graph.lineage, 'iterating', refs );
                return entry.iterate( targets );
            }
            this.fire( entry.graph.lineage, 'executing', refs );
            return entry.call();
        };
        let prev, entry, refs;
        while ( 
            ( entry = this.$thread.sequence.shift() ) 
            && ( refs = [ ...this.$thread.entries.get( entry ) ] ) 
            && this.$thread.entries.delete( entry ) // Important: to allow re-entry on susequent threads
        ) {
            prev = _await( prev, () => {
                if ( entry.disposed || !entry.filterRefs( refs ).length ) return;
                this.$thread.current = entry;
                let maybePromise = execute( entry, refs );
                _await( maybePromise, () => {
                    for ( let ref of refs ) {
                        [].concat( ref.executionPlan.assigneeRef || ref.executionPlan.assigneeRefs || [] ).forEach( assigneeRef => {
                            entry.buildThread( [], assigneeRef, [], 0 );
                        } );
                    }
                } );
                return maybePromise;
            } );
        }
        return _await( prev, () => {
            let _ret = this.exits.get( 'return' );
            this.exits.clear();
            this.$thread.current = null;
            this.$thread.active = false;
            return _ret;
        } );
    }

    buildThread( eventRef, effectRef, computes, remainder = 0, isSideEffect = false ) {
        let shouldMatchEventRef = remainder > 0;
        if ( this.ownerReflex ) {
            // IMPORTANT: effectRef at global level are not supposed to be checked for computes and condition
            if ( !this.compute( computes ) ) return;
            if ( effectRef.condition !== undefined && !this.assert( effectRef.condition ) ) return;
        } else if ( !shouldMatchEventRef ) {
            shouldMatchEventRef = computes.length || effectRef.condition !== undefined;
        }
        let subscriptionsObject = isSideEffect ? effectRef.$subscriptions : effectRef.subscriptions;
        // First we assert the conditions for the effectRef before moving on
        Object.keys( subscriptionsObject ).forEach( fullReferenceUrl => {
            let [ reflexUrl, referenceId ] = fullReferenceUrl.split( ':' );
            let selectRefs = _subscriberInstance => {
                if ( !_subscriberInstance ) return;
                _subscriberInstance.selectRefs( referenceId, subscriptionsObject[ fullReferenceUrl ], shouldMatchEventRef ? eventRef : null );
            }
            // We find the subscriber instance
            let subscriberInstance = this.locate( reflexUrl );
            if ( Array.isArray( subscriberInstance ) ) {
                subscriberInstance.forEach( selectRefs );
            } else {
                selectRefs( subscriberInstance );
            }
        } );
    }

    selectRefs( referenceId, refIds, eventRef = null ) {
        // We'll select refs from within the following reference
        let $thread = this.$thread;
        let reference = this.graph.signals[ referenceId ];
        // -----------------------------------------
        let compare = ( a, b ) => a.graph.lineage.localeCompare( b.graph.lineage, undefined, { numeric: true } );
        let selectRef = ( ref, computes = [], executionPlan = {} ) => {
            // If this addition is by the side effect of a function, "this" can sometimes be higher in scope
            if ( !$thread.active ) return;
            if ( $thread.current && compare( this, $thread.current ) < 0 ) return;
            let refs = $thread.entries.get( this );
            if ( !refs ) {
                refs = new Set;
                $thread.entries.set( this, refs );
                $thread.sequence.push( this );
                $thread.sequence.sort( compare );
            }
            refs.add( { ...ref, computes, executionPlan } );
            if ( !executionPlan.assigneeRef && [ 'VariableDeclaration', 'AssignmentExpression' ].includes( this.graph.type ) ) {
                executionPlan.assigneeRefs = [];
                for ( let referenceId in this.graph.effects ) {
                    executionPlan.assigneeRefs.push( ...this.graph.effects[ referenceId ].refs )
                }
            }
        };
        // -----------------------------------------
        for ( let refId of refIds ) {
            // The ref within reference
            let ref = reference.refs[ refId ];
            // First we assert the conditions for the ref before moving on
            if ( !eventRef ) {
                // AffectedRef matched event ref... So we select ALL refs within reference
                selectRef( ref );
                continue;
            }
            // We match ref to decide whether or how to select it
            let [ isMatch_b, remainder_b, computes_b ] = this.matchRefs( eventRef, ref );
            if ( !isMatch_b ) continue;
            if ( remainder_b <= 0 ) {
                // SubscriberRef matches event ref
                selectRef( ref, computes_b );
                continue;
            }
            let eventRef_balance = eventRef.slice( -remainder_b );
            let assigneeReference = 'assignee' in reference ? this.graph.effects[ reference.assignee ] : null;
            if ( assigneeReference ) {
                assigneeReference.refs.forEach( assigneeRef => {
                    if ( assigneeRef.depth.length ) {
                        let [ isMatch_c, remainder_c, computes_c ] = this.matchRefs( eventRef_balance, assigneeRef.depth );
                        let computes_d = computes_b.concat( computes_c );
                        if ( isMatch_c && remainder_c > 0 ) {
                            // We move on passively to effects on the assignee
                            let newEventRef = assigneeRef.path.concat( eventRef_balance.slice( -remainder_c ) );
                            this.buildThread( newEventRef, assigneeRef, computes_d, remainder_c );
                        } else if ( isMatch_c ) {
                            // Match is successful on the destructuring side... so we select
                            selectRef( ref, computes_d, { assigneeRef } );
                        }
                    } else {
                        // We move on passively to effects on the assignee
                        let newEventRef = assigneeRef.path.concat( eventRef_balance );
                        this.buildThread( newEventRef, assigneeRef, computes_b, remainder_b );
                    }
                } );
                continue;
            }
            if ( remainder_b === 1 && this.graph.type === 'ForOfStatement' ) {
                // An iteration item was changed or the length property of the list was changed
                selectRef( ref, computes_b, { isIterationReflexTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
                continue;
            }
            if ( remainder_b === 1 && this.graph.type === 'ForInStatement' ) {
                // An iteration property was changed
                selectRef( ref, computes_b, { isIterationReflexTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
                continue;
            }
        }
    }

    filterRefs( refs ) {
        return refs.filter( ref => {
            if ( !this.compute( ref.computes ) ) return;
            if ( ref.condition !== undefined && !this.assert( ref.condition ) ) return;
            return true;
        } );
    }

    matchRefs( a, b ) {
        let pathA, $pathA, pathB, $pathB;
        if ( Array.isArray( a ) ) {
            pathA = a, $pathA = a.dotSafe ? a.join( '.' ) : undefined;
        } else {
            pathA = a.path, $pathA = a.$path;
        }
        if ( Array.isArray( b ) ) {
            pathB = b, $pathB = b.dotSafe ? b.join( '.' ) : undefined;
        } else {
            pathB = b.path, $pathB = b.$path;
        }
        let remainder = pathA.length - pathB.length;
        if ( remainder > 0 ) {
            [ pathA, pathB, $pathA, $pathB ] = [ pathB, pathA, $pathB, $pathA ];
        }
        if ( $pathA && $pathB ) {
            return [ `${ $pathB }.`.startsWith( `${ $pathA }.` ), remainder, [] ];
        }
        let computes = [];
        let getVal = element => ( typeof element === 'object' ? element.name : element );
        let compareIdentifiers = ( a, b ) => {
            if ( !a || !b ) return false;
            let isComputeA = typeof a === 'object' && ( 'memoId' in a ),
                isComputeB = typeof b === 'object' && ( 'memoId' in b );
            if ( isComputeA || isComputeB ) {
                computes.push( memo => {
                    return ( isComputeA ? memo[ a.memoId ] : getVal( a ) ) === ( isComputeB ? memo[ b.memoId ] : getVal( b ) ) 
                } );
                return true;
            }
            return getVal( a ) === getVal( b );
        };
        return [
            pathA.reduce( ( prev, identifier, i ) => prev && compareIdentifiers( identifier, pathB[ i ] ), true ),
            remainder,
            computes,
        ];
    }

    locate( reflexUrl ) {
        let ownLineage_ = this.graph.lineage + '/';
        let reflexUrl_ = reflexUrl + '/';
        if ( reflexUrl_ === ownLineage_ ) return this;
        if ( reflexUrl_.startsWith( ownLineage_ ) ) {
            let postLineage = reflexUrl.slice( ownLineage_.length ).split( '/' );
            let subReflex = this.subReflexes.get( parseInt( postLineage.shift() ) );
            if ( postLineage.length) {
                if ( subReflex instanceof Map ) {
                    return Array.from( subReflex ).reduce( ( subReflexes, [ key, _subReflex ] ) => {
                        return subReflexes.concat( _subReflex.locate( reflexUrl ) );
                    }, [] );
                }
                if ( subReflex ) {
                    return subReflex.locate( reflexUrl );
                }
            }
            return subReflex;
        }
        if ( this.ownerReflex ) {
            return this.ownerReflex.locate( reflexUrl );
        }
    }

    compute( computes ) {
        return !computes.some( compute => compute( this.reflex.memo ) === false );
    }

    assert( condition ) {
        if ( typeof condition === 'string' && condition.includes( ':' ) ) {
            let [ reflexUrl, _condition ] = condition.split( ':' );
            return this.locate( reflexUrl ).assert( _condition );
        }
        let conditionDef = this.graph.conditions[ condition ];
        let memo = this.reflex.memo;
        if ( typeof conditionDef.parent !== 'undefined'  && !this.assert( conditionDef.parent ) ) return false;
        if ( typeof conditionDef.switch !== 'undefined' ) {
            return conditionDef.cases.some( _case => memo[ _case ] === memo[ conditionDef.switch ] );
        }
        if ( typeof conditionDef.whenNot !== 'undefined' ) {
            return !memo[ conditionDef.whenNot ];
        }
        if ( typeof conditionDef.when !== 'undefined' ) {
            return memo[ conditionDef.when ];
        }
        return true;
    }

    dispose() {
        if ( this.params.isFunctionReflex ) return;
        this.subReflexes.forEach( ( subReflex, reflexId ) => {
            if ( subReflex instanceof Map ) {
                subReflex.forEach( subReflex => subReflex.dispose() );
                subReflex.clear();
            } else {
                subReflex.dispose();
            }
        } );
        this.subReflexes.clear();
        delete this.ownerReflex;
        delete this.callee;
        delete this.params;
        delete this.reflex.memo;
        this.disposed = true;
    }
    
    createFunction( createCallback, defaultThis = undefined ) {
        let instance = createCallback();
        // -------------
        const execute = function( _instance, ...args ) {
            let _returnValue = _instance.call( this === undefined ? defaultThis : this, ...args );
            if ( _instance.params.isReflexFunction && _instance.params.apiVersion > 1 ) {
                _returnValue = _await( _returnValue, __returnValue => [ __returnValue, _instance.thread.bind( _instance ), _instance ] );
                // Replace global for next call
                instance = createCallback( instance );
            }
            return _returnValue;
        };
        // -------------
        const _function = ( instance instanceof Promise ) || ( instance.callee instanceof ( async function() {} ).constructor )
            ? async function() { return _await( instance, _instance => execute.call( this, _instance, ...arguments ) ); } 
            : function() { return execute.call( this, instance, ...arguments ); };
        // -------------
        _await( instance, _instance => {
            this.applyReflection( _function, _instance );
        } );
        // -------------
        inspection( _function, _await( instance, _instance => {
            const graph = {
                type: _instance.params.functionType || 'Program',
                apiVersion: _instance.params.apiVersion || 1,
                isReflexFunction: _instance.params.isReflexFunction,
                sideEffects: _instance.graph.sideEffects || false,
                locations: _instance.graph.locations || [],
            };
            if ( _instance.params.isReflexFunction ) {
                graph.dependencies = [];
                for ( const [ id, effect ] of Object.entries( _instance.graph.effects ) ) {
                    graph.dependencies.push( ...effect.refs.map( ref => ref.path.map( s => !( 'name' in s ) ? Infinity : s.name ) ) );
                }
            }
            return graph;
        } ) );
        // -------------
        return _function;
    }

    applyReflection( _function, instance ) {
        // Hide implementation details on callee
        Object.defineProperty( instance.callee, 'length', { configurable: true, value: instance.callee.length - 1 } );
        const compiledSourceNeat = instance.callee.toString()//.replace( /\(\$[\w]+\,([\s]*)?/, '(' );
        Object.defineProperty( instance.callee, 'toString', { configurable: true, value: ( compiledSource = false ) => {
            if ( !compiledSource && instance.graph.originalSource ) { return instance.graph.originalSource; }
            return compiledSourceNeat;
        } } );
        // Hide implementation details on main
        let properties = {
            name: instance.callee.name,
            length: instance.callee.length,
            toString: instance.callee.toString,
        };
        if ( instance.params.isReflexFunction ) {
            if ( !( instance.params.apiVersion > 1 ) ) {
                properties = {
                    ...properties,
                    thread: instance.thread.bind( instance ),
                    dispose: instance.dispose.bind( instance ),
                    runtime: instance,
                };
            }
        }
        Object.keys( properties ).forEach( name => {
            Object.defineProperty( _function, name, { configurable: true, value: properties[ name ] } );
        } );
    }

}
