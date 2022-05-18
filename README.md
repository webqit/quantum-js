# Subscript Function Proposal

This project proposes a new function primitive that lets us open a reactive programming context within JavaScript.

## Table of Contents

+ [Background](#background)
+ [What We Propose](#what-we-propose)
    + [Overview](#overview)
    + [Formal Syntax](#formal-syntax)
    + [Dependency Threads](#dependency-threads)
    + [Heuristics](#heuristics)
    + [Conditionals And Logic](#conditionals-and-logic)
    + [Loops](#loops)
+ [Example Usecase](#example-usecase)
+ [Design Goals](#design-goals)
+ [Non-Goals](#non-goals)
+ [Discussion Points](#discussion-points)
+ [Polyfill](#polyfill)
    + [Download](#download)
    + [Playground](#playground)
    + [Getting Involved](#getting-involved)
    + [Issues](#issues)
    + [License](#license)
+ [Credits](#credits)

## Background

Reactive programming has become one of the most exciting programming paradigms of modern frontend development! While there continues to be varying opinions (and a high degree of polarization) as to what it is and what implementation makes the most sense, you'd realize that everyone is converging on one idea: **an automated approach to keeping something (b) in sync with something else (a), such that the expression `b = a` is held as a contract throughout the lifetime of the program**.

**Problem is:** in the real world, the concept of “contract” isn't in the design of literal assignment expressions as we have in theory above (nor does it exist in any other imperative operation). **One must have to model the equivalent of an imperative expression in functional programming - to have a chance to ensure that the “contract” is kept!**

Consider how the following theoretical reactive code would be constructed across a selection of frameworks (ignoring completeness and perfectionism):

```js
let a, b; a = 10, b = a * 2;
```

```js
// React:
let [ valueA, setValueA ] = useState(10);
let [ valueB, setValueB ] = useState();
useEffect(() => setValueB(valueA() * 2));
```

```js
// Solid JS:
let [ valueA, setValueA ] = createSignal(10);
let [ valueB, setValueB ] = createSignal();
createEffect(() => setValueB(valueA() * 2));
```

```js
// Vue:
let a = ref(10);
let b = ref();
watchEffect(() => b.value = a.value * 2);
```

```js
// Svelte (with equivalent constructs hidden behind a compiler):
let a = 10;
$: b = a * 2;
```

```js
// etc
```

Where does it hurt? Why, everywhere!
+ We've continued to ship libraries and frameworks to users to enable a universal idea for all of the time!
+ Plus, we're guaranteed to keep sitting at one level of abstraction or the other in all of our means to it, with developers consequently slaving over a slew of functional APIs, or unconventional syntaxes and their compile step!

## What We Propose

Having reactivity as a native language feature - this time, reactivity in the literal, imperative form of the language!

You'd realize that as the language engine, we aren't subject to the same userland constraints that hang reactivity at an abstraction. We operate at the root and can conveniently solve for the lowest common denominator.

So, we want to be able to just say (`let a, b; a = 10, b = a * 2`) and have it binding - but **specifically in a reactive programming context**!

### Overview

*Subscript Function* is a proposed function primitive that provides this *reactive programming context* within JavaScript. It “keeps the contract” for the individual expressions and statements that go into its context! 

These functions go with a notation as in below...

```js
function** fn() {}
// much like the syntax for generator functions - function* fn() {}
```

...and the function body is any regular piece of code that needs to stay up to date with its dependencies *in fine-grained details*.

```js
let var1 = 10;
function** fn() {
    console.log(var1);
}
```

It is, in every way, like a regular function, and can be called any number of times.

```js
fn();
// prints: 10
```

But it also exposes a `.thread()` method that specifically lets us keep it in sync with one or more of its *outer* dependencies - whenever those change.

```js
var1 = 20
fn.thread( [ 'var1' ] );
// prints: 20
```

This method passes a list of outer references for which a selection of dependent expressions or statements within the program are rerun - in the order they appear.

```js
let var1 = 10, var2 = 0;
function** fn() {
    let localVar1 = var1 * 2;
    let localVar2 = var2 * 2;
    console.log(localVar1);
    console.log(localVar2);
}
```

```js
var2 = 11;
fn.thread( [ 'var2' ] );
// prints: 22
```

So, calling the `.thread()` method in the example above moves the function's control directly to its second statement, and next to its fourth statement - as this has `localVar2` as a dependency. Local state is changed until next time. Statements 1 and 3 are left in the same state as from the last time they were touched.

Now, in logical terms, a `.thread()` update follows the implicit *dependency graph* of the expressions and statements in the function body. This means nothing is ever overrun or underrun throughout the lifetime of the program! (And you're right! Now, it gets harder for applications to not be performant!)

### Formal Syntax

A reactive programming context must be explicitly designated. So we propose using a double star (`**`) on the function syntax <a href=”#discussion-points”><sup><small>Discussion Point 1</small></sup></a>. (And this would be just one star extra on the standard syntax for [Generator Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) `function* gen() {}`.)

```js
// As function declaration
function** fn( a, b ) {
    return a + b;
}
```

```js
// As function expression
let fn = function**( a, b ) {
    return a + b;
}
```

```js
// As function constructor
// A one-on-one equivalent of the standard function constructor (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function)
let fn = new SubscriptFunction( `a`, `b`, `return a + b;` );
```

Now, being function-based lets us have this everywhere:

```js
// As property
let myObject = {
    fn: function**( a, b ) {
        return a + b;
    }
}
```

```js
// As method
let myObject = {
    **fn( a, b ) {
        return a + b;
    }
}
```

```js
// As class method
class MyClass {
    **fn( a, b ) {
        return a + b;
    }
}
```

#### The `subscrFunction.thread()` Method

The `.thread()` method is the reactivity API in Subscript Functions. It constitutes one clear interaction point and enables a one-liner approach to fine-grained reactivity.

It passes a list of the outside variables or properties that have changed; each as an array path.

##### Syntax:

```js
let returnValue = subscrFunction.thread( path1, ... pathN );
```

**Parameters**

+ `path1, ... pathN` - An array path representing each variable, or object property, that has changed.

**Return Value**

The return value of this method depends on the return value of the dependency thread it initiates within the function body.

##### Example

```js
// Outer dependencies
var a = 10;
var b = 2;

// A function with two possible return values
let sum = function**() {
    if ( a > 10 ) {
        return Promise.resolve( a + b );
    }
    return a + b;
}
```

```js
// Run normally
console.log( sum() );
< 12
```

```js
// Run a thread with a different return value
a = 20;
console.log( sum.thread( [ 'a' ] ) );
< Promise { 22 }
```

### Dependency Threads

Expressions and statements in Subscript Function contexts maintain a binding to their dependencies.

For example, variable declarations, with *let* and *var*, and assignment expressions, are bound to any references on their right-hand side. (*const* declarations are an exception as they're designed to be immutable.)

```js
var tense = score > 50 ? 'passed' : 'failed';
```

So, above, the assignment expression is bound to an external reference `score`; and thus responds to an update event for `score`.

Where an expression or statement depends on a previous one, a *dependency thread* is formed, and updates are executed along this thread.

Thus, any subsequent statement, like the one below, having the `tense` variable itself as a dependency is updated next...

```js
let message = `Hi ${ candidate.firstName }, you ${ tense } this test!`;
```

And the update continues to include any subsequent dependents of the `message` variable itself... and on to dependents of those dependents... until the end of the dependency thread.

```js
// This. (Having the “message” variable as a dependency.)
let fullMessage = [ message, ' ', 'Thank you!' ].join( '' );
```

```js
// This. (Having the “fullMessage” variable as a dependency, in addition to the “candidate.username” property.)
let broadcast = { [ candidate.username ]: fullMessage };
```

```js
// These two. (Having the “broadcast” variable as a dependency.)
let broadcastInstance = new BroadcastMessage( broadcast );
console.log( broadcast );
```

### Heuristics

Subscript Functions employ a mix of compile-time and runtime heuristics to deliver fine-grained reactivity. This lets us enjoy the full range of language features without “loosing” reactivity or trading performance.

For example, expressions that reference deep object properties are bound to updates that actually happen along those paths.

```js
let username = candidate.username;
let avatarUrl = candidate.profile.avatar;
```

So, above, the first expression responds only when the `candidate.username` property is updated or deleted, or when the root object `candidate` is changed. And the second expression responds only when the `candidate.profile.avatar` property or the parent path `candidate.profile` is updated or deleted, or when the root object `candidate` is changed.

The above holds even with a dynamic syntax.

```js
let username = candidate[1 ? 'username' : 'name'];.
let avatarUrl = (1 ? candidate : {}).profile?.avatar;
```

Also, the two expressions continue to be treated individually - as two distinct contracts - even when combined in one declaration.

```js
let username = candidate.username, avatarUrl = candidate.profile.avatar;
```

Heuristics make it all work with all of ES6+ syntax niceties. Thus, they continue to be two distinct contracts (and reactivity remains fine-grained) even with a destructuring syntax.

```js
let { username, profile: { avatar: avatarUrl } } = candidate;
```

And even when so dynamically destructured.

```js
let profileProp = ''avatar';
let { username, profile: { [ profileProp ]: avatarUrl } } = candidate;
```

As another special-syntax case, *spread* expressions are bound to both the *spread element* itself and its sub elements.

```js
let candidateCopy = { …candidate };
```

This means that the expression will re-evaluate when the *spread element* `candidate` changes, and when any of its direct properties change.

#### Side Effects

Powerful heuristics make it possible to pick up side effects - indirect mutations - made by inner functions within the Subscript Function context itself.

```js
function** fn() {
    function sum( a, b ) {
        callCount ++;
        return a + b;
    }
    let callCount = 0;
    let result = sum( score, 100 );
    console.log( 'Number of times we\'ve summed:', callCount );
}
fn();
```

Above, a side effect happens whenever `sum()` is called. Although the `console.log()` expression isn't directly dependent on the `result = sum()` expression, it is directly dependent on the side effect - `callCount` - of `sum()`. So, with an update event for `score`, the `result = sum()` expression runs, and the `console.log()` expression runs next.

If these two expressions were to appear in reverse order, as in below…

```js
console.log( 'Number of times we\'ve summed:', callCount );
let result = sum( score, 100 );
```

…an update event for `score` would run only the `result = sum()` expression, because, following the runtime's *stack-based execution model*, the side effect on `callCount` would have happened after `console.log()` got a chance to run.

### Conditionals And Logic

When the "test" expression of an "if/else" statement, "switch" statement, or other logical expression contains references, the statement or logical expression is bound to those references. This lets us have conditionals and logic as a contract.

#### "If/else" Statements

An "if/else" statement is bound to references in its "test" expression.

```js
if ( testExpr ) {
    // consequentBlock
} else {
    // alternateBlock
}
```

Above, the "if/else" construct is bound to any references in `testExpr`. An update event for any of these gets the construct evaluated again to keep the contract. So, the "test" expression (`testExpr`) is run, then, the body of the appropriate branch of the construct is executed as a block.

An “else/if” block is taken as a standalone contract nested within the “else” block of a parent “if/else” contract. In other words, the two forms below are functionally equivalent.

```js
if ( testExpr1 ) {
    // consequentBlock1
} else if ( testExpr2 ) {
    // consequentBlock2
} else {
    // alternateBlock
}
```

```js
if ( testExpr1 ) {
    // consequentBlock1
} else {
    if ( testExpr2 ) {
        // consequentBlock2
    } else {
        // alternateBlock
    }
}
```

#### "Switch" Statements

A "switch" statement is bound to references in its "switch/case" conditions.

```js
switch( operandExpr ) {
    case caseExpr1:
        // consequentBlock1
        break;
    case caseExpr2:
        // consequentBlock2
        break;
    default:
        // defaultBlock
}
```

Above, the "switch" construct is bound to any references in `operandExpr`, `caseExpr1` and `caseExpr2`. An update event for any of these gets the construct evaluated again to keep the contract. So, the "switch/case" conditions (`operandExpr === caseExpr1` | `operandExpr === caseExpr2` | `operandExpr === null`) are run, then, the body of the appropriate branch of the construct is executed as a block.

#### Logical And Ternary Expressions

Expressions with logical and ternary operators also work as conditional contracts. These expressions are bound to references in their “test” expression.

```js
// Logical expression
let result = testExpr && consequentExpr || alternateExpr;
```

```js
// Ternary expression
let result = testExpr ? consequentExpr : alternateExpr;
```

#### Fine-Grained Updates Within Conditional Contexts

In all conditional constructs above, the contract is that updates to the “test” expressions themselves result in the rerun of the appropriate branch of the construct. The selected branch is rerun *as a block*, not in *fine-grained* execution mode.

```js
if ( testExpr ) {
    addBadge( candidate );
    console.log('You\'ve got a badge');
} else {
    removeAllBadges( candidate );
    console.log('You\'ve lost all badges');
}
```

So, above, an update to `testExpr` runs the selected branch as a block - involving its two statements.

But being each a contract of their own, individual expressions and statements inside a conditional context also respond to update events in isolation. This time, the conditions in context have to be “true” for the expression or statement to rerun.

So, above, the `addBadge()` and `removeAllBadges()` expressions are both bound to the reference `candidate`. But on an update to `candidate`, only one of these expressions is run depending on the state of the condition in context - `testExpr`.

In a nested conditional context…

```js
if ( parentTestExpr ) {
    if ( testExpr ) {
    }
}
```

…all conditions in context (`parentTestExpr` >> `testExpr`) have to be “true” for an update to take place.

In all cases, the "state" of *all conditions in context* are determined via *memoization*, and no re-evaluation ever takes place on the “test” expressions.

“Switch” statements and logical and ternary expressions have this fine-grained behaviour in their own way.

### Loops

When the parameters of a loop ("for" loop, "while" and "do … while" loop) contain references, the loop is bound to those references. This lets us have loops as a contract.

#### A “for” Loop, “while” And “do … while” Loop

A "for" loop is bound to references in its 3-statement definition.

```js
for (initStatement; testStatement; incrementStatement) {
    // Loop block
}
```

So, in the loop above, an update event for any references in `initStatement`; `testStatement`; `incrementStatement` reruns the loop to keep the contract.

As with a "for" loop, a "while" and "do ... while" loop are bound to references in their "test" expression.

```js
while (testExpr) {
     // Loop block
}
```

```js
do {
     // Loop block
} while (testExpr);
```

So, in each case above, an update event for any references in `testExpr` reruns the loop to keep the contract.

#### A "for ... of" And “for … in” Loop

These loops are bound to references in their *iteratee*.

```js
for (let value of iteratee) {
    // Loop body
}
```

```js
for (let key in iteratee) {
    // Loop body
}
```

So, in each case above, an update event for any references in `iteratee` reruns the loop to keep the contract.

#### Fine-Grained Updates Within A Loop

In all loop constructs above, the contract is that updates to the iteration parameters themselves result in the restart of the loop. The loop body, in each iteration, is run *as a block*, not in *fine-grained* execution mode.

```js
var start = 0;
var items = [ 'one', 'two', 'three', 'four', 'five' ];
var targetItems = [];
var prefix = '';
function** fn() {
    for ( let index = start; index < items.length; index ++ ) {
        console.log( `Current iteration index is: ${ index }, and value is: '${ items[ index ] }'` );
        targetItems[ index ] = prefix + items[ index ];
    }
}
fn();
```

So, above, an update to any of `start`, `items`, and `items.length` gets the loop restarted…

```js
start = 2;
fn.thread( [ 'start' ] );
```

```js
items.unshift( 'zero' );
fn.thread( [ 'items', 'length' ] );
```

…with each iteration running the loop body as a block - involving its two statements.

But being each a contract of their own, individual expressions and statements in the body of a loop also respond to update events in isolation. This time, an update happens *in-place in each of the previously-made iterations of the loop*.

So, above, on updating the reference `prefix`, the second statement (specifically) in each existing round of the loop responds to keep their contract. Thus, each entry in `targetItems` gets updated with prefixed values.

```js
prefix = 'updated-';
fn.thread( [ 'prefix' ] );
```

A “for … of, for … in” loop further has the unique characteristic where each round of the loop maintains a direct relationship with its corresponding key in the *iteratee*. Now, on updating the value of a key in `iteratee` in-place, the associate round (specifically) also runs in-place to keep its contract.

```js
var items = [ { name: 'one' }, { name: 'two' }, { name: 'three' }, { name: 'four' }, { name: 'five' } ];
function** fn() {
    for ( let entry of items ) {
        let index = items.indexOf( entry );
        console.log( `Current iteration index is: ${ index }, and name is: '${ entry.name }'.` );
        targetItems[ index ] = items[ index ].name;
    }
}
fn();
```

```js
entries[ 2 ] = { name: 'new three' };
fn.thread( [ 'items', 2 ] );
```

Now, the console reports…

```js
Current iteration index is: 2, and name is: 'new three'.
```

…and index 2 of `targetEntries` is updated. 

If we mutate the `name` property of the above entry in-place, then it gets even more fine-grained: only the dependent `console.log()` expression in that round runs to keep its contact.

```js
entries[ 2 ].name = 'new three';
fn.thread( [ 'items', 2, 'name' ] );
```

Now, the console reports…

```js
Current iteration index is: 2, and name is: 'new three'.
```

This granular reactivity makes it often pointless to trigger a full rerun of a loop, offering multiple opportunities to deliver unmatched performance.

##### Handling Labeled `Break` And `Continue` Statements

Fine-grained updates observe `break` and `continue` statements, even when these redirect control to a parent block using *labels*.

```js
let  entries = { one: { name: 'one' }, two: { name: 'two' } };
function** fn() {
    parentLoop: for ( let propertyName in entries ) {
        childLoop: for ( let subPropertyName in entries[ propertyName ] ) {
            If ( propertyName === 'two' ) {
                break parentLoop;
            }
            console.log( propertyName, subPropertyName );
        }
    }
}
fn();
```

So, above, on updating the `entries` object, the nested loops run as expected, and the child loop effectively *breaks* the parent loop at the appropriate point.

```js
fn.thread( [ 'entries' ] );
```

If we mutated the object in-place to make just the child loop rerun…

```js
fn.thread( [ 'entries', 'two' ] );
```

…the `break` directive in the child loop would be pointing to a parent loop that isn't running, but this would be harmless. The child loop would simply exit as it would if the parent were to actually break at this point.

But if we did the above with a `continue` directive, the child loop would also exit as it would if the parent were to actually receive control back at this point, without control actually moving to a non-running parent.

## Example Usecase

> A Custom Element Example

This custom element has it's `render()` method as a Subscript Function.

```js
// Outer dependency
let count = 10;
```

```js
customElements.define( 'click-counter', class extends HTMLElement {
      
    connectedCallback() {
        // Full rendering at connected time
        // The querySelector() calls below are run
        this.render();

        // Fine-grained rendering at click time
        // The querySelector() calls below don't run again
        this.addEventListener( 'click', () => {
            count ++;
            this.render.thread( [ 'count' ] );
        } );
    }

    **render() {
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

Above, `render()` is called only once. Subsequent updates employ its `.thread()` method to update just the relevant contracts in the block. Fine-grained reactivity and optimal performance is gained.

## Design Goals

1. Enable reactivity directly *at the program flow level* - with commands, operators, control flow and other language constructs literally compiling as “contracts”, as against the alternative of painstakingly remodeling same in functional programming or other syntaxes.
2. Keep the business of change detection *out of scope* (that is, don't be concerned with how changes are observed); simply accept change events from the outer scope.
3. Implement Subscript Function as an extension of standard JavaScript functions, such that either can be used interchangeably, or where necessary, code can be easily ported between function types.
4. Stay conservative with syntax! By no means adopt imitation syntaxes for the same language constructs and operators!

## Non-Goals

1. Feature "x" in framework "x". No, the idea with Subscript Functions is to enable reactivity at the lowest level but leave the higher-level details - syntax sugars and additional DX - to userland implementation. This time, tooling that's with just a tiny footprint.

## Discussion Points

+ **The syntax notation for Subscript Functions** - does the double star idea (`**`) work?
+ (Additional points are acceptable via a PR.)

## Polyfill

This Polyfill is a work in progress. But it is usable today.

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/subscript.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/subscript.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

### Download

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

### Usage

+ The current polyfill only supports the constructable form of Subscript Function.

    ```js
    let fn = new SubscriptFunction( `a`, `b`, `return a + b;` );
    ```

    But the double star syntax is supported from within the function itself.

    ```js
    let fn = new SubscriptFunction( `
        function** sum( a, b ) {
            return a + b;
        }
        let result = sum( score, 100 );
        // result = sum.thread();
    ` );
    ```

+ Subscript Functions as class methods are currently only supported using a `SubscriptClass()` mixin.

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

+ *Watch the **issues** tab for new known issues*

### Playground

+ To visualize *dependency threads* in a live `.thread()` update, we've provided a custom element named `subscript-player`.

    Simply include a pair of scripts in your page...

    ```html
    <script crossorigin defer src="https://unpkg.com/@webqit/subscript/dist/console-element.js"></script>
    <script crossorigin defer src="https://unpkg.com/@webqit/subscript/dist/player-element.js"></script>
    ```

    Wrap any piece of code with it... (or edit right in the UI.)

    ```html
    <subscript-player automode="play">
        let count = 10, doubleCount = count * 2, quadCount = doubleCount * 2;
        console.log( count, doubleCount, quadCount );
    </subscript-player>
    ```

    Then click on local varaibles to see their dependency threads.

+ To inspect Subscript Methods and their *dependency threads* in a live custom element that you've designed, we've provided a custom element named `subscript-inspector`.

    Simply include a pair of scripts in your page...

    ```html
    <script crossorigin defer src="https://unpkg.com/@webqit/subscript/dist/console-element.js"></script>
    <script crossorigin defer src="https://unpkg.com/@webqit/subscript/dist/inspector-element.js"></script>
    ```

    Wrap your custom element markup with it...

    ```html
    <subscript-inspector>
        <my-counter></my-counter>
    </subscript-inspector>
    ```

    Then inspect each Subscript Method while you interact with your element. (See [this REPL](https://replit.com/@WebQit/Dependency-Thread-Demo-3-Counts-Button) for an example.)

### Getting Involved

We'd be super excited to have you raise an issue, make a PR, or join in the discussion at [Subscript's Github Discussions](https://github.com/webqit/subscript/discussions).

**And, wouldn't you give a star for this 🤨 ?**

### Issues

To report bugs or request features, please submit an [issue](https://github.com/webqit/subscript/issues).

### License

MIT.

## Credits
