
import { parse } from '../src/transformer/index.js';
import { compile, LiveFunction, LiveScript } from '../src/index.js';

let expr = `
    const t = function() {"use live"; return 3; };
    console.log('---------', t());
`;


expr = parse(expr, { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
const scr = new LiveScript(expr, { fileName: 'test.js' });
console.log(scr.toString(true));
scr.execute()
