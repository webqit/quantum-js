export function resolveParams( ...extensions ) {
    let extension, params = { runtimeParams, transformerParams, parserParams };
    while( extension = extensions.shift() ) {
        const {
            runtimeParams: _runtimeParams = {},
            transformerParams: { globalsNoObserve: _globalsNoObserve = [], globalsOnlyPathsExcept: _globalsOnlyPathsExcept = [], ..._transformerParams } = {},
            parserParams: _parserParams = {},
        } = extension;
        params = {
            runtimeParams: { ...params.runtimeParams, ..._runtimeParams },
            transformerParams: { ...params.transformerParams, globalsNoObserve: [ ...params.transformerParams.globalsNoObserve, ..._globalsNoObserve ], globalsOnlyPathsExcept: [ ...params.transformerParams.globalsOnlyPathsExcept, ..._globalsOnlyPathsExcept ], ..._transformerParams },
            parserParams: { ...params.parserParams, ..._parserParams },
        };
        if ( extensions.devMode ) { /* shortcut for devMode configs */ }
    }
    return params;
}
export const parserParams = {
    ecmaVersion: 'latest',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: false,
    allowSuperOutsideMethod: false,
    preserveParens: false,
    locations: true,
};
export const transformerParams = {
    globalsNoObserve: [ 'arguments', 'debugger', ],
    globalsOnlyPathsExcept: [],
    originalSource: true,
    locations: true,
    compact: 2,
};
export const runtimeParams = {
    apiVersion: 3,
};
