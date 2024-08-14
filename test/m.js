
import { parse, compile } from '../src/compiler/index.js';

const expr = `
let t = 0;
for (t of g);
switch (3) {
    case 4:;
}
`;

switch (3) {
    case 4:;
}
const ast = parse(expr, { quantumMode: true });
const compiled = compile(ast);
console.log(ast);
console.log(compiled.compiledSource);