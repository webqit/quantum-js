
/**
 * @imports
 */
import Node from './Node.js';
import { astNodes } from './Generators.js';

/**
 * @extends Node
 * 
 * A Compute state
 */
export default class Memo extends Node {

    constructor( ownerEffect, id, def ) {
        super( id, def );
        this.ownerEffect = ownerEffect;
    }

    compose() {
        if ( !this.expr ) /* such as case: null / default: */ return [ this.expr, this ];
        let subscript$construct = astNodes.identifier( this.ownerEffect.getSubscriptIdentifier( '$construct', true ) );
        let ref = astNodes.memberExpr(
            astNodes.memberExpr( subscript$construct, astNodes.identifier( 'memo' ) ),
            astNodes.literal( this.id ),
            true
        );
        this.composed = astNodes.assignmentExpr( ref, this.expr );
        return [ this.composed, this ];
    }

    dispose() {
        if ( !this.composed ) return;
        Object.keys( this.composed ).forEach( k => {
            delete this.composed[ k ];
        } );
        Object.keys( this.expr ).forEach( k => {
            this.composed[ k ] = this.expr[ k ];
        } );
        this.composed = null;
    }

    toJson( filter = false ) {
        return {
            id: this.id,
        };
    }

}
