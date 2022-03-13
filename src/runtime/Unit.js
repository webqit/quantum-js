
/**
 * @imports
 */

export default class Unit {

    constructor( ownerUnit, graph, callee, params = {}, $thread = null, exits = null ) {
        this.ownerUnit = ownerUnit;
        this.graph = graph;
        this.callee = callee;
        this.params = params;
        this.exits = exits || new Map;
        this.$thread = $thread || { entries: new Map, sequence: [], ownerUnit: this.graph.lineage };
        this.subUnits = new Map;
        this.unit = function( unitId, arg1, arg2 = null, arg3 = null ) {
            if ( !this.graph.subUnits[ unitId ] ) {
                throw new Error( `[${ this.graph.type }:${ this.graph.lineage }]: Graph not found for child unit ${ unitId }.` );
            }

            let subGraph = this.graph.subUnits[ unitId ];
            let subParams = {
                ...this.params,
                isIterationUnit: arguments.length === 3,
                iterationId: arguments.length === 3 && arg1,
                isFunctionUnit: arguments.length === 4,
                functionType: arguments.length === 4 && arg1,
                isSubscriptFunction: arguments.length === 4 && arg2,
                functionScope: ( this.params.isFunctionUnit && this.graph.lineage ) || this.params.functionScope,
            };

            if ( subParams.isIterationUnit ) {
                // This is an iteration unit
                let callee = arg2;
                // Create iteration
                let iterationInstanceUnit = new Unit( this, subGraph, callee, subParams, this.$thread, this.exits );
                // Add iteration
                let iterations = this.subUnits.get( unitId );
                if ( !iterations ) {
                    iterations = new Map;
                    this.subUnits.set( unitId, iterations );
                }
                // Dispose all existing
                if ( iterations.has( subParams.iterationId ) ) {
                    iterations.get( subParams.iterationId ).dispose();
                }
                iterations.set( subParams.iterationId, iterationInstanceUnit );
                return iterationInstanceUnit.call();
            }

            let callee, subUnit, returnValue;
            // Dispose existing
            if ( this.subUnits.has( unitId ) ) {
                this.subUnits.get( unitId ).dispose();
            }

            if ( subParams.isFunctionUnit ) {
                // Function units
                callee = arg3, returnValue = subUnit = new Unit( this, subGraph, callee, subParams );
                if ( subParams.functionType !== 'FunctionDeclaration' ) {
                    returnValue = callee instanceof ( async () => {} ).constructor
                        ? async function() { return subUnit.call( this, ...arguments ); }
                        : function() { return subUnit.call( this, ...arguments ); };
                    bindFunctionToRuntime( returnValue, subUnit );
                }
            } else {
                // Regular units
                callee = arg1, subUnit = new Unit( this, subGraph, callee, subParams, this.$thread, this.exits );
                returnValue = subUnit.call();
            }

            this.subUnits.set( unitId, subUnit );
            return returnValue;
        }.bind( this );
        this.unit.memo = Object.create( null );
        // ---------------------------
        this.unit.exiting = function( keyword, arg ) {
            if ( !arguments.length ) return this.exits.size;
            let exitMatch = this.exits.get( keyword ) === arg;
            if ( exitMatch ) this.exits.clear();
            return exitMatch;
        }.bind( this );
        // ---------------------------
        this.unit.exit = function( keyword, arg ) {
            this.exits.set( keyword, arg );
        }.bind( this );
        // ---------------------------
        this.unit.functions = new Map;
        this.unit.functions.define = ( functionDeclaration, unitInstance ) => {
            this.unit.functions.set( functionDeclaration, unitInstance );
            bindFunctionToRuntime( functionDeclaration, unitInstance, true );
        }
        const bindFunctionToRuntime = ( _function, runtime, isDeclaration = false ) => {
            if ( !isDeclaration ) {
                Object.defineProperty( _function, 'length', { configurable: true, value: runtime.callee.length - 1 } );
                Object.defineProperty( _function, 'name', { configurable: true, value: runtime.callee.name } );
            }
            if ( runtime.params.isSubscriptFunction ) {
                _function.thread = runtime.thread.bind( runtime );
                _function.dispose = runtime.dispose.bind( runtime );
                Object.defineProperty( _function, 'runtime', { value: runtime } );
                Object.defineProperty( _function, 'sideEffects', { configurable: true, value: runtime.graph.sideEffects || '' } );
                Object.defineProperty( _function, 'subscriptSource', { configurable: true, value: runtime.graph.subscriptSource || '' } );
                Object.defineProperty( _function, 'originalSource', { configurable: true, value: runtime.graph.originalSource || '' } );
            };
        }
    }

    fire( unitUrl, event, refs ) {
        if ( !this.ownerUnit ) return;
        return this.ownerUnit.fire( unitUrl, event, refs );
    }

    call( $this, ...$arguments ) {
        if ( this.disposed ) {
            throw new Error( `Instance not runable after disposal.` );
        }
        let returnValue = this.callee.call( $this, this.unit, ...$arguments );
        if ( this.graph.$sideEffects ) {
            for ( let referenceId in this.graph.effects ) {
                for ( let effectRef of this.graph.effects[ referenceId ].refs ) {
                    // Build side effects
                    this.buildThread( [], effectRef, [], 0, true );
                }
            }
        }
        if ( !this.ownerUnit || this.params.isFunctionUnit ) {
            let exitReturnValue = this.exits.get( 'return' );
            this.exits.clear();
            if ( exitReturnValue !== undefined ) {
                returnValue = returnValue instanceof Promise ? returnValue.then( () => exitReturnValue ) : exitReturnValue;
            }
        }
        return returnValue;
    }

