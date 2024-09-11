
import { parse, compile } from '../src/compiler/index.js';

const expr = `
try {
        console.log(',,,,,,,,,,,,,,,,', await r3());
    } catch(w) {
        console.info('An error happendd');
    }
`;


const ast = parse(expr, { sourceType: 'module', allowAwaitOutsideFunction: true, executionMode: 'QuantumProgram' });
const compiled = compile(ast);
//console.log(ast);
console.log(compiled.compiledSource);