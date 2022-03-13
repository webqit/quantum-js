
/**
 * @imports
 */
import Reference from './Reference.js';
import SignalRef from './SignalRef.js';

export default class SignalReference extends Reference {

    addRef( def ) {
        let ref = new SignalRef( this, this.refs.size, {
            ...def,
            condition: this.condition,
        } );
        ref.push( ...this.propertyStack );
        this.refs.add( ref );
        return ref;
    }

    setAssignee( effectReference ) {
        this.assignee = effectReference;
    }

    toJson( filter = false ) {
        let json = super.toJson( filter );
        if ( this.assignee ) {
            json.assignee = this.assignee.id;
        }
        return json;
    }

}