
/**
 * @imports
 */
import Ref from './Ref.js';
import Memo from './Memo.js';

export default class AffectedRef extends Ref {

    constructor( ownerProduction, id, def ) {
        super( ownerProduction, id, def );
        this.subscriptions = new Map;
        this.updates = new Map;
    }

    subscribe( subscriber, subscriberRef ) {
        let refSet = this.subscriptions.get( subscriber );
        if ( !refSet ) {
            refSet = new Set;
            this.subscriptions.set( subscriber, refSet );
        }
        refSet.add( subscriberRef );
        this.updates.forEach( refSet  => {
            refSet.forEach( updaterRef => {
                updaterRef.subscribe( subscriber, subscriberRef );
            } );
        } );
    }

    update( updater, updaterRef ) {
        let refSet = this.updates.get( updater );
        if ( !refSet ) {
            refSet = new Set;
            this.updates.set( updater, refSet );
        }
        refSet.add( updaterRef );
    }

    toJson( filter = false ) {
        let { id, conditionId, productionId, ...json } = super.toJson( filter );
        let subscriptions = Array.from( this.subscriptions.keys() ).reduce( ( subs, subscription ) => {
            let refsAddress = `${ subscription.ownerEffect.lineage }:${ subscription.id }`;
            let refs = Array.from( this.subscriptions.get( subscription ) ).map( subscriptionRef => subscriptionRef.id );
            return { ...subs, [ refsAddress ]: refs, };
        }, {} );
        return {
            id,
            type: this.type,
            kind: this.kind,
            ...json,
            depth: this.depth.map( identifier => identifier instanceof Memo ? { memoId: identifier.id } : identifier ),
            conditionId,
            productionId,
            subscriptions,
        }
    }

}