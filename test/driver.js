
/**
 * @imports
 */
import { expect } from 'chai';
import { Compiler } from '../src/index.js';
import * as Acorn from 'acorn';

const _jsonfy = ast => JSON.parse(JSON.stringify(ast));
const _parse = source => Acorn.parse(source, {
    ecmaVersion: 'latest',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowSuperOutsideMethod: true,
    preserveParens: false,
});
// Compiler is instantiated each time to have a clean state
let compiler;
const _transform = ast => (compiler = new Compiler).transform(ast);
const _serialize = (ast, params) => compiler.serialize(ast, params);

const tests = [];

export function empty() {
    tests.splice(0);
}

export function run() {
    for (let test of tests) {
        it(test.desc, function() {
            // Test
            let ast = _parse(test.source);
            let gen = _transform(ast);
            // Expected
            let genFormatted, expFormatted;
            if (typeof test.expected === 'string') {
                // How many spaces make an indent? 4
                let indentSpaces = `    `;
                // What's the indentation of expected string?
                let expIndentSpaceCount = test.expected.split(/[^\s]/)[0].length - (test.expected.startsWith(`\n`) ? 1 : 0);
                genFormatted = _serialize(gen, {
                    indent: indentSpaces,
                    startingIndentLevel: expIndentSpaceCount / 4
                }).trim();
                expFormatted = test.expected.trim();
            } else {
                genFormatted = _jsonfy(gen);
                expFormatted = test.expected;
            }
            expect(genFormatted).to.eq(expFormatted);
        });
    }
}

export function add(desc, source, expected, options = {}) {
  tests.push({ desc, source, expected, options });
}

export function group(desc, callback) {
    describe(desc, function() {
        empty();
        callback();
        run();
    });
}
