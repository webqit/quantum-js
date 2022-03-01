
/**
 * @imports
 */
import Node from './Node.js';

/**
 * @extends Node
 * 
 * A Condition state
 */
export default class Condition extends Node {

    constructor( ownerEffect, parent, id, def ) {
        super( id, def );
        this.ownerEffect = ownerEffect;
        this.parent = parent;
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
            if ( this.parent.ownerEffect.id === this.ownerEffect.id ) {
                json.parent = this.parent.id;
            } else {
                json.parent = `${ this.parent.ownerEffect.lineage }:${ this.parent.id }`;
            }
        }
        return json;
    }

}