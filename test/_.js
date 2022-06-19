
/**
 * @imports
 */
import { _parse, _generate, _serialize } from './driver.js';

let source = `
foo.bar[keyThatMightChange].property = value;
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

