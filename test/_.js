
/**
 * @imports
 */
import { _parse, _generate, _serialize } from './driver.js';
import { SubscriptFunction } from '../src/index.js';
globalThis.window = {};
let r = await import('../dist/main.js');
let rrr = window.WebQit.Subscript.SubscriptFunction;

let fn = new rrr('return 10 + 1');
console.log('-------------------------------------', fn(), rrr);

let source = `
let b = a && 1;
`;

let ast = _parse( source );
let gen = _generate( ast );

console.log( '>> Subscript Source' );
console.log( gen.source );
/**
console.log( '' );
console.log( '>> Dependency Graph' );
console.log( JSON.stringify( gen.graph, null, 4 ) );
 */

