
export default class Common {

    constructor( id, def ) {
        this.id = id;
        Object.assign( this, def );
        this.dependencies = 0;
    }

    with( params, callback ) {
        let existing = {};
        Object.keys( params ).forEach( key => {
            existing[ key ] = this[ key ];
            this[ key ] = params[ key ];
        } );
        let result = callback();
        Object.keys( params ).forEach( key => {
            this[ key ] = existing[ key ];
        } );
        return result;
    }

    inUse( inUse ) {
        if ( !arguments.length ) {
            return this.dependencies > 0;
        }
        if ( inUse ) {
            this.dependencies ++;
        } else {
            this.dependencies --;
        }
        return this;
    }

}