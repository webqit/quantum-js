
import { _await } from '../util.js';
import { resolveParams } from '../params.js';
import Node from '../transformer/Node.js';
import Runtime from './Runtime.js';
import Scope from './Scope.js';

export { Scope, Runtime }; // IMPORTANT: export Scope and Runtime for use in the bootstrap source

/**
 * Evaluates a given source code of a certain type.
 * The sourceType can be:
 * - function | function-source | function-file | function-source-file: a source code of a function to be returned (sync)
 * - async-function | async-function-source | async-function-file | async-function-source-file: a source code of an async function to be returned (async)
 * - script | script-file: a source code of a script to be executed (sync)
 * - async-script | async-script-file: a source code of an async script to be executed (async)
 * - module | module-file: a source code of a module to be executed (async)
 * @param {string} sourceType - the type of the source code
 * @param {object} astTools - the callback function to parse and compile the source code
 * @param {string} source - the source code to be evaluated
 * @param {Array} functionParams - the parameters of the function (for function and async-function types)
 * @param {Object} params - additional parameters to be passed to the compile and runtime
 * @returns {Promise} a promise that resolves to the result of the evaluation
 */
export function compile(sourceType, astTools, source, functionParams = [], params = {}) {
    if (typeof functionParams === 'object' && functionParams && !Array.isArray(functionParams)) {
        params = functionParams;
        functionParams = [];
    }

    const { liveMode = true, thisContext, env, exportNamespace, fileName, base64, compileFunction, forDynamicBinding = false, ...$params } = params;
    const { parserParams, transformerParams, runtimeParams } = resolveParams($params);

    const isModule = /module/.test(sourceType);
    const isScript = /script/.test(sourceType);
    const isFunction = /function/.test(sourceType);
    const isAsync = /async/.test(sourceType) || /module/.test(sourceType);
    const isAsyncScript = isModule || isAsync && !isFunction;
    const isSource = /source/.test(sourceType);
    const isFile = /file/.test(sourceType);

    const sourceIsProgram = typeof source === 'object' && source?.type === 'Program';
    const originalProgram = source;

    if (isModule) {
        parserParams.sourceType = 'module';
        parserParams.allowAwaitOutsideFunction = true;
        parserParams.executionMode = liveMode ? 'LiveProgram' : 'RegularProgram';
    } else if (isScript) {
        parserParams.executionMode = liveMode ? 'LiveProgram' : 'RegularProgram';
    } else if (isFunction) {
        if (isSource) {
            if (sourceIsProgram) {
                source = Node.funcExpr(
                    null,
                    functionParams.map((param) => Node.identifier(param)),
                    Node.blockStmt(liveMode ? [Node.literal('use live'), ...source.body] : source.body),
                    isAsync
                );
                // IMPORTANT
                source.isLiveFunction = originalProgram.isLiveProgram;
            } else {
                // Derive the actual live function
                const body = `  ` + source.split(`\n`).join(`\n  `);
                source = `${isAsync ? 'async function' : 'function'
                    }(${functionParams.join(', ')}) {\n${liveMode ? '  "use live";\n' : ''}${body}\n}`;
            }
        } else if (sourceIsProgram) {
            source = source.body[0];
        }
        // The top-level program becomes a simple return statement
        if (sourceIsProgram) {
            source = {
                type: 'Program',
                body: [Node.returnStmt(source)],
                start: originalProgram.start,
                end: originalProgram.end,
                hasLiveFunctions: originalProgram.hasLiveFunctions,
                originalSource: originalProgram.originalSource
            };
        } else {
            source = `return ${source}`;
        }
        // This return shouldn't be treated as live
        parserParams.executionMode = 'RegularProgram';
    } else {
        throw new Error(`Unrecognized sourceType specified: "${sourceType}".`);
    }

    const $sourceType = isModule ? 'module' : (isScript ? 'script' : 'function');
    const $base64 = isModule && isFile && base64 && `export default async function(%0) {%1}`;

    transformerParams.sourceType = $sourceType;
    transformerParams.base64 = $base64;
    runtimeParams.sourceType = $sourceType;
    runtimeParams.fileName = fileName;
    if (isModule) {
        runtimeParams.exportNamespace = exportNamespace;
    }

    const transformResult = astTools.transform(source, { ...parserParams, ...transformerParams, astResult: sourceIsProgram });

    function finalBootstrapSource(bootstrapSource, forceStringify = false) {
        const result = bootstrapSource.join('\n');
        if (sourceIsProgram) {
            return _await(astTools.parse(result, parserParams), (result) => {
                // Find the main function...
                const insertionPoint = result.body.find((m) => {
                    return m.type === `ExpressionStatement`
                        && m.expression?.type === 'AssignmentExpression'
                        && m.expression.left.type === 'MemberExpression'
                        && m.expression.left.object.type === 'Identifier'
                        && m.expression.left.property.type === 'Identifier'
                        && m.expression.left.property.name === 'main'
                        && m.expression.right.type === 'FunctionExpression';
                }).expression.right.body; // BlockStatement
                insertionPoint.body.push(...transformResult.transformedSource.body);
                // Force serilaize?
                return forceStringify
                    ? _await(result, (result) => astTools.serialize(result))
                    : result;
            });
        }
        return result;
    }

    return _await(transformResult, (transformResult) => {
        if (!transformResult) return;

        const bootstrapSource = [];
        const $q2 = transformResult.identifier2;

        // 1. ---- Bootstrap $$cx
        let $$cx;
        if (isFile) {
            bootstrapSource.push(`const { Scope, Runtime } = await import('${importDir}/index.js');`);
            bootstrapSource.push(`const ${$q2} = { Scope, Runtime, params: { ...(${JSON.stringify(runtimeParams)}), executionMode: '${transformResult.isLiveProgram && 'LiveProgram' || 'RegularProgram'}', originalSource: \`${transformResult.originalSource.replace(/`/g, '\\`')}\`, }, };`);
        } else {
            $$cx = {
                Scope,
                Runtime,
                params: { ...runtimeParams, originalSource: transformResult.originalSource, executionMode: transformResult.isLiveProgram && 'LiveProgram' || 'RegularProgram' },
                thisContext: thisContext,
                env: env
            };
        }

        // 2. ---- main function
        bootstrapSource.push(`${$q2}.main = ${isModule ? 'async ' : ''
            }function(${transformResult.identifier}) {${sourceIsProgram ? '' : `\n  ${transformResult.transformedSource.replace(/\n/g, '\n  ')}\n`
            }};`);
        // 3.a ---- global scope
        let contextType = 'global';
        bootstrapSource.push(`${$q2}.scope = new ${$q2}.Scope(undefined, '${contextType}', globalThis);`);
        // 3.b ---- env scope
        if (isScript || $$cx?.env/** even module */ || ($$cx && forDynamicBinding)) {
            contextType = 'env';
            bootstrapSource.push(`${$q2}.scope = new ${$q2}.Scope(${$q2}.scope, '${contextType}', ${$q2}.env);`);
        }
        // 3.c ---- module scope
        if (isModule) {
            contextType = 'module';
            bootstrapSource.push(`${$q2}.scope = new ${$q2}.Scope(${$q2}.scope, '${contextType}');`);
        }
        // 3.d ---- this scope
        if (typeof $$cx?.thisContext !== 'undefined' || ($$cx && forDynamicBinding)) {
            bootstrapSource.push(`${$q2}.scope = new ${$q2}.Scope(${$q2}.scope, 'this', { ['this']: ${$q2}.thisContext });`);
        }

        // 4. ---- Runtime
        bootstrapSource.push(`${$q2}.runtime = new ${$q2}.Runtime(undefined, '${contextType}', ${$q2}.params, ${$q2}.scope, ${$q2}.main);`);

        // 5. ---- The bootstrap source
        if (isModule && isFile) {
            bootstrapSource.push(`${$q2}.result = await ${$q2}.runtime.execute();`);
            const [_default, exports] = transformResult.exportIds.reduce(([, acc], id) => {
                if (id === 'default') return [id, acc];
                return [, acc.concat(id)];
            }, [null, []]);
            if (exports.length) bootstrapSource.push(`export const { ${exports.join(', ')} } = ${$q2}.result.exports;`);
            if (_default) bootstrapSource.push(`export default ${$q2}.result.exports.default;`);
            return finalBootstrapSource(bootstrapSource);
        }
        if (isFile) {
            bootstrapSource.push(`${$q2}.result = ${$q2}.runtime.execute();`);
            if (isFunction) {
                bootstrapSource.push(`return ${$q2}.result;`);
            }
            return finalBootstrapSource(bootstrapSource);
        }
        bootstrapSource.push(isFunction ? `return ${$q2}.runtime.execute();` : `return ${$q2}.runtime;`);
        const result = finalBootstrapSource(bootstrapSource, true);
        // 6. ---- Compile
        const fn = compileFunction || Function;
        return _await(result, (result) => forDynamicBinding ? [fn($q2, result), $$cx] : fn($q2, result)($$cx));
    });
}

// --- helpers ---

const importDir = fileURLToDirname(import.meta.url);

function fileURLToDirname(url) {
    const path = fileURLToPath(url);
    return dirname(path);
}

function fileURLToPath(url) {
    if (typeof url !== 'string') throw new TypeError('URL must be a string');
    if (!url.startsWith('file://')) return url; // already a path

    let path = url.slice('file://'.length);

    // Handle Windows drive letters: /C:/ → C:/
    path = path.replace(/^\/([A-Za-z]:)/, '$1');

    // Decode URL-encoded chars
    path = decodeURIComponent(path);

    return path;
}

function dirname(path) {
    if (typeof path !== 'string') throw new TypeError('path must be a string');

    // Normalize separators for cross-platform handling
    const slash = path.includes('\\') ? '\\' : '/';

    const idx = path.lastIndexOf(slash);
    if (idx === -1) return path; // no slash found (not really a path)
    if (idx === 0) return slash; // root case

    return path.slice(0, idx);
}
