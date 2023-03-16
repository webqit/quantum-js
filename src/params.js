
/**
 * @exports
 */
export function resolveParams( extensions = {} ) {
    const {
        runtimeParams: _runtimeParams = {},
        compilerParams: { globalsNoObserve = [], globalsOnlyPathsExcept = [], ..._compilerParams } = {},
        parserParams: _parserParams = {},
    } = extensions;
    const params = {
        runtimeParams: { ...runtimeParams, ..._runtimeParams },
        compilerParams: { ...compilerParams, globalsNoObserve: [ ...compilerParams.globalsNoObserve, ...globalsNoObserve ], globalsOnlyPathsExcept: [ ...compilerParams.globalsOnlyPathsExcept, ...globalsOnlyPathsExcept ], ..._compilerParams },
        parserParams: { ...parserParams, ..._parserParams },
    };
    if ( extensions.devMode ) { /* shortcut for devMode configs */ }
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
    globalsNoObserve: [ 'globalThis', 'arguments', 'console', 'debugger', ],
    globalsOnlyPathsExcept: [],
    originalSource: true,
    locations: true,
    compact: 2,
};
export const runtimeParams = {
    apiVersion: 1,
};
