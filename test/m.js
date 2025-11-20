
import { parse } from '../src/transformer/index.js';
import { compile, LiveFunction, LiveScript } from '../src/index.js';

let expr = `
try {
        console.log(',,,,,,,,,,,,,,,,', await r3());
    } catch(w) {
        console.info('An error happendd');
    }
`;


expr = `
// lll
"use live";
let $rand0 = live /*d*/ ($2kk) => {}
`;

expr = `
console.log(3 + 4, this);
`;


expr = parse(expr, { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });


const compiled2 = (compile('function-source', expr, ['a', 'b'], { fileName: 'test.js' }));
console.log(compiled2.call(33));

console.log(LiveFunction('a', 'b', expr, { fileName: 'test.js' }).call(44));

console.log((new LiveScript(expr, { fileName: 'test.js' })).bind(55).execute());
