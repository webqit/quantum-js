
/**
 * @exports
 */
export function resolveParams( ...extensions ) {
    let params = { runtimeParams, compilerParams, parserParams }, extension;
    while( extension = extensions.shift() ) {
        const {
            runtimeParams: _runtimeParams = {},
            compilerParams: { globalsNoObserve: _globalsNoObserve = [], globalsOnlyPathsExcept: _globalsOnlyPathsExcept = [], ..._compilerParams } = {},
            parserParams: _parserParams = {},
        } = extension;
        params = {
            runtimeParams: { ...params.runtimeParams, ..._runtimeParams },
            compilerParams: { ...params.compilerParams, globalsNoObserve: [ ...params.compilerParams.globalsNoObserve, ..._globalsNoObserve ], globalsOnlyPathsExcept: [ ...params.compilerParams.globalsOnlyPathsExcept, ..._globalsOnlyPathsExcept ], ..._compilerParams },
            parserParams: { ...params.parserParams, ..._parserParams },
        };
        if ( extensions.devMode ) { /* shortcut for devMode configs */ }
    }
    return params;
}
export const parserParams = {
    ecmaVersion: '2020',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowSuperOutsideMethod: true,
    preserveParens: false,
    locations: false,
};
export const compilerParams = {
    globalsNoObserve: [ 'arguments', 'debugger', ],
    globalsOnlyPathsExcept: [],
    originalSource: true,
    locations: true,
    compact: 2,
};
export const runtimeParams = {
    apiVersion: 2,
};
