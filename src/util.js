
export const _call = ( _function, ...args ) => {
    const callback = args.pop();
    if ( _function.constructor.name === 'AsyncFunction' ) return _await( _function.call( ...args ), callback );
    try {
        return callback( _function.call( ...args ) );
    } catch( e ) { return callback( undefined, e ); }
};

export const _await = ( maybePromise, callback ) => {
    return maybePromise instanceof Promise ? maybePromise.then( callback ).catch( e => callback( undefined, e ) ) : callback( maybePromise )
};

export const _isTypeObject = val => {
	return ( typeof val === 'object' && val ) || typeof val === 'function';
};

export function _$functionArgs( args ) {
    const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    const source = args.pop() || '';
    return { source, args, params };
}

export const env = {};


export function matchPrologDirective(str, strictStart = false) {
    if (strictStart) return /^(["'])use live\1\s*(;|$)/.test(str);
    return /(["'])use live\1\s*(;|$)/.test(str);
}

export function nextKeyword(input, start = 0, mode = null) {
    let i = start;
    const l = input.length;

    // Helper: skip whitespace
    const skipWS = () => {
        while (i < l && /\s/.test(input[i])) i++;
    };

    // Helper: skip line comment
    const skipLineComment = () => {
        i += 2;
        while (i < l && input[i] !== "\n" && input[i] !== "\r") i++;
    };

    // Helper: skip block comment
    const skipBlockComment = () => {
        i += 2;
        while (i < l && !(input[i] === "*" && input[i + 1] === "/")) i++;
        if (i < l) i += 2;
    };

    // Skip leading whitespace and comments
    while (i < l) {
        skipWS();

        if (input[i] === "/" && input[i + 1] === "/") {
            skipLineComment();
            continue;
        }
        if (input[i] === "/" && input[i + 1] === "*") {
            skipBlockComment();
            continue;
        }

        break;
    }

    // MODE 0: only skip, return new index
    if (mode === 0) return input.slice(i);

    // Extract identifier/keyword
    const startIdent = i;

    // Identifier must start with A-Za-z$_
    if (i < l && /[A-Za-z$_]/.test(input[i])) {
        i++;
        while (i < l && /[A-Za-z0-9$_]/.test(input[i])) i++;
        return input.slice(startIdent, i);
    }

    // If we reached here and mode = 1: return single next char OR null at EOF
    if (mode === 1 && i < l) {
        return input[i]; // return next non-skipped character
    }

    return null; // EOF
}