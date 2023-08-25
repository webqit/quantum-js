
/**
 * @imports
 */
import Common from './Common.js';
import EffectReference from './EffectReference.js';

/**
 * @Scope
 */
export default class Scope extends Common {

    constructor( ownerContext, id, def = {} ) {
        super( id, def );
        this.ownerContext = ownerContext;
        this.ownerScope = ownerContext && ( ownerContext.currentScope || ownerContext.ownerScope );
        // signals
        this.effectReferences = [];
    }

    // ---------------

    pushEffectReference( effectReference ) {
        this.effectReferences.unshift( effectReference );
    }

    // -----------------

    doSubscribe( signalReference, remainderRefs = null ) {
        remainderRefs = this.effectReferences.reduce( ( _remainderRefs, effectReference ) => {
            return effectReference.doSubscribe( signalReference, _remainderRefs );
        }, remainderRefs || [ ...signalReference.refs ] );
        if ( !remainderRefs.length ) return true;
        // Statements within functions can not subscribe to outside variables
        if ( !this.ownerScope || [ 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression' ].includes( this.type ) ) {
            remainderRefs = this.ownerContext.references.reduce( ( _remainderRefs, reference ) => {
                if ( !( reference instanceof EffectReference ) ) return _remainderRefs;
                return reference.doSubscribe( signalReference, _remainderRefs );
            }, remainderRefs );
            if ( !remainderRefs.length ) return true;
            return this.ownerContext.effectReference( {}, effectReference => {
                remainderRefs.forEach( signalRef => {
                    this.canObserveGlobal( signalRef ) && effectReference.addRef().push( ...signalRef.path );
                } );
                signalReference.inUse( true );
                return effectReference.doSubscribe( signalReference, remainderRefs ), true;
            }, false/* resolveInScope; a false prevents calling this.doUpdate() */ );
        }
        if ( this.ownerScope ) {
            return this.ownerScope.doSubscribe( signalReference, remainderRefs );
        }
    }

    doUpdate( _effectReference, remainderRefs = null ) {
        // Not forEach()... but reduce() - only first one must be updated
        remainderRefs = this.effectReferences.reduce( ( _remainderRefs, effectReference ) => {
            return effectReference.doUpdate( _effectReference, _remainderRefs );
        }, remainderRefs || [ ..._effectReference.refs ] );
        if ( !this.ownerScope || [ 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression' ].includes( this.type ) ) {
            if ( _effectReference.type === 'VariableDeclaration' /* and ofcourse, kind: var */ ) return;
            _effectReference.ownerReflex.$sideEffects = true;
            let sideEffects = remainderRefs.length && remainderRefs || [ ..._effectReference.refs ];
            return this.ownerContext.sideEffects.push( { reference: _effectReference, remainderRefs: sideEffects } ), true;
        }
        if ( !remainderRefs.length ) return true;
        if ( this.ownerScope ) {
            return this.ownerScope.doUpdate( _effectReference, remainderRefs );
        }
    }

    doSideEffectUpdates( _effectReference, remainderRefs ) {
        // Not reduce()... but forEach() - all must be updated
        this.effectReferences.forEach( effectReference => {
            let _remainderRefs = effectReference.doUpdate( _effectReference, remainderRefs, true /*isSideEffects*/ );
            if ( effectReference.type === 'VariableDeclaration' ) {
                // It is only here remainderRefs gets to reduce
                remainderRefs = _remainderRefs;
            }
        } );
        if ( !remainderRefs.length ) return true;
        if ( !this.ownerScope || [ 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression' ].includes( this.type ) ) {
            return this.ownerContext.sideEffects.push( { reference: _effectReference, remainderRefs, isSideEffects: true } ), true;
        }
        if ( this.ownerScope ) {
            return this.ownerScope.doSideEffectUpdates( _effectReference, remainderRefs );
        }
    }

    canObserveGlobal( ref ) {
        return (
            !this.ownerContext.$params.globalsOnlyPathsExcept?.length || ref.path.length > 1
            || ( this.ownerContext.$params.globalsOnlyPathsExcept || [] ).includes( ref.path[ 0 ].name )
        ) && !( this.ownerContext.$params.globalsNoObserve || [] ).includes( ref.path[ 0 ].name );
    }

}
