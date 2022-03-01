
/**
 * @imports
 */
import Production from './Production.js';
import CauseRef from './CauseRef.js';

export default class CausesProduction extends Production {

    addRef( def ) {
        let ref = new CauseRef( this, this.refs.size, {
            ...def,
            test: this.test,
        } );
        ref.push( ...this.propertyStack );
        this.refs.add( ref );
        return ref;
    }

    setAssignee( mutation ) {
        this.assignee = mutation;
    }

    toJson( filter = false ) {
        let json = super.toJson( filter );
        if ( this.assignee ) {
            json.assignee = this.assignee.id;
        }
        return json;
    }

}