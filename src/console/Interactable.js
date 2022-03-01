
/**
 * @Path
 */
export default Interactable => class extends ( Interactable || class {} ) {

    setStateCallback( type, state, value, duration = 100, callback ) {
        if ( !this._timeouts ) {
            this._timeouts = {};
        }
        if ( !( type in this._timeouts ) ) {
            this._timeouts[ type ] = [];
        }
        if ( value ) {
            if ( !this._timeouts[ type ].length ) {
                callback();
            }
            if ( duration ) {
                this._timeouts[ type ].unshift( setTimeout( () => this.setState( type, state, false ), duration ) );
            } else {
                this._timeouts[ type ].unshift( null );
            }
            if ( this._related ) {
                this._related.setState( type, state, true, duration );
            }
        } else {
            this._timeouts[ type ].shift();
            if ( !this._timeouts[ type ].length ) {
                callback();
                if ( this._related ) {
                    this._related.setState( type, state, false );
                }
            }
        }
    }

}