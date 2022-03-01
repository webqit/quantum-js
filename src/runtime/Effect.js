
/**
 * @imports
 */

export default class Effect {

    constructor( parentEffect, graph, callee, params = {}, exits = null ) {
        this.parentEffect = parentEffect;
        this.graph = graph;
        this.callee = callee;
        this.params = params;
        this.exits = exits || new Map;
        this.childEffects = new Map;
        this.construct = function( effectId, arg1, arg2 = null ) {
            let effectGraph = this.graph.childEffects[ effectId ];
            if ( !effectGraph ) {
                throw new Error( `[${ this.graph.type }|${ this.graph.lineage }]: Graph not found for child effect ${ effectId }.` );
            }
            if ( arguments.length === 3 ) {
                // This is an iteration
                let iterationId = arg1, callee = arg2;
                // Create iteration
                let iterationInstanceEffect = new Effect( this, effectGraph, callee, {
                    ...this.params,
                    iterationId,
                }, this.exits );
                // Add iteration
                let iterations = this.childEffects.get( effectId );
                if ( !iterations ) {
                    iterations = new Map;
                    this.childEffects.set( effectId, iterations );
                }
                if ( iterations.has( iterationId ) ) {
                    iterations.get( iterationId ).dispose();
                }
                iterations.set( iterationId, iterationInstanceEffect );
                return iterationInstanceEffect.call();
            }
            // This is normal callback
            let callee = arg1;
            let childEffect = new Effect( this, effectGraph, callee, { ...this.params }, this.exits );
            if ( this.childEffects.has( effectId ) ) {
                this.childEffects.get( effectId ).dispose();
            }
            this.childEffects.set( effectId, childEffect );
            return childEffect.call();
        }.bind( this );
        this.construct.exiting = function( keyword, arg ) {
            if ( !arguments.length ) return this.exits.size;
            let exitMatch = this.exits.get( keyword ) === arg;
            if ( exitMatch ) this.exits.clear();
            return exitMatch;
        }.bind( this );
        this.construct.exit = function( keyword, arg ) {
            this.exits.set( keyword, arg );
        }.bind( this );
        this.construct.memo = Object.create( null );
    }

    call( $this, ...$arguments ) {
        if ( this.disposed ) {
            throw new Error( `Instance not runable after disposal.` );
        }
        let ret = this.callee.call( $this, this.construct, ...$arguments );
        if ( !this.parentEffect ) {
            let _ret = this.exits.get( 'return' );
            this.exits.clear();
            ret = ret instanceof Promise ? ret.then( () => _ret ) : _ret;
        }
        return ret;
    }

    iterate( keys = [] ) {
        if ( this.disposed ) return false;
        if ( ![ 'ForOfStatement', 'ForInStatement'].includes( this.graph.type ) || this.childEffects.size !== 1 ) {
            throw new Error( `Effect ${ this.graph.lineage } is not an iterator.` );
        }
        let [ [ /* iterationEffectId */, iterationInstances ] ] = this.childEffects;
        let prev, after = ( prev, callback ) => prev instanceof Promise ? prev.then( callback ) : callback();
        if ( !keys.length || ( keys.includes( 'length') && this.graph.type === 'ForOfStatement' ) ) {
            for ( let [ /* iterationId */, iterationInstance ] of iterationInstances ) {
                prev = after( prev, () => iterationInstance.call() );
            }
        } else {
            for ( let key of keys ) {
                let instance = iterationInstances.get( key ) || iterationInstances.get( parseInt( key ) );
                if ( !instance ) continue;
                prev = after( prev, () => instance.call() );
            }
        }
        return prev;
    }

    fire( effectUrl, event, refs ) {
        if ( !this.parentEffect ) return;
        return this.parentEffect.fire( effectUrl, event, refs );
    }

    signal( ...eventRefs ) {
        if ( this.disposed ) return false;
        let thread = { entries: new Map, sequence: [] };

        for ( let productionId in this.graph.affecteds ) {
            for ( let effectRef of this.graph.affecteds[ productionId ].refs ) {
                for ( let eventRef of eventRefs ) {
                    let [ isMatch, remainder, computes ] = this.matchRefs( eventRef, effectRef );
                    if ( !isMatch ) continue;
                    this.buildThread( thread, eventRef, effectRef, computes, remainder );
                }
            }
        }

        let execute = ( entry, refs ) => {
            if ( [ 'ForOfStatement', 'ForInStatement' ].includes( entry.graph.type ) 
            && refs.every( ref => ref.executionPlan.isIterationTarget ) ) {
                let targets = refs.map( ref => ref.executionPlan.iterationTarget );
                this.fire( entry.graph.lineage, 'iterating', refs );
                return entry.iterate( targets );
            }
            this.fire( entry.graph.lineage, 'executing', refs );
            return entry.call();
        };
        
        let prev, entry, refs, after = ( prev, callback ) => prev instanceof Promise ? prev.then( callback ) : callback();
        while ( ( entry = thread.sequence.shift() ) && ( refs = [ ...thread.entries.get( entry ) ] ) ) {
            prev = after( prev, () => {
                if ( entry.disposed || !entry.filterRefs( refs ).length ) return;
                let maybePromise = execute( entry, refs );
                after( maybePromise, () => {
                    for ( let ref of refs ) {
                        [].concat( ref.executionPlan.assigneeRef || ref.executionPlan.assigneeRefs || [] ).forEach( assigneeRef => {
                            entry.buildThread( thread, [], assigneeRef, [], 0 );
                        } );
                    }
                } );
                return maybePromise;
            } );
        }

        return after( prev, () => {
            let _ret = this.exits.get( 'return' );
            this.exits.clear();
            return _ret;
        } );
    }

