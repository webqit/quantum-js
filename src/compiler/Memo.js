
/**
 * @imports
 */
import Common from './Common.js';
import Node from './Node.js';

/**
 * @extends Node
 * 
 * A Compute state
 */
export default class Memo extends Common {

    constructor( ownerContext, id, def ) {
        super( id, def );
        this.ownerContext = ownerContext;
    }

    generate() {
        if ( !this.expr ) /* such as case: null / default: */ return [ this.expr, this ];
        let id$contract = Node.identifier( this.ownerContext.getRuntimeIdentifier( '$contract', true ) );
        let ref = Node.memberExpr(
            Node.memberExpr( id$contract, Node.identifier( 'memo' ) ),
            Node.literal( this.id ),
            true
        );
        this.composed = Node.assignmentExpr( ref, this.expr );
        return [ this.composed, this ];
    }

    toJson( filter = false ) {
        return {
            id: this.id,
        };
    }

}
