
import { parse, compile } from '../src/compiler/index.js';

const expr = `
let t = 0;
        for (t of [2,4,6,8,10]) {}
`;


const ast = parse(expr, { quantumMode: true });
const compiled = compile(ast);
console.log(ast);
console.log(compiled.compiledSource);