
/**
 * @imports
 */
import { SubscriptFunction } from '../src/index.js';
import Observer from '../../observer/src/index.js';

// -----------
let source2 = `
/*
*/

for ( let propertyName in entries ) {
	console.log( \`Current property name is: \${ propertyName }, and its alias name is: '\${ entries[ propertyName ].name }'\` );
	console.log( ':::::::::::', targetEntries[ propertyName ] = entries[ propertyName ] );
}

console.log( '-----------------------------------------------' );

let l = list1;
let v = 'length';
let sum = async function** sum( param_1, param_2 ) {
    return param_1 + await param_2;
}
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
    case 'sum':
        return sum( param1, param2 );
    default:
        console.log( 'the end!' )
}
`;

let source3 = `
let count = 10, doubleCount = count * 2, quadCount = doubleCount * 2;
//console.log( count, doubleCount, quadCount );
`;

globalThis.a = '';


let source4 = `
let app = document.state;
                        $(this.namespace.error).html(app.network?.error ? (app.network?.online ? 'Network Error - ' : "You're Offline - ") + app.network?.error : '404 - Not Found!');

`;

globalThis.d = undefined;


SubscriptFunction.compilerParams.globalsNoObserve.push( 'console' );
let subscriptFunction = new SubscriptFunction( 'param1', 'param2', 'param3', source4 );
console.log( '.....................sideEffects', subscriptFunction.sideEffects );
// -----------
globalThis.someState = false;
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
    subscriptFunction.thread( ...mutations.map( mu => mu.path ) );
}, { subtree: true } );

console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( JSON.stringify( subscriptFunction.runtime.graph, null, 3 ) );
console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( subscriptFunction.originalSource );
console.log('');
console.log('--------------------------------------------------');
console.log('');
console.log( subscriptFunction.subscriptSource );
console.log('');
console.log('--------------------------------------------------');
console.log('');

//process.exit();

let result;// = subscriptFunction( '55', '55', 'sum' );
console.log( '------->', result );

setTimeout(() => {
    //someState = true;
    //console.log( '------->', subscriptFunction.thread( [ 'someState' ] ) );
    entries[ 'one' ] = { name: 'New one' };
    subscriptFunction.thread( [ 'entries', 'one', 'name' ] );

    /*
    Observer.proxy( list1 ).push( 'eleven' );
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
