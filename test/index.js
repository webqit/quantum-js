
/**
 * @imports
 */
import { expect } from 'chai';
import Subscript from '../src/index.js';
import Observer from '../../observer/src/index.js';

// -----------
let source2 = `

for ( let propertyName in entries ) {
	console.log( \`Current property name is: \${ propertyName }, and its alias name is: '\${ entries[ propertyName ].name }'\` );
	console.log( ':::::::::::', targetEntries[ propertyName ] = entries[ propertyName ] );
}

console.log( '-----------------------------------------------' );

let l = list1;
let v = 'length';
if ( 3 ) {
    let { [ v ]: length } = 1 ? l : 4;
    console.log( 'List1s length is:', length );
}
for ( let num of list1 ) {
    if ( num === 'four' ) break;
    console.log( 'item', num );
}
top: {
    l1: for ( let item1 of list1 ) {
        for ( let item2 of list2 ) {
            if ( item2 === 'four' ) continue l1;
            if ( item1 === 'four') break top;
            console.log( 'item pair:', item1, item2 );
        }
    }
}
switch( param3 ) {
    case 2:
        return param1 + param2;
    default:
        console.log( 'the end!' )
}
`;

let subscriptFunction = new Subscript( 'param1', 'param2', 'param3', source2 );
// -----------
globalThis.globe = 'Hey Globals';
globalThis.tests = { a: true, b: false };
globalThis.document = { state: { title: 'Hello from Subscript!' }, head: { meta1: 'Meta prop1' } };
globalThis.list1 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
globalThis.list2 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
globalThis.entries = { one: { name: 'one' }, two: { name: 'two' } };
globalThis.targetEntries = {};

Observer.link( globalThis, 'tests', tests );
Observer.link( globalThis, 'document', document );
Observer.link( globalThis, 'list1', list1 );
Observer.link( globalThis, 'list2', list2 );
Observer.link( globalThis, 'entries', entries );

Observer.observe( globalThis, mutations => {
    subscriptFunction.signal( ...mutations.map( mu => mu.path ) );
}, { subtree: true } );

console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( JSON.stringify( subscriptFunction.runtime.graph, null, 3 ) );
console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( subscriptFunction.toString() );
console.log('');
console.log('--------------------------------------------------');
console.log('');

let result = subscriptFunction( 'Some param1', 'Some param2', 2 );
console.log( '+++++', result );

setTimeout(() => {
    entries[ 'one' ] = { name: 'New one' };
    subscriptFunction.signal( [ 'entries', 'one', 'name' ] );

    Observer.proxy( list1 ).push( 'eleven' );
    /*
    //Observer.set( globalThis.document, 'title', {} );
    //Observer.set( globalThis, 'globe', {} );
    Observer.set( globalThis.tests, 'b', true );
    setTimeout(() => {
        //Observer.set( globalThis.document, 'title', {} );
        //Observer.set( globalThis, 'globe', {} );
        //Observer.set( globalThis.document, 'state', { title: 'NEW document title' } );
        Observer.set( globalThis, 'tests', tests );
        return;
        setTimeout(() => {
            Observer.set( list, 0, 'new one' );
        }, 4000);
    }, 4000);
    */
}, 4000);
