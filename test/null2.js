
/**
 * @imports
 */
import ContractFunction from '../src/ContractFunction.js';

// -----------
let source = `
const a = b;
let d;
d = 4;
`;
// -----------
let source2 = `
const b = a ? b.y[ k ].oo : 3;
console.log( 'llll', await arguments );
`;

const fn = ContractFunction( 'c', source2, { runtimeParams: { apiVersion: 1, async: true } } );
console.log('');
console.log('--------------------------------------------------', ContractFunction.inspect( fn, 'properties' ) );
//console.log( '------', fn.toString(true) );
//console.log('--------------------------------------------------', JSON.stringify( fn.runtime.graph, null, 2 ) );
console.log('');