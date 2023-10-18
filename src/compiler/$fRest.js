import Node from "./Node.js";

export default class $fRest {

    type = 'BlockStatement';
    $body = [];
    
    constructor( nodes ) { this.body = nodes; }

    get body() { return this.$body; }
    set body( nodes ) {
        this.$body = nodes;
        Node.withLoc( this, ...nodes );
    }

}