    iterate( keys = [] ) {
        if ( this.disposed ) return false;
        if ( ![ 'ForOfStatement', 'ForInStatement'].includes( this.graph.type ) || this.subUnits.size !== 1 ) {
            throw new Error( `Unit ${ this.graph.lineage } is not an iterator.` );
        }
        let [ [ /* iterationUnitId */, iterationInstances ] ] = this.subUnits;
        let prev, _await = ( prev, callback ) => prev instanceof Promise ? prev.then( callback ) : callback();
        if ( !keys.length || ( keys.includes( 'length') && this.graph.type === 'ForOfStatement' ) ) {
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
            && refs.every( ref => ref.executionPlan.isIterationUnitTarget ) ) {
                let targets = refs.map( ref => ref.executionPlan.iterationTarget );
                this.fire( entry.graph.lineage, 'iterating', refs );
                return entry.iterate( targets );
            }
            this.fire( entry.graph.lineage, 'executing', refs );
            return entry.call();
        };
        let prev, entry, refs, _await = ( prev, callback ) => prev instanceof Promise ? prev.then( callback ) : callback();
        while ( ( entry = this.$thread.sequence.shift() ) && ( refs = [ ...this.$thread.entries.get( entry ) ] ) ) {
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
        if ( this.ownerUnit ) {
            // IMPORTANT: effectRef at global level are not supposed to be checked for computes and condition
            if ( !this.compute( computes ) ) return;
            if ( effectRef.conditionId !== undefined && !this.assert( effectRef.conditionId ) ) return;
        } else if ( !shouldMatchEventRef ) {
            shouldMatchEventRef = computes.length || effectRef.conditionId !== undefined;
        }
        let subscriptionsObject = isSideEffect ? effectRef.$subscriptions : effectRef.subscriptions;
        // First we assert the conditions for the effectRef before moving on
        Object.keys( subscriptionsObject ).forEach( fullReferenceUrl => {
            let [ unitUrl, referenceId ] = fullReferenceUrl.split( ':' );
            let selectRefs = _subscriberInstance => {
                if ( !_subscriberInstance ) return;
                _subscriberInstance.selectRefs( referenceId, subscriptionsObject[ fullReferenceUrl ], shouldMatchEventRef ? eventRef : null );
            }
            // We find the subscriber instance
            let subscriberInstance = this.locate( unitUrl );
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
                selectRef( ref, computes_b, { isIterationUnitTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
                continue;
            }
            if ( remainder_b === 1 && this.graph.type === 'ForInStatement' ) {
                // An iteration property was changed
                selectRef( ref, computes_b, { isIterationUnitTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
                continue;
            }
        }
    }

    filterRefs( refs ) {
        return refs.filter( ref => {
            if ( !this.compute( ref.computes ) ) return;
            if ( ref.conditionId !== undefined && !this.assert( ref.conditionId ) ) return;
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

    locate( unitUrl ) {
        let ownLineage_ = this.graph.lineage + '/';
        let unitUrl_ = unitUrl + '/';
        if ( unitUrl_ === ownLineage_ ) return this;
        if ( unitUrl_.startsWith( ownLineage_ ) ) {
            let postLineage = unitUrl.slice( ownLineage_.length ).split( '/' );
            let subUnit = this.subUnits.get( parseInt( postLineage.shift() ) );
            if ( postLineage.length) {
                if ( subUnit instanceof Map ) {
                    return Array.from( subUnit ).reduce( ( subUnits, [ key, _subUnit ] ) => {
                        return subUnits.concat( _subUnit.locate( unitUrl ) );
                    }, [] );
                }
                return subUnit.locate( unitUrl );
            }
            return subUnit;
        }
        if ( this.ownerUnit ) {
            return this.ownerUnit.locate( unitUrl );
        }
    }

    compute( computes ) {
        return !computes.some( compute => compute( this.unit.memo ) === false );
    }

    assert( conditionId ) {
        if ( typeof conditionId === 'string' && conditionId.includes( ':' ) ) {
            let [ unitUrl, _conditionId ] = conditionId.split( ':' );
            return this.locate( unitUrl ).assert( _conditionId );
        }
        let condition = this.graph.conditions[ conditionId ],
            memo = this.unit.memo;
        if ( 'parent' in condition  && !this.assert( condition.parent ) ) return false;
        if ( 'switch' in condition ) {
            return condition.cases.some( _case => memo[ _case ] === memo[ condition.switch ] );
        }
        if ( 'whenNot' in condition ) {
            return memo[ condition.whenNot ];
        }
        if ( 'when' in condition ) {
            return memo[ condition.when ];
        }
        return true;
    }

    dispose() {
        this.subUnits.forEach( ( subUnit, unitId ) => {
            if ( subUnit instanceof Map ) {
                subUnit.forEach( subUnit => subUnit.dispose() );
                subUnit.clear();
            } else {
                subUnit.dispose();
            }
        } );
        this.subUnits.clear();
        delete this.ownerUnit;
        delete this.graph;
        delete this.callee;
        delete this.params;
        delete this.unit.memo;
        this.disposed = true;
    }

}