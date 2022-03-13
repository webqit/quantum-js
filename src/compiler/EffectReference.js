
/**
 * @imports
 */
import Reference from './Reference.js';
import EffectRef from './EffectRef.js';

export default class EffectReference extends Reference {

    constructor( ownerUnit, id, def ) {
        super( ownerUnit, id, def );
        this.destructuringStack = [];
    }

    withDestructure( destructureIdentfier, callback ) {
        this.destructuringStack.push( destructureIdentfier );
        let result = callback();
        this.destructuringStack.pop();
        return result;
    }

    addRef( def = {} ) {
        let ref = new EffectRef( this, this.refs.size, {
            ...def,
            condition: this.condition,
            depth: this.destructuringStack.slice( 0 ),
        } );
        ref.push( ...this.propertyStack );
        this.refs.add( ref );
        return ref;
    }

    doSubscribe( signalReference, remainderRefs ) {
        let _remainderRefs = new Set( remainderRefs );
        this.refs.forEach( ( effectRef, i ) => {
            _remainderRefs.forEach( signalRef => {
                let [ isMatch, remainder ] = effectRef.match( signalRef );
                if ( isMatch && remainder <= 0 ) {
                    if ( this.kind === 'const' ) return;
                    effectRef.subscribe( signalReference, signalRef );
                    // Someone is depending on us now
                    this.inUse( true );
                    if ( effectRef.condition ) {
                        effectRef.condition.inUse( true );
                    }
                    _remainderRefs.delete( signalRef );
                }
            } );
        } );
        return [ ..._remainderRefs ];
    }

    doUpdate( _effectReference, remainderRefs, isSideEffect ) {
        // IMPORTANT: Otherwise infinite recursion
        let _remainderRefs = new Set( remainderRefs );
        if ( _effectReference === this ) return [ ..._remainderRefs ];
        this.refs.forEach( ( effectRef, i ) => {
            _remainderRefs.forEach( _effectRef => {
                let [ isMatch, remainder ] = effectRef.match( _effectRef );
                if ( isMatch && remainder >= 0 ) {
                    if ( this.kind === 'const' ) {
                        throw new Error(`Assignment to a constant declaration.`);
                    }
                    effectRef.update( _effectReference, _effectRef, isSideEffect );
                    _remainderRefs.delete( _effectRef );
                }
            } );
        } );
        return [ ..._remainderRefs ];
    }

    inUse( inUse ) {
        let ret = super.inUse( ...arguments );
        this.ownerUnit.inUse( ...arguments );
        return ret;
    }

}