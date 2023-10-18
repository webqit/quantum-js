
export default class $fIdentifier {

    type = 'Identifier';
    whitelist = [];
    blacklist = [];

    constructor( name ) {
        this.whitelist[ 0 ] = name;
    }

    get name() { return this.whitelist[ 0 ]; }

    noConflict( name ) {
        const i = this.whitelist.indexOf( name );
        if ( i === -1 ) return false;
        this.blacklist.push( this.whitelist.splice( i, 1 ) );
        if ( !this.whitelist.length ) {
            this.whitelist = this.blacklist.map( name => {
                let newVar;
                do {
                    let randChar = String.fromCharCode( 0 | Math.random() *26 +97 );
                    newVar = `${ name }${ randChar }`;
                } while ( this.blacklist.includes( newVar ) );
                return newVar;
            });
        }
    }

}