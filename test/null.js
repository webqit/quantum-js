
/**
 * @imports
 */
import SubscriptFunction from '../src/SubscriptFunction.js';
import Observer from '../../observer/src/index.js';

// -----------
let source = `
/*
*/


for ( let propertyName in entries ) {
	console.log( \`Current property name is: \${ propertyName }, and its alias name is: '\${ entries[ propertyName ].name }'\` );
	console.log( ':::::::::::', targetEntries[ propertyName ] = entries[ propertyName ] );
}

//const ff = console.log( '-----------------<<--->>---------------------------', arguments );
console.log( '-----------------------------------------------' );
function fun0(a, b) {
}

let fun00 = (a) => {a};

let sumCount = 0;
let sum = async function sum( $x, param_2 ) {
    sumCount ++;
    if ( Array ) {
        
    }
    return $x + (await param_2);
}

console.log( '-------------------->>---------------------------', fun0.length, fun0.toString() );
console.log( '-----------------------------------------------' );

let l = list1;
let propName = 'length';
if ( 3 ) {
    let { [ propName ]: length } = 1 ? l : 4;
    console.log( 'List1s length is:', length );
}


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
        let result = sum( funcParam1, funcParam2 );
        console.log( 'sumCount', sumCount );
        return result;
    default:
        console.log( 'the end!' )
}
`;


//SubscriptFunction.compilerParams.globalsNoObserve.push( 'console' );
const subscriptFunction = new SubscriptFunction( 'funcTrigger', 'funcParam1', 'funcParam2', source, { runtimeParams: { apiVersion: 2 } } );
Observer.observe( globalThis, mutations => {
    sync( ...mutations.map( mu => mu.path ) );
}, { subtree: true } );

console.log( '.....................sideEffects', subscriptFunction.sideEffects );

globalThis.targetEntries = {};
globalThis.entries = { one: { name: 'one' }, two: { name: 'two' } };
Observer.link( globalThis, 'entries', entries );
setTimeout(() => {
    entries[ 'one' ] = { name: 'New one' };
    sync( [ 'entries', 'one', 'name' ] );
}, 4000);

globalThis.list1 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
globalThis.list2 = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
Observer.link( globalThis, 'list1', list1 );
Observer.link( globalThis, 'list2', list2 );
setTimeout(() => {
    Observer.set( list1, 0, 'new one' );
}, 4500);

console.log('');
let result, sync = subscriptFunction.thread;
[ result, sync ] = await subscriptFunction( 'sum', '55', '55' );
//result = await subscriptFunction( 'sum', '55', '55' );
console.log( '---result---->', typeof sync, result );
setTimeout( async () => {
    console.log( '---thread---->', await sync( [ 'funcParam2' ] ) );
}, 5000 );
console.log('');
console.log('--------------------------------------------------');
console.log('');
//console.log( JSON.stringify( subscriptFunction.runtime.graph, null, 3 ) );
console.log('');
console.log('--------------------------------------------------');
console.log('');
//console.log( subscriptFunction.originalSource );
console.log('');
console.log('--------------------------------------------------');
console.log('');
//console.log( subscriptFunction.length, subscriptFunction.toString(true) );
console.log('');
console.log('--------------------------------------------------');
console.log('');


/*
Now that can we revisit the problems 
Back to the HTML kind of problems! but this is really all the way back to where we left off a decade ago!
We were just ... but dropped plans! Can we revisit those ideas?
Since progress in the language has stalled, we will not have to meet it where we left off!
*/