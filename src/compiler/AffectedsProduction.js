
/**
 * @imports
 */
import Production from './Production.js';
import AffectedRef from './AffectedRef.js';

export default class AffectedsProduction extends Production {

    constructor( ownerEffect, id, def ) {
        super( ownerEffect, id, def );
        this.destructuringStack = [];
    }

    withDestructure( destructureIdentfier, callback ) {
        this.destructuringStack.push( destructureIdentfier );
        let result = callback();
        this.destructuringStack.pop();
        return result;
    }

    addRef( def = {} ) {
        let ref = new AffectedRef( this, this.refs.size, {
            ...def,
            test: this.test,
            depth: this.destructuringStack.slice( 0 ),
        } );
        ref.push( ...this.propertyStack );
        this.refs.add( ref );
        return ref;
    }

    doSubscribe( subscriber, meta = null ) {
        let _meta = [];
        this.refs.forEach( ( affectedRef, i ) => {
            subscriber.refs.forEach( subscriberRef => {
                let [ isMatch, remainder ] = affectedRef.match( subscriberRef );
                if ( isMatch && remainder <= 0 ) {
                    if ( this.kind === 'const') {
                        _meta.push( 'const' );
                        return;
                    }
                    affectedRef.subscribe( subscriber, subscriberRef );
                    _meta.push( `${ this.id }:${ i }` );
                    // Someone is depending on us now
                    this.inUse( true );
                    if ( affectedRef.test ) {
                        affectedRef.test.inUse( true );
                    }
                }
            } );
        } );
        if ( Array.isArray( meta ) ) {
            meta.push( ..._meta );
        }
        return _meta.length > 0;
    }

    doUpdate( updater, meta = null ) {
        // IMPORTANT: Otherwise infinite recursion
        if ( updater === this ) return false;
        let _meta = [];
        this.refs.forEach( ( affectedRef, i ) => {
            updater.refs.forEach( updaterRef => {
                let [ isMatch, remainder ] = affectedRef.match( updaterRef );
                if ( isMatch && remainder >= 0 ) {
                    if ( this.kind === 'const' ) {
                        throw new Error(`Assignment to a constant declaration.`);
                    }
                    affectedRef.update( updater, updaterRef );
                    _meta.push( `${ this.id }:${ i }` );
                }
            } );
        } );
        if ( Array.isArray( meta ) ) {
            meta.push( ..._meta );
        }
        return _meta.length > 0;
    }

    inUse( inUse ) {
        let ret = super.inUse( ...arguments );
        this.ownerEffect.inUse( ...arguments );
        return ret;
    }

}