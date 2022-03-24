
/**
 * @imports
 */
import { _parse, _generate, _serialize } from './driver.js';

let source = `
let b = a && 1;
`;

let ast = _parse( source );
let gen = _generate( ast );

console.log( gen.source );

