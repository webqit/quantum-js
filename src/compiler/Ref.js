
/**
 * @imports
 */
import Common from './Common.js';
import Memo from './Memo.js';

export default class Ref extends Common {

    constructor( ownerReference, id, def ) {
        super( id, def );
        this.ownerReference = ownerReference;
        this.condition = this.ownerUnit.currentCondition;
        this.path = [];
        this.isDotSafe = true;
    }

    get ownerUnit() {
        return this.ownerReference.ownerUnit;
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
        if ( identifiers.some( identifier => ( identifier instanceof Memo ) || ( identifier.name + '' ).includes( '.' ) ) ) {
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
            condition: ( this.condition || {} ).lineage,
            referenceId: this.ownerReference.id,
        }
    }

}