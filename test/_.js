
/**
 * @imports
 */
import { _parse, _generate, _serialize, ReflexFunction } from './driver.js';

let source = `
let profileProp = 'avatar';
let profile = candidate.profile[ profileProp ];
`;

let ast = _parse( source );
let gen = _generate( ast );

console.log( '>> Reflex Source' );
console.log( gen.source );
console.log( '' );
console.log( '>> Dependency Graph' );
console.log( JSON.stringify( gen.graph, null, 4 ) );

/**
*/

let demo = ReflexFunction(`
let profileProp = 'avatar';
let avatarUrl = candidate.profile[ profileProp ];
`);

console.log(ReflexFunction.inspect(demo));