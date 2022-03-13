
/**
 * @imports
 */
import Common from './Common.js';

/**
 * @extends Common
 * 
 * A Condition state
 */
export default class Condition extends Common {

    constructor( ownerContext, id, def ) {
        super( id, def );
        this.ownerContext = ownerContext;
        this.ownerUnit = ownerContext.currentUnit || ownerContext;
        this.parent = ownerContext.currentCondition;
    }

    inUse( inUse ) {
        let ret = super.inUse( ...arguments ), memos = [];
        if ( this.switch ) {
            memos.push( this.switch, ...this.cases );
        } else if ( this.when || this.whenNot ) {
            memos.push( this.when || this.whenNot );
        }
        memos.forEach( memo => memo.inUse( ...arguments ) );
        return ret;
    }

    get lineage() {
        return `${ this.ownerUnit.lineage }:${ this.id }`;
    }

    toJson( filter = false ) {
        let json = { id: this.id };
        if ( this.switch ) {
            json.switch = this.switch.id;
            json.cases = this.cases.map( _case => _case.id );
        } else if ( this.whenNot ) {
            json.whenNot = this.whenNot.id;
        } else if ( this.when ) {
            json.when = this.when.id;
        }
        if ( this.parent ) {
            if ( this.parent.ownerUnit.id === this.ownerUnit.id ) {
                json.parent = this.parent.id;
            } else {
                json.parent = `${ this.parent.ownerUnit.lineage }:${ this.parent.id }`;
            }
        }
        return json;
    }

}