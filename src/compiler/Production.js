
/**
 * @imports
 */
import Node from './Node.js';

export default class Production extends Node {

    constructor( ownerEffect, id, def = {} ) {
        super( id, def );
        this.ownerEffect = ownerEffect;
        this.refs = new Set;
        this.params = {};
        this.propertyStack = [];
    }

    withProperty( property, callback ) {
        this.propertyStack.unshift( property );
        let result = this.contextProduction
            ? this.contextProduction.withProperty( property, callback ) 
            : callback();
        this.propertyStack.shift();
        return result;
    }

    toJson( filter = false ) {
        return {
            id: this.id,
            refs: Array.from( this.refs ).map( ref => ref.toJson( filter ) ),
            effectId: this.ownerEffect.id,
        };
    }

}