    buildThread( thread, eventRef, affectedRef, computes, remainder = 0 ) {
        let shouldMatchEventRef = remainder > 0;
        if ( this.parentEffect ) {
            // IMPORTANT: affectedRef at global level are not supposed to be checked for computes and condition
            if ( !this.compute( computes ) ) return;
            if ( affectedRef.conditionId !== undefined && !this.assert( affectedRef.conditionId ) ) return;
        } else if ( !shouldMatchEventRef ) {
            shouldMatchEventRef = computes.length || affectedRef.conditionId !== undefined;
        }
        // First we assert the conditions for the affectedRef before moving on
        Object.keys( affectedRef.subscriptions ).forEach( fullProductionUrl => {
            let [ effectUrl, productionId ] = fullProductionUrl.split( ':' );
            let selectRefs = _subscriberInstance => {
                if ( !_subscriberInstance ) return;
                _subscriberInstance.selectRefs( thread, productionId, affectedRef.subscriptions[ fullProductionUrl ], shouldMatchEventRef ? eventRef : null );
            }
            // We find the subscriber instance
            let subscriberInstance = this.locate( effectUrl );
            if ( Array.isArray( subscriberInstance ) ) {
                subscriberInstance.forEach( selectRefs );
            } else {
                selectRefs( subscriberInstance );
            }
        } );
    }

    selectRefs( thread, productionId, refIds, eventRef = null ) {
        // We'll select refs from within the following production
        let production = this.graph.causes[ productionId ];
        let assigneeProduction = 'assignee' in production ? this.graph.affecteds[ production.assignee ] : null;
        // -----------------------------------------
        let selectRef = ( ref, computes = [], executionPlan = {} ) => {
            let refs = thread.entries.get( this );
            if ( !refs ) {
                refs = new Set;
                thread.entries.set( this, refs );
                thread.sequence.push( this );
                thread.sequence.sort( ( a, b ) => {
                    return a.graph.lineage.localeCompare( b.graph.lineage, undefined, { numeric: true } );
                } );
            }
            refs.add( { ...ref, computes, executionPlan } );
            if ( !executionPlan.assigneeRef && assigneeProduction ) {
                executionPlan.assigneeRefs = assigneeProduction.refs;
            }
        };
        // -----------------------------------------
        for ( let refId of refIds ) {
            // The ref within production
            let ref = production.refs[ refId ];
            // First we assert the conditions for the ref before moving on
            if ( !eventRef ) {
                // AffectedRef matched event ref... So we select ALL refs within production
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
            if ( assigneeProduction ) {
                assigneeProduction.refs.forEach( assigneeRef => {
                    if ( assigneeRef.depth.length ) {
                        let [ isMatch_c, remainder_c, computes_c ] = this.matchRefs( eventRef_balance, assigneeRef.depth );
                        let computes_d = computes_b.concat( computes_c );
                        if ( isMatch_c && remainder_c > 0 ) {
                            // We move on passively to subscriptions on the assignee
                            let newEventRef = assigneeRef.path.concat( eventRef_balance.slice( -remainder_c ) );
                            this.buildThread( thread, newEventRef, assigneeRef, computes_d, remainder_c );
                        } else if ( isMatch_c ) {
                            // Match is successful on the destructuring side... so we select
                            selectRef( ref, computes_d, { assigneeRef } );
                        }
                    } else {
                        // We move on passively to subscriptions on the assignee
                        let newEventRef = assigneeRef.path.concat( eventRef_balance );
                        this.buildThread( thread, newEventRef, assigneeRef, computes_b, remainder_b );
                    }
                } );
                continue;
            }
            if ( remainder_b === 1 && this.graph.type === 'ForOfStatement' ) {
                // An iteration item was changed or the length property of the list was changed
                selectRef( ref, computes_b, { isIterationTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
                continue;
            }
            if ( remainder_b === 1 && this.graph.type === 'ForInStatement' ) {
                // An iteration property was changed
                selectRef( ref, computes_b, { isIterationTarget: true, iterationTarget: eventRef_balance[ 0 ] } );
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

    locate( effectUrl ) {
        let ownLineage_ = this.graph.lineage + '/';
        let effectUrl_ = effectUrl + '/';
        if ( effectUrl_ === ownLineage_ ) return this;
        if ( effectUrl_.startsWith( ownLineage_ ) ) {
            let postLineage = effectUrl.slice( ownLineage_.length ).split( '/' );
            let childEffect = this.childEffects.get( parseInt( postLineage.shift() ) );
            if ( postLineage.length) {
                if ( childEffect instanceof Map ) {
                    return Array.from( childEffect ).reduce( ( childEffects, [ key, _childEffect ] ) => {
                        return childEffects.concat( _childEffect.locate( effectUrl ) );
                    }, [] );
                }
                return childEffect.locate( effectUrl );
            }
            return childEffect;
        }
        if ( this.parentEffect ) {
            return this.parentEffect.locate( effectUrl );
        }
    }

    compute( computes ) {
        return !computes.some( compute => compute( this.construct.memo ) === false );
    }

    assert( conditionId ) {
        if ( typeof conditionId === 'string' && conditionId.includes( ':' ) ) {
            let [ effectUrl, _conditionId ] = conditionId.split( ':' );
            return this.locate( effectUrl ).assert( _conditionId );
        }
        let condition = this.graph.conditions[ conditionId ],
            memo = this.construct.memo;
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
        this.childEffects.forEach( ( childEffect, effectId ) => {
            if ( childEffect instanceof Map ) {
                childEffect.forEach( childEffect => childEffect.dispose() );
                childEffect.clear();
            } else {
                childEffect.dispose();
            }
        } );
        this.childEffects.clear();
        delete this.parentEffect;
        delete this.graph;
        delete this.callee;
        delete this.params;
        delete this.construct.memo;
        this.disposed = true;
    }

}