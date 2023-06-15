
/**
 * @imports
 */
import { _parse, _generate, _serialize } from './driver.js';

let source = `
const aaa = 2;
let ccc = e;
let ddddd = 2;
`;

let ast = _parse( source );
let gen = _generate( ast );

console.log( '>> Contract Source' );
console.log( gen.source );
console.log( '' );
console.log( '>> Dependency Graph' );
console.log( JSON.stringify( gen.graph, null, 4 ) );
/**
 */

