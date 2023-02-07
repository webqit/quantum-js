
/**
 * @imports
 */
import { SubscriptFunction } from '../src/index.js';
import Observer from '../../observer/src/index.js';

// -----------
let source = `
/*
*/

for ( let propertyName in entries ) {
	console.log( \`Current property name is: \${ propertyName }, and its alias name is: '\${ entries[ propertyName ].name }'\` );
	console.log( ':::::::::::', targetEntries[ propertyName ] = entries[ propertyName ] );
}

console.log( '-----------------------------------------------' );

let sum = async function sum( param_1, param_2 ) {
    return param_1 + (await param_2);
}

let l = list1;
let propName = 'length';
if ( 3 ) {
    let { [ propName ]: length } = 1 ? l : 4;
    console.log( 'List1s length is:', length );
}

console.log( '-----------------------------------------------' );

for ( let num of list1 ) {
    if ( num === 'four' ) break;
    console.log( 'item', num );
}

console.log( '-----------------------------------------------' );

top: {
    l1: for ( let item1 of list1 ) {
        for ( let item2 of list2 ) {
            if ( item2 === 'four' ) continue l1;
            if ( item1 === 'four') break top;
            console.log( 'item pair:', item1, item2 );
        }
    }
}

console.log( '-----------------------------------------------' );

switch( funcTrigger ) {
    case 'sum':
        return sum( funcParam1, funcParam2 );
    default:
        console.log( 'the end!' )
}
`;


SubscriptFunction.compilerParams.globalsNoObserve.push( 'console' );
let subscriptFunction = new SubscriptFunction( 'funcTrigger', 'funcParam1', 'funcParam2', source );
Observer.observe( globalThis, mutations => {
    subscriptFunction.thread( ...mutations.map( mu => mu.path ) );
}, { subtree: true } );

console.log( '.....................sideEffects', subscriptFunction.sideEffects );

globalThis.targetEntries = {};
globalThis.entries = { one: { name: 'one' }, two: { name: 'two' } };
Observer.link( globalThis, 'entries', entries );
setTimeout(() => {
    entries[ 'one' ] = { name: 'New one' };
    subscriptFunction.thread( [ 'entries', 'one', 'name' ] );
}, 4000);

globalThis.list1 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
globalThis.list2 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
Observer.link( globalThis, 'list1', list1 );
Observer.link( globalThis, 'list2', list2 );
setTimeout(() => {
    Observer.set( list1, 0, 'new one' );
}, 4500);

console.log('');
let result = subscriptFunction( 'sum', '55', '55' );
console.log( '---result---->', await result );
setTimeout(async () => {
    console.log( '---thread---->', await subscriptFunction.thread( [ 'funcParam2' ] ) );
}, 5000);
console.log('');
console.log('--------------------------------------------------');
console.log('');
//0console.log( JSON.stringify( subscriptFunction.runtime.graph, null, 3 ) );
console.log('');
console.log('--------------------------------------------------');
console.log('');
//console.log( subscriptFunction.originalSource );
console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( subscriptFunction.subscriptSource );
console.log('');
console.log('--------------------------------------------------');
console.log('');

