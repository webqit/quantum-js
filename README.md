# Subscript

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/subscript.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/subscript.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

Subscript is a reactivity runtime for JavaScript. It takes any valid JavaScript code, reads its dependency graph, and offers a mechanism to run it both in whole and in *reactive* selections, called *dependency threads*.

+ [What's A Dependency Thread?](#whats-a-dependency-thread)
+ [What Is Subscript?](#what-is-subscript)
+ [Concepts](#concepts)
+ [API](#api)
+ [Installation](#installation)
+ [A Custom Element Example](#a-custom-element-example)
+ [Motivation](#motivation)
+ [Getting Involved](#getting-involved)
+ [Issues](#issues)

## What's A Dependency Thread?

Think of it as the dependency chain involving two or more JavaScript expressions. 👇

```js
let count = 10, doubleCount = count * 2, quadCount = doubleCount * 2;
```

We just expressed that `doubleCount` should be two times the value of `count`, and that `quadCount` should be two times the value of `doubleCount`; each subsequent expression being a *dependent* of the previous.

```js
console.log( count, doubleCount, quadCount );
< 10, 20, 40
```

😉 Can you spot that same dependency chain in the following hypothetical UI render function…?

```js
let count = 10;
```

```js
let render = function() {
    let countElement = document.querySelector( '#count' );
    countElement.innerHTML = count;
    
    let doubleCount = count * 2;
    let doubleCountElement = document.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    let quadCount = doubleCount * 2;
    let quadCountElement = document.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;
}
```

You'll also notice one additional *dependent* at each level of the chain. That brings the *dependency thread* for `count` to the following sequence: statement `2` -> statement `3` -> statement `5` -> statement `6` -> statement `8`; excluding statements `1`, `4`, `7`.

🤝 Good analysis! But what's the deal?

Programs are generally expected to run **in whole**, **not in dependency threads**! It would take some magic to have the latter. But... well, that's what's for dinner with Subscript! 😁

Problem is: the mathematical relationship above only holds for as long as nothing changes. Should the value of `count` change, then its dependents are sure out of sync.

```js
count ++;
```

```js
console.log( count, doubleCount, quadCount );
< 11, 20, 40
```

This is that reminder that expressions in JavaScript aren't automatically bound to their dependencies. (Something we'd expect of any programming language.) The `render()` function must be called again each time the value of `count` changes.

An important worry is that we end up running overheads on sebsequent calls to `render()`, as those `document.querySelector()` calls traverse the DOM again, just to return the same elements as in previous runs. (In real life, there could be even more expensive operations up there.)

Enter dependency threads; suddenly, we can get statements to run in isolation in response to a change! **Here comes a new way to think about reactivity and performance in JavaScript**! 👇

\> Obtain `SubscriptFunction` and use as a drop-in replacement for `Function`! 👇

```js
let render = new SubscriptFunction(`
    let countElement = document.querySelector( '#count' );
    countElement.innerHTML = count;
    
    let doubleCount = count * 2;
    let doubleCountElement = document.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    let quadCount = doubleCount * 2;
    let quadCountElement = document.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;`
);
```

> More about the syntatic rhyme between `SubscriptFunction` and `Function` [ahead](#api).

\> Use `render` as a normal function…

```js
render();
```

*The above executes the function body in whole as we'd expect. Elements are selected and assigned content. And we can see the counters in the console.*

```js
console.log( count, doubleCount, quadCount );
< 10, 20, 40
```

\> Run just the `count` dependency thread…

```js
count ++;
render.thread( [ 'count' ] );
```

*This time, only statements `2` -> `3` -> `5` -> `6` -> `8` are run - *the "count" dependency thread*; and the previously selected UI elements in those local variables are only now updated.*

```js
console.log( count, doubleCount, quadCount );
< 11, 22, 44
```

\> Use `SubscriptFunction` as a building block.

*A Custom Element Example [ahead](#a-custom-element-example)*

## What Is Subscript?

A general-purpose reactivity runtime for JavaScript, with an overarching philosophy of *reactivity that is based on the dependency graph of your own code, and nothing of its own syntax*!

It takes any piece of code and compiles it into an ordinary JavaScript function that can also run expressions in *dependency threads*!

Being function-based let's us have all of Subscript as a building block… to fit anywhere!

## Concepts

+ [Thread Events](#thread-events)
+ [References And Bindings](#references-and-bindings)
+ [Conditionals And Logic](#conditionals-and-logic)
+ [Loops](#loops)
+ [Functions](#functions)

### Thread Events

Subscript is not concerned with how changes happen or are detected on the outer scope of the function. It simply gives us a way to announce that something has changed. That announcement is called a *thread event*.

A Subscript function has a `thread()` method that lets us trigger a thread for the list of outside variables or properties that have changed.

```js
let a = 'Apple', b = 'Banana', c = { prop: 'Fruits' };
```

```js
let fn = new SubscriptFunction(`
    console.log( \`The value of 'a' is: \${ a }\` );
    console.log( \`The value of 'b' is: \${ b }\` );
    console.log( \`The value of 'c.prop' is: \${ c.prop }\` );
`);
```

```js
// Initial run
fn();
```

```js
// Updates and threads
b = 'Breadfruit';
fn.thread( [ 'b' ] );
```

The array syntax allows us to represent properties as paths.

```js
fn.thread( [ 'c', 'prop' ] );
```

And we can run one thread for multiple changes.

```js
fn.thread( [ 'a' ], [ 'b' ] );
```

Variable declarations within the function belong in their own scope and do not respond to outside events. But when they do reference variables from the outside scope, they are included in the dependency thread of those outside variables.

```js
let fn = new SubscriptFunction(`
    let a = 'Apple', b = 'Banana' + ' ' + c.prop;
    console.log( \`The value of 'a' is: \${ a }\` );
    console.log( \`The value of 'b' is: \${ b }\` );
    console.log( \`The value of 'c.prop' is: \${ c.prop }\` );
`);
```

```js
// Initial run
fn();
```

```js
// The following events will have no effect since "a" and "b" are local variables.
fn.thread( [ 'a' ], [ 'b' ] );
```

```js
// The local variable "b" will be part of the dependency thread of "c.prop"
// (The console will therefore show the result of the last two statements in the function)
fn.thread( [ 'c', 'prop' ] );
```

### References And Bindings

Expressions and statements in Subscript maintain a binding to their references. And that's the basis for reactivity in Subscript.

For example, variable declarations, with `let` and `var`, and assignment expressions, are bound to any references that may be in their argument. (`const` declarations are an exception as they're always *const* in nature.)

```js
var tense = score > 50 ? 'passed' : 'failed';
```

*Above, the assignment expression is bound to the reference `score`; and thus responds to a thread event for `score`.*

The thread continues with any susequent bindings to the `tense` variable itself...

```js
let message = `Hi ${ candidate.firstName }, you ${ tense } this test!`;
```

*Above, the assignment expression is bound to the references `candidate`, `candidate.firstName`, and `tense`; and thus responds to a thread event for each.*

And the thread continues with any susequent bindings to the `message` variable itself... and any bindings of those bindings...

```js
let fullMessage = [ message, ' ', 'Thank you!' ].join( '' );
```

```js
let broadcast = { [ candidate.username ]: fullMessage };
```

```js
console.log( broadcast );
```

```js
let broadcastInstance = new BroadcastMessage( broadcast );
```

### Conditionals And Logic

When the *test expression* of an "If/Else" statement, "Switch" statement, or other logical expressions contains references, the statement or logical expression is bound to those references. This lets us have *reactive conditionals and logic*.

#### "If/Else" Statements

An "If/Else" statement is bound to references in its "test" expression.

```js
if ( score > 80 && passesSomeOtherTest() ) {
    addBadge( candidate );
    candidate.remark = 'You\'ve got a badge';
} else {
}
```

*Above, the "If/Else" construct is bound to the references `score` and `passesSomeOtherTest` - yes, should that also change. A thread event for any of these gets the construct re-evaluated; first, the "test" expression (`score > 80 && passesSomeOtherTest()`), then, the body of the appropriate branch of the construct.*

Statements in the body of the "consequent" and "alternate" branches form a binding to references of their own, independent of their containing "If" construct. But they only respond to thread events for as long as the "state" of all *conditions in context* allows.

*Above, the `addBadge()` expression is bound to the reference `candidate`, and joins alone in the dependency thread, independent of the "If" construct, but for as long as the condition in context (`score > 80 && passesSomeOtherTest()`) holds true.*

> The "state" of all *conditions in context* are determined via *memoization*, and no re-evaluation ever takes place.

An "Else/If" block is taken for just an "If" statement in the "Else" block of a parent "If" statement...

```js
if ( score > 80 && passesSomeOtherTest() ) {
    addBadge( candidate );
    candidate.remark = 'You\'ve got a badge';
} else if ( someOtherCondition ) {
} else {
}
```

...and is bound to references in its own "test" expression, independent of its parent. But it only responds to thread events for as long as the "state" of all *conditions in context* allows.

*Above, the nested "If" statement is bound to the reference `someOtherCondition`, and joins alone in the dependency thread, independent of the parent "If" construct, but for as long as the parent condition (`score > 80 && passesSomeOtherTest()`) holds false.*

#### "Switch" Statements

A "Switch" statement is bound to references in its "test" expressions - the "switch/case" expressions.

```js
switch( score ) {
    case 0:
        candidate.remark = 'You got nothing at all';
        break;
    case maxScore:
        candidate.remark = 'You got the most';
        break;
    default:
        candidate.remark = defaultRemark;
}
```

*Above, the "Switch" construct is bound to the references `score` and `maxScore`. A thread event for any of these gets the construct re-evaluated; first, the "switch/case" expressions (`score === 0` | `score === maxScore` | `score === null`), then, the body of the appropriate branch of the construct.*

Statements in the body of the branches form a binding to references of their own, independent of the "Switch" construct. But they only respond to thread events for as long as the "state" of all *conditions in context* allows.

*Above, the assignment to `candidate.remark` (in the "default" case) is bound to the reference `defaultRemark`, and joins alone in the dependency thread, independent of the "Switch" construct, but for as long as the conditions in context (`score === null`) hold true.*

> The "state" of all *conditions in context* are determined via *memoization*, and no re-evaluation ever takes place.

#### Logical And Ternary Expressions

Subscript observes the state of logical (`a && b || c`) and ternary (`a ? b : c`) expressions when running dependency threads.

```js
let a = () => 1;
let b = 2;
let c = 3;
let d, e;
```

A logical expression...

```js
e = a() && b || c;
```

A ternary expression...

```js
d = a() ? b : c;
```

*Above, each of the two expressions is bound to the references `a`, `b` and `c`. A thread event for any of `a` and `b` - or `a` and `c`, as determined by the "logical state" of the expressions<sup>*</sup> - gets the expressions re-evaluated; first, the "test" expression (`a()`), then, the expression on the appropriate side of the construct.*

<sup>*</sup>Since expressions in the "consequent" and "alternate" sides of a conditional or logical expression are mutually exclusive (`b` and `c` above), as determined by the "test" expression (`a()` above), only the thread events for the references in the currently active side (`b` above) are honoured by the expression at any given point in time.

### Loops

When the parameters of a loop ("For" loops, "While" and "Do … While" loops) contain references, the loop is bound to those references. This lets us have reactive loops.

#### A `for` Loop, `while` And `do … while` Loop

A "For" loop is bound to references in its 3-part definition.

```js
let start = 0;
let items = [ 'one', 'two', 'three', 'four', 'five' ];
let targetItems = [];
```

```js
for ( let index = start; index < items.length; index ++ ) {
    targetItems[ index ] = items[ index ];
}
```

*The loop above is bound to the references `start`, `items`, and `items.length`. A thread event for any of these gets the loop to run again.*

```js
// Say, "start" were a global variable
start = 2;
fn.thread( [ 'start' ] );
```

```js
// Say, "items" were a global variable
items.unshift( 'zero' );
fn.thread( [ 'items', 'length' ] );
```

As with a "For" loop, a "While" and "Do ... While" loop are bound to references in their "test" expression.

```js
let index = 0;
let items = [ 'one', 'two', 'three', 'four', 'five' ];
let targetItems = [];
```

```js
while ( index < items.length ) {
    targetItems[ index ] = items[ index ];
    index ++;
}
```

*The loop above is bound to the references `items` and `items.length`. A thread event for any of these gets the loop to run again.*

```js
// Say, items were global variables
items.unshift( 'zero' );
fn.thread( [ 'items', 'length' ] );
```

#### A `for … of` Loop

A "For ... Of" loop is bound to references in its *iteratee*.

```js
let  entries = [ 'one', 'two', 'three', 'four', 'five' ];
let targetEntries = [];
```

```js
for ( let entry of entries ) {
    let index = entries.indexOf( entry );
    console.log( `Current iteration index is: ${ index }, and entry is: '${ entry }'` );
    targetEntries[ index ] = entries[ index ];
}
```

*The loop above is bound to the reference `entries`. A thread event for `entries` gets the loop to run again.*

```js
// Say, entries were a global variable
entries = [ 'six', 'seven', 'eight', 'nine', 'ten' ];
fn.thread( [ 'entries' ] );
```

As an added advantage of this form of loop, updating a specific entry in `entries` moves the loop's pointer to the specific iteration involving that entry, and the body of that iteration is run again.

```js
entries[ 7 ] = 'This is new eight';
fn.thread( [ 'entries', 7 ] );
```

Now, the console reports…

```js
Current iteration index is: 7, and entry is: 'This is new eight'
```

…and index `7` of `targetEntries` is updated.

#### A `for … in` Loop

A "For ... In" loop is bound to references in its *iteratee*.

```js
let  entries = { one: 'one', two: 'two', three: 'three', four: 'four', five: 'five' };
let targetEntries = {};
```

```js
for ( let propertyName in entries ) {
    console.log( `Current property name is: ${ propertyName }, and associated value is: '${ entries[ propertyName ] }'` );
    targetEntries[ propertyName ] = entries[ propertyName ];
}
```

*The loop above is bound to the reference `entries`. A thread event for `entries` gets the loop to run again.*

```js
// Say, entries were a global variable
entries = { six: 'six', seven: 'seven', eight: 'eight', nine: 'nine', ten: 'ten' };
fn.thread( [ 'entries' ] );
```

As an added advantage of this form of loop, updating a specific property in `entries` moves the loop's pointer to the specific iteration involving that property, and the body of that iteration is run again.

```js
entries[ 'eight' ] = 'This is new eight';
fn.thread( [ 'entries', 'eight' ] );
```

Now, the console reports…

```js
Current property name is: eight, and property value is: 'This is new eight'
```

…and the property `eight` of `targetEntries` is updated.

#### Iteration States

Conceptually, each round of iteration in a loop is an instance that Subscript can access directly when running a thread. A round of iteration is thus updatable in isolation, in response to a directed event. This is what happens when the *iteratee* of a "For ... Of" and "For ... In" loop has any of its properties updated, as seen above.

Below is a similar case.

```js
let  entries = { one: { name: 'one' }, two: { name: 'two' } };
let targetEntries = {};
```

```js
for ( let propertyName in entries ) {
    console.log( `Current property name is: ${ propertyName }, and its alias name is: '${ entries[ propertyName ].name }'` );
    targetEntries[ propertyName ] = entries[ propertyName ];
}
```

On updating the first entry, only the first round of iteration is executed again.

```js
entries[ 'one' ] = { name: 'New one' };
fn.thread( [ 'entries', 'one' ] );
```

For even more granularity, individual expressions inside a round of iteration are also responsive to thread events of their own. So, if we updated just `entries.one.name`…

```js
entries.one.name = 'New one';
fn.thread( [ 'entries', 'one', 'name' ] );
```

…we would have skipped the iteration instance itself, to target just the first statement within it.

This granular reactivity makes it often pointless to trigger a full rerun of a loop, offering multiple opportunities to deliver unmatched performance.

#### Breakouts

Subscript observes `break` and `continue` statements even when running a thread. And any of these statements may employ *labels*.

```js
let  entries = { one: { name: 'one' }, two: { name: 'two' } };
```

```js
parentLoop: for ( let propertyName in entries ) {
    childLoop: for ( let subPropertyName in entries[ propertyName ] ) {
        If ( propertyName === 'one' ) {
            break parentLoop;
        }
        console.log( propertyName, subPropertyName );
    }
}
```

### Functions

Functions are *static* definitions...

```js
function sum( a, b ) {
}
```

```js
let sum = function( a, b ) {
}
```

```js
let sum = ( a, b ) => {
}
```

...and nothing about their parameters is reactive!

They are really only significant at *call-time*; and call-time arguments are rightly *reactive*!

```js
let result = sum( score, 100 );
```

*The expression above is bound to the reference `score`. A thread event for `score` gets the `sum()` function called again with its current value.*

#### Side Effects

When a function modifies anything outside of its scope, it is said to have *side effects*.

```js
let callCount = 0;
function sum( a, b ) {
    callCount ++;
    return a + b;
}
```

When it does not, it is said to be a *pure function*.

```js
function sum( a, b ) {
    return a + b;
}
```

Regardless, Subscript's dependency threads are fully able to pick up changes made via a side effect. (Side effects made by class methods are currently not being detected.)


```js
function sum( a, b ) {
    callCount ++;
    return a + b;
}
let callCount = 0;
let result = sum( score, 100 );
console.log( 'Number of times we\'ve summed:', callCount );
```

*Above, each time the thread event for `score` gets the `sum()` expression to run again, `callCount` is incremented as a side effect; and the dependent `console.log()` expression joins in the thread to pick that up!*

Since statements in a dependency thread are executed in normal program execution order, side effects only trigger dependent expressions that appear *after the point of call*, *not before*.


```js
function sum( a, b ) {
    callCount ++;
    return a + b;
}
let callCount = 0;
console.log( 'BEFORE POINT OF CALL: Number of times we\'ve summed:', callCount );
let result = sum( score, 100 );
console.log( 'AFTER POINT OF CALL: Number of times we\'ve summed:', callCount );
```

*Above, on the thread event for `score`, the first `console.log()` expression doesn't run because at that point `sum()` hasn't been called to make the side effect!*

Also, since Subscript does not change runtime expection in any way, side effects made by function calls outside of a running thread do not get to start a thread in a bid to engage its dependent expressions!

```js
function sum( a, b ) {
    callCount ++;
    return a + b;
}
let callCount = 0;
document.body.addEventListener( 'click', () => {
    let result = sum( score, 100 );
} );
console.log( 'Number of times we\'ve summed:', callCount );
```

*This time, `sum()` is triggerred from a click event handler, not via a dependency thread, and we do not expect the `console.log()` expression to run!*

#### Subscript Function Syntax (`**`)

Subscript explores the possibility of defining functions outright as *reactive* functions using regular *Function Declaration* and *Function Expression* syntaxes!

```js
function** sum( a, b ) {
}
```

```js
let sum = function**( a, b ) {
}
```

*Notice the double star `**` symbol above; it's just one star extra to the standard syntax for [Generator Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) (`function* gen() {}`) - one more thing in the same classification of a special-purpose function in JavaScript! 😎*

Functions defined this way are compiled as `SubscriptFunction`, exposing a `.thread()` method for running dependency threads, and offering everything else as in when we use the `SubscriptFunction` constructor.

The following syntaxes are interchangeable...

```js
function** sum( a, b ) {
    return a + b;
}
```

```js
let sum = function**( a, b ) {
    return a + b;
}
```

```js
let sum = new SubscriptFunction( `a`, `b`, `return a + b;` );
```

...but the first two (proposed) syntaxes are only currently supported from within Subscript Function itself!

```js
let score = 10;
let program = new SubscriptFunction(`
    function** sum( a, b ) {
        callCount ++;
        return a + b;
    }

    let callCount = 0;

    // The following call results in a side effect
    let result = sum( score, 100 );
    // and "callCount" is logged as "1" to the console 
    console.log( 'Number of times we\'ve summed:', callCount );

    // The following call runs a dependency thread that excludes the side effect
    // while return the sum of the previous values of "a" and "b"
    let result = sum.thread( [ 'a' ] );
    // and "callCount" is still logged as "1", not "2", to the console 
    console.log( 'Number of times we\'ve summed:', callCount );
`);
program();
```

Objects and classes have an equivalent syntax for a Subscript method...

```js
let myObject = {
    sum: function**( a, b ) {
        return a + b;
    }
}
```

```js
let myObject = {
    **sum( a, b ) {
        return a + b;
    }
}
```

```js
class MyClass {
    **sum( a, b ) {
        return a + b;
    }
}
```

...but these (proposed) syntaxes are only currently supported from within Subscript Function itself! (Also, class methods only currently support the double-star syntax at face value; they do not yet compile as Subscript methods.)

However, Subscript offers a *[Class Mixin](#subscriptclass)* that automatically redefines class methods as Subscript methods.

```js
class MyClass extends SubscriptClass() {

    static get subscriptMethods() {
        return [ 'sum' ];
    }

    sum( a, b ) {
        return a + b;
    }
}
```

```js
class MyClass extends SubscriptClass( HTMLElement ) {

    static get subscriptMethods() {
        return [ 'render' ];
    }

    render() {
    }
}
```

## API

### SubscriptFunction

`SubscriptFunction` is a one-to-one equivalent of the [JavaScript Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function). They work interchangeably 😎.

#### Syntax

```js
// Statically
let subscrFunction = SubscriptFunction( functionBody );
let subscrFunction = SubscriptFunction( arg1, functionBody );
let subscrFunction = SubscriptFunction( arg1, ... argN, functionBody );

// With the new operator
let subscrFunction = new SubscriptFunction( functionBody );
let subscrFunction = new SubscriptFunction( arg1, functionBody );
let subscrFunction = new SubscriptFunction( arg1, ... argN, functionBody );
```

#### Parameters

##### `arg1, ... argN`

Names to be used by the function as formal argument names. Each must be a string that corresponds to a valid JavaScript parameter (any of plain identifier, rest parameter, or destructured parameter, optionally with a default), or a list of such strings separated with commas.

##### `functionBody`

A string that represents the function body.

#### Return Value

A regular `Function` object, or an `async function` object where the `await` keyword is used within `functionBody`.

```js
// Create a regular function - sum
let sum = SubscriptFunction( 'a', 'b', 'return a + b;' );

// Call the returned sum function and log the result
console.log( sum( 10, 2 ) );
< 12
```

```js
// Create an async function - sum
let sum = SubscriptFunction( 'a', 'b', 'return a + await b;' );

// Call the returned sum function and log the result
sum( 10, 2 ).then( result => {
    console.log( result );
} );
< 12
```

#### The `this` Binding

Functions returned by `SubscriptFunction` are standard functions that can have their own [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) binding at *call time*.

```js
// Create a function - colorSwitch - that sets a DOM element's color
let colorSwitch = SubscriptFunction( 'color', 'this.style.color = color;' );

// Call colorSwitch, with document.body as it's this binding
let element = document.body;
colorSwitch.call( element, 'red' );
```

But, where the `this` binding is `undefined` at call time, the `this` binding of the `SubscriptFunction` itself is used. This lets us have a default `this` binding at *creation time*.

```js
// Create the same colorSwitch, this time, with a this binding that can be used at call time
let element = document.body;
let colorSwitch = SubscriptFunction.call( element, 'color', 'this.style.color = color;' );

// Call colorSwitch, without a this binding
colorSwitch( 'red' );
colorSwitch.call( undefined, 'red' );

// Call colorSwitch, with a different this binding
let h1Element = document.getElementById( 'h1' );
colorSwitch.call( h1Element, 'red' );
```

#### The `subscrFunction.thread()` Method

The `.thread()` method is the *reactivity* API in Subscript functions that lets us send *thread events* into the *reactivity runtime*. It takes a list of the outside variables or properties that have changed; each as an array path.

##### Syntax

```js
let returnValue = subscrFunction.thread( path1, ... pathN );
```

##### Parameters

##### `path1, ... pathN`

An array path representing each variable, or object property, that has changed. *See [Thread Events](#thread-events) for concepts and usage.*

##### Return Value

The return value of this method depends on the return value of the *dependency thread* it initiates within the function body.

```js
// Global variables to use
a = 10;
b = 2;

// Create a function with two possible values
let sum = SubscriptFunction(`
    if ( a > 10 ) {
        return a + await b;
    }
    return a + b;
`);

// Run normally
console.log( sum() );
< 12

// Run a thread with a different return value
a = 20;
console.log( sum.thread( [ 'a' ] ) );
< Promise { 22 }
```

### SubscriptClass

`SubscriptClass` is a *convenience* base class *Mixin* that automatically transforms regular class methods as Subscript methods.

#### Syntax

```js
class MyClass extends SubscriptClass( [ BaseClass = null ] ) {

    static get subscriptMethods() {
        return [ methodName, ... methodNameN ];
    }

    method() {
    }
}
```

#### Parameters

##### `BaseClass`

An optional base class that should be extended.

##### `methodName, ... methodNameN`

Names of the methods that should be transformed to Subscript methods.

#### Return Value

A *class* object.

*See [below](#custom-element-example) for usage examples*

## Installation

\> Install via npm

```cmd
npm i @webqit/subscript
```
```js
import { SubscriptFunction, SubscriptClass } from '@webqit/subscript';
```

\> Include from a CDN

```html
<script src="https://unpkg.com/@webqit/subscript/dist/main.js"></script>
```
```js
const { SubscriptFunction, SubscriptClass } = WebQit.Subscript;
```

## A Custom Element Example

As trivial as our hypothetical [`render()`](#whats-a-dependency-thread) function above is, we can see it applicable in real life places! Consider a neat reactive *Custom Element* example based on [`SubscriptClass`](#subscriptclass).

```js
// We'll still keep count as a global variable for now
let count = 10;
```

```js
// This custom element extends Subscript as a base class… more on this later
customElements.define( 'click-counter', class extends SubscriptClass( HTMLElement ) {
    
    // This is how we designate methods as reactive methods
    static get subscriptMethods() {
        return [ 'render' ];
    }
        
    connectedCallback() {
        // Full execution at connected time
        this.render();
        // Granularly-selective execution at click time
        this.addEventListener( 'click', () => {
            count ++;
            this.render.thread( [ 'count' ] );
        } );
    }

    render() {
        let countElement = document.querySelector( '#count' );
        countElement.innerHTML = count;
        
        let doubleCount = count * 2;
        let doubleCountElement = document.querySelector( '#double-count' );
        doubleCountElement.innerHTML = doubleCount;
        
        let quadCount = doubleCount * 2;
        let quadCountElement = document.querySelector( '#quad-count' );
        quadCountElement.innerHTML = quadCount;
    }
} );
```

*See also [SubscriptElement](https://webqit.io/tooling/oohtml/docs/spec/subscript#subscript-element-mixin) - the [OOHTML](https://webqit.io/tooling/oohtml) extension of [`SubscriptClass`](#subscriptclass)*

## Motivation

### The Best Syntax Is No Syntax At All!

*Frontend has a syntax problem*! Every framework has come contributing something *JavaScript-like*, *HTML-like*, or even *JavaScript/HTML-like<sup>2</sup>* to the plague! And for many of us, that bit is a non-starter! 😡

So, we're rethinking reactivity, again! This, time, to lay its very principles on nothing at all but plain JavaScript!

### Performant JavaScript

With an insane focus on pure JavaScript syntax, Subscript is able to keep its footprint, and your footprint, ridiculously small. This *less clutter*, is *more performance*!

Subscript follows a compiler-aided approach that translates to a tiny, highly-optimized piece at runtime - no diffing; no *callback wizardry*!

### Developer "Joooy" 😎

Much work goes into learning and using today's slew of reactivity primitives - those `on____` and `use____` hooks! But to explicitly construct reactive relationships is to slave over something that is *implicit* in a program's dependency graph!

Subscript lets you write your code, not the hooks! Graph-based reactivity just kicks in! 🤩

Offering the full range of modern JavaScript, with zero additional clutter, none of a complex toolchain and no required build step is a new dimension to developer productivity!

### Compasable Reactivity

Subscript comes as *reactivity in a function* - the smallest possible unit of composition, and this is new! But that is to say: composition is king!

Thinking of reactive JavaScript classes? Make one... with Subscript Function as a method! Building the next reactive system? Put Subscript Functions under the hood!

### Progressive Development

What's the possibility of turning reactivity *on* and *off* on an existing code base, in an afterthought? Oh that's a nobrainer with Subscript Functions!

+ Using the [Function Constructor](#api) approach? Just toggle between the function type, while everything else stays intact:

    ```js
    let sum = new Function( `a`, `b`, `return a + b` );
    ```

    ```js
    let sum = new SubscriptFunction( `a`, `b`, `return a + b` );
    ```

+ Using the [Function Synctax](#subscript-function-syntax-new) approach? Just toggle the *double star*, while everything else stays intact:

    ```js
    function sum( a, b, ) {
        return a + b;
    }
    ```

    ```js
    function** sum( a, b, ) {
        return a + b;
    }
    ```

This togglability is new!

## Getting Involved

We'd be super excited to have you raise an issue, make a PR, or join in the discussion at [Subscript's Github Discussions](https://github.com/webqit/subscript/discussions).

## Issues

To report bugs or request features, please submit an [issue](https://github.com/webqit/subscript/issues).

## License

MIT.
