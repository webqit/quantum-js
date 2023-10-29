/**
 * @imports
 */
import $fIdentifier from "./$fIdentifier.js";
import Node from './Node.js';

/**
 * @Scope
 */
export default class Scope {

    constructor( context, { type } ) {
        this.context = context;
        Object.assign( this, { type } );
        this.vars = new Set;
        this.$fIdentifiers = new Map;
        this.$fIdentifiersCursors = { ...( this.context?.$fIdentifiersCursors || {} ) };
        this.locations = [];
    }

    index( node, withLineColumn = false ) {
        if ( !this.type.includes( 'Function' ) && this.context ) return this.context.index( ...arguments );
        const locations = [ 'start', 'end' ].map( offset => {
            const elements = [ Node.literal( node[ offset ] ) ];
            if ( withLineColumn && node.loc ) {
                elements.push( Node.literal( node.loc[ offset ].line ) );
                elements.push( Node.literal( node.loc[ offset ].column ) );
            }
            return Node.arrayExpr( elements );
        } );
        this.locations.push( Node.arrayExpr( locations ) );
        return Node.literal( this.locations.length - 1 );
    }

    get$fIdentifier( name, globally = true, random = false ) {
        let identifer = this.$fIdentifiers.get( name );
        if ( !identifer ) {
            if ( globally && this.context ) return this.context.get$fIdentifier( name, globally );
            if ( random ) {
                if ( typeof this.$fIdentifiersCursors[ name ] === 'undefined' ) { this.$fIdentifiersCursors[ name ] = 0; }
                name += ( this.$fIdentifiersCursors[ name ] ++ );
            }
            this.$fIdentifiers.set( name, identifer = new $fIdentifier( name ) );
        }
        return identifer;
    }

    getRandomIdentifier( name, globally = true ) {
        return this.get$fIdentifier( name, globally, true );
    }

    $fIdentifiersNoConflict( name ) {
        for ( let [ , identifer ] of this.$fIdentifiers ) { identifer.noConflict( name );  }
        this.context && this.context.$fIdentifiersNoConflict( name );
    }

    push( identifier, type, willUpdate = false ) {
        let def;
        if ( [ 'var', 'update' ].includes( type ) && ( def = this.find( identifier, false ) ) && def.type !== 'const' ) {
            def.willUpdate = true;
        } else if ( type !== 'update' || !this.context ) {
            if ( !( identifier instanceof $fIdentifier ) ) {
                this.$fIdentifiersNoConflict( identifier.name + '' );
            }
            this.vars.add( { identifier, type, willUpdate: willUpdate || type === 'update' } );
        }
        if ( this.context && ( type === 'update' || ( type === 'var' && !this.type.includes( 'Function' ) ) ) ) {
            return this.context.push( identifier, type );
        }
        return true;
    }

    find( identifier, globally = true ) {
        let def;
        for ( const _var of this.vars ) {
            if ( _var.identifier.name + '' === identifier.name + '' ) { def = _var; break; }
        }
        if ( !def && globally ) return this.context?.find( identifier, globally );
        return def;
    }

}
