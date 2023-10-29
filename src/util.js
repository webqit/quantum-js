
export const _call = ( _function, ...args ) => {
    const callback = args.pop();
    if ( _function.constructor.name === 'AsyncFunction' ) return _await( _function.call( ...args ), callback );
    return callback( _function.call( ...args ) );
};

export const _await = ( maybePromise, callback ) => {
    return maybePromise instanceof Promise ? maybePromise.then( callback ) : callback( maybePromise )
};

export const _isTypeObject = val => {
	return ( typeof val === 'object' && val ) || typeof val === 'function';
};

export function _$functionArgs( args ) {
    const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    const source = args.pop() || '';
    params.functionParams = args;
    return { source, params };
}

export const other = {};
