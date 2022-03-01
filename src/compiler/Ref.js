
/**
 * @imports
 */
import Node from './Node.js';
import Memo from './Memo.js';

export default class Ref extends Node {

    constructor( ownerProduction, id, def ) {
        super( id, def );
        this.ownerProduction = ownerProduction;
        this.test = this.ownerEffect.currentCondition;
        this.path = [];
        this.isDotSafe = true;
    }

    get ownerEffect() {
        return this.ownerProduction.ownerEffect;
    }

    push( ...identifiers ) {
        this.doIsDotSafe( identifiers );
        this.path.push( ...identifiers );
        return this;
    }

    unshift( ...identifiers ) {
        this.doIsDotSafe( identifiers );
        this.path.unshift( ...identifiers );
        return this;
    }

    doIsDotSafe( identifiers ) {
        if ( identifiers.some( identifier => ( identifier instanceof Memo ) || identifier.name.includes( '.' ) ) ) {
            this.isDotSafe = false;
        }
    }

    match( ref ) {
        let compareIdentifiers = ( a, b ) => !a || !b ? false : ( ( a instanceof Memo ) && ( b instanceof Memo ) ? a.id === b.id : a.name === b.name );
        let pathA = this.path,
            pathB = Array.isArray( ref ) ? ref : ref.path;
        let remainder = pathA.length - pathB.length;
        if ( remainder > 0 ) {
            [ pathA, pathB ] = [ pathB, pathA ];
        }
        return [
            pathA.reduce( ( prev, identifier, i ) => prev && compareIdentifiers( identifier, pathB[ i ] ), true ),
            remainder,
        ];
    }

    toJson( filter = false ) {
        return {
            id: this.id,
            path: this.path.map( identifier => identifier instanceof Memo ? { memoId: identifier.id } : identifier ),
            $path: this.isDotSafe ? this.path.map( identifier => identifier.name ).join( '.' ) : undefined,
            conditionId: ( this.test || {} ).id,
            productionId: this.ownerProduction.id,
        }
    }

}