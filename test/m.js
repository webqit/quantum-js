
import { parse, compile } from '../src/compiler/index.js';

const expr = `
function ** m() {
            let items = [1, 2, 4];
            label: for (let i of items) {
                if (i === 4)
                continue label;
                console.log(':::', i, items);
            }
            (() => console.log(items, '>>>>>>>>>>>>'))();
        }
        console.log(m+':::');
        m();
`;


const ast = parse(expr, { quantumMode: true });
const compiled = compile(ast);
console.log(ast);
console.log(compiled.compiledSource);