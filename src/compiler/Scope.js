
/**
 * @imports
 */
import Node from './Node.js';
import Effect from './Effect.js';

/**
 * @Scope
 */
export default class Scope extends Node {

    constructor( ownerEffect, id, def = {} ) {
        super( id, def );
        this.ownerEffect = ownerEffect;
        // Effects
        this.effects = [];
        this.effectsStack = [];
    }

    // -----------------
    
    get parentScope() {
        return this.ownerEffect && this.ownerEffect.ownerScope;
    }

    get $params() {
        return this.params || (
            this.ownerEffect && this.ownerEffect.$params
        );
    }

    get url() {
        let lineage = this.ownerEffect && this.ownerEffect.url;
        return `${ lineage ? lineage + '/' : '' }${ this.id }`;
    }

    // -----------------

    createEffect( def, callback ) {
        let effect = new Effect( this, this.ownerEffect.nextId, def );
        this.effects.unshift( effect );
        // Keep in stack while callback runs
        this.effectsStack.unshift( effect );
        let result = callback( effect );
        this.effectsStack.shift();
        // Return callback result
        return result;
    }

    get currentEffect() {
        return this.effectsStack[ 0 ] || ( this.parentScope || {} ).currentEffect;
    }

    createBlock( callback ) {
        let def = { type: 'BlockStatement' };
        return this.createEffect( def, effect => effect.createScope( def, callback ) );
    }

    // ---------------
    
    static( val ) {
        if ( arguments.length ) {
            this._static = val;
            return this;
        }
        return this._static || (
            this.parentScope && this.parentScope.static()
        );
    }

    // -----------------

    doSubscribe( subscriber, meta = null ) {
        let success = this.effects.some( effect => effect.affecteds.some( affected => {
            return affected.doSubscribe( subscriber, meta );
        } ) );
        if ( this.parentScope ) {
            success = success || this.parentScope.doSubscribe( subscriber, meta );
        } else if ( !success && this.ownerEffect ) {
            return this.ownerEffect.affectedsProduction( {}, production => {
                subscriber.refs.forEach( ref => {
                    this.canObserveGlobal( ref ) && production.addRef().push( ...ref.path );
                } );
                subscriber.inUse( true );
                subscriber.ownerEffect.inUse( true );
                return production.doSubscribe( subscriber, meta );
            }, false/* resolveInScope; a false prevents calling this.doUpdate() */ );
        }
        return success;
    }

    doUpdate( updater, meta = null ) {
        let success = this.effects.some( effect => effect.affecteds.some( affected => {
            let update = affected.doUpdate( updater, meta );
            if ( update && affected.type === 'VariableDeclaration' && Array.isArray( meta ) ) {
                meta.push( 'lexical-update' );
            }
            return update;
        } ) );
        if ( this.parentScope ) {
            success = success || this.parentScope.doUpdate( updater, meta );
        } else if ( !success && this.ownerEffect ) {
            this.ownerEffect.affecteds.push( updater );
            if ( Array.isArray( meta ) ) {
                meta.push( 'globalization' );
            }
            return true;
        }
        return success;
    }

    canObserveGlobal( ref ) {
        return ( !this.$params.globalsOnlyPaths || ref.path.length > 1 )
        && !( this.$params.globalsNoObserve || [] ).includes( ref.path[ 0 ].name );
    }

}
