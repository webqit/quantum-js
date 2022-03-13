
/**
 * @imports
 */
import Common from './Common.js';

export default class Reference extends Common {

    constructor( ownerUnit, id, def = {} ) {
        super( id, def );
        this.ownerUnit = ownerUnit;
        this.refs = new Set;
        this.propertyStack = [];
        this.embeddingReference = null;
    }

    withProperty( property, callback ) {
        this.propertyStack.unshift( property );
        let result = this.embeddingReference
            ? this.embeddingReference.withProperty( property, callback ) 
            : callback();
        this.propertyStack.shift();
        return result;
    }

    get lineage() {
        return `${ this.ownerUnit.lineage }:${ this.id }`;
    }

    toJson( filter = false ) {
        return {
            id: this.id,
            type: this.type,
            kind: this.kind,
            refs: Array.from( this.refs ).map( ref => ref.toJson( filter ) ),
            unitId: this.ownerUnit.id,
        };
    }

}