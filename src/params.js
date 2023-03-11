
/**
 * @exports
 */
export function resolveParams( extensions = {} ) {
    const params = {
        runtimeParams: { ...runtimeParams, ...( extensions.runtimeParams || {} ) },
        compilerParams: { ...compilerParams, ...( extensions.compilerParams || {} ) },
        parserParams: { ...parserParams, ...( extensions.parserParams || {} ) },
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
