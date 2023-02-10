
/**
 * @exports
 */
export function resolveParams( extensions = {} ) {
    return {
        runtimeParams: { ...runtimeParams, ...( extensions.runtimeParams || {} ) },
        compilerParams: { ...compilerParams, ...( extensions.compilerParams || {} ) },
        parserParams: { ...parserParams, ...( extensions.parserParams || {} ) },
    }
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
    globalsNoObserve: [ 'globalThis', 'arguments', 'console', ],
    originalSource: true,
    globalsOnlyPaths: false,
    locations: true,
    compact: 2,
};
export const runtimeParams = {
    apiVersion: 1,
};
