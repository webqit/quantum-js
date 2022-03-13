
/**
 * @imports
 */
import Ref from './Ref.js';
import Memo from './Memo.js';

export default class EffectRef extends Ref {

    constructor( ownerReference, id, def ) {
        super( ownerReference, id, def );
        this.subscriptions = new Map;
        this.$subscriptions = new Map;
        this.updates = new Map;
    }

    subscribe( signalReference, signalRef, isSideEffect = false ) {
        let subscriptionsObject = isSideEffect ? this.$subscriptions : this.subscriptions;
        let refSet = subscriptionsObject.get( signalReference );
        if ( !refSet ) {
            refSet = new Set;
            subscriptionsObject.set( signalReference, refSet );
        }
        refSet.add( signalRef );
        this.updates.forEach( refSet  => refSet.forEach( effectRef => {
            effectRef.subscribe( signalReference, signalRef, isSideEffect );
        } ) );
    }

    update( _effectReference, effectRef, isSideEffect ) {
        let refSet = this.updates.get( _effectReference );
        if ( !refSet ) {
            refSet = new Set;
            this.updates.set( _effectReference, refSet );
        }
        refSet.add( effectRef );
        if ( isSideEffect ) {
            // Existing subscribers should subscribe to this now
            this.subscriptions.forEach( ( refSet, signalReference ) => refSet.forEach( signalRef => {
                effectRef.subscribe( signalReference, signalRef, true );
            } ) );
        }
    }

    toJson( filter = false ) {
        let { id, conditionId, referenceId, ...json } = super.toJson( filter );
        let subscriptions = {};
        let $subscriptions = {};
        this.subscriptions.forEach( ( refSet, signalReference ) => {
            subscriptions[ signalReference.lineage ] = Array.from( refSet ).map( signalRef => signalRef.id );
        } );
        this.$subscriptions.forEach( ( refSet, signalReference ) => {
            $subscriptions[ signalReference.lineage ] = Array.from( refSet ).map( signalRef => signalRef.id );
        } );
        return {
            id,
            ...json,
            depth: this.depth.map( identifier => identifier instanceof Memo ? { memoId: identifier.id } : identifier ),
            subscriptions,
            $subscriptions,
            conditionId,
            referenceId,
        }
    }

}