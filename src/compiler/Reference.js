
/**
 * @imports
 */
import Common from './Common.js';

export default class Reference extends Common {

    constructor( ownerContract, id, def = {} ) {
        super( id, def );
        this.ownerContract = ownerContract;
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
        return `${ this.ownerContract.lineage }:${ this.id }`;
    }

    toJson( filter = false ) {
        return {
            id: this.id,
            type: this.type,
            kind: this.kind,
            refs: Array.from( this.refs ).map( ref => ref.toJson( filter ) ),
            contractId: this.ownerContract.id,
        };
    }

}