# Stateful JS

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

[Overview](#overview) • [Creating Stateful Programs](#creating-stateful-programs) • [Polyfill](#polyfill) • [Examples](#examples) • [Getting Involved](#getting-involved) • [License](#license)

Stateful JS is a runtime extension to JavaScript that enables us do [Imperative Reactive Programming](https://en.wikipedia.org/wiki/Reactive_programming#Imperative) (IRP) in the very language! This project pursues a futuristic, more efficient way to build reactive applocations *today*!

## Overview

Whereas you normally would need a couple primitives to model reactive logic...

```js
import { useState, useMemo, useEffect } from 'react';

// count
const [ count, setCount ] = useState(5);
// doubleCount
const doubleCount = useMemo(() => count * 2, [count]);
// console.log()
useEffect(() => {
  console.log(doubleCount);
}, [doubleCount]);
```

```js
// An update
setTimeout(() => setCount(10), 500);
```

Stateful JS lets you acheive the same in the ordinary imperative form of the language:

```js
let count = 5;
let doubleCount = count * 2;
console.log(doubleCount);
```

```js
// An update
setTimeout(() => count = 10, 500);
```

Here, the code you write is able to *statically* reflect changes to state in *micro* details, such that the state of that piece of program is always in sync with the rest of the program at any given point!

## Idea

Imperative programs are really the foundation for "state", "effect" and much of what we try to model today at an abstract level using, sometimes, functional reactive primitives as above, and sometimes some other means to the same end. But that's us _re-implementing existing machine-level concepts_ when that should be something best left to the machine!

<details><summary>Learn more</summary>

Right in how the instructions in an imperative program act on data - from the assignment expression that sets or changes the data held in a local variable (`count = 10`), or the `delete` operator that mutates some object property (`delete object.value`), to the "if" construct that determines the execution path based on a certain value - you can see "state" (data) and "effect" (instruction) at play!

But what we don't get with how this works naturally is having the instructions stay sensitive to changes to the data they individually act on! (That relationship is simply not maintained by the runtime!) And that's where a whole new way of doing things becomes necessary - wherein we approach fundamental imperative operations programmatically: `setCount(10)` vs `count = 10`.

</details>

If we could get the JS runtime to add "reactivity" to how it already works - i.e. having the very instructions stay sensitive to changes to the data they individually act on - we absolutely would be enabling reactive programming in the imperative form of the language and entirely unnecessitating the manual way!

<!--
<details><summary>Learn more</summary>

Many new things here for free when machine-level concepts are indeed left to the machine:

+ A level of precision and performance that could never be attained manually
+ A maximum authoring experience and much cleaner, leaner code; by a large margine

</details>
-->

This comes as a radically different thinking that occupies its own category in the reactivity spectrum! (You can learn more in the [Relationship with Other Concepts](#relationship-with-other-concepts) section.)

<!--
## Update Model

When a change happens, Stateful programs do *just what's needed* to reflect it! Updates will always involve *just the relevant expression*, or sequence of expressions - as entirely determined by your program's dependency graph - that actually need to be touched to keep program state fully in sync!

This means: game on with however your code lends itself to be written, as in below; but only the following sequence of expressions: 4 -> 5, will reflect a change to `count`:

```js
let outputNode = document.createElement('div');
let count = 5; // [Statement 2]
document.body.append(outputNode);
let doubleCount = count * 2; // [Statement 4]: Dependent on statement 2
outputNode.innerHTML = doubleCount; // [Statement 5]: Dependent on statement 4
```

```js
// An update
setTimeout(() => count = 10, 500);
```

Now, this translates to eliminating the overheads of doing **_unrelated_** work - as would be the case with having that `div` above recreated and appending each time `count` is updated! 

Of course, this precision just makes us many "x" more performant!

Also, update sequence is always ordered and *linear*! Reflection will always happen in the same top-down sequence of "control flow" in imperative programs, ensuring familiar and predictable runtime behaviour.

Now, this translates to eliminating the often **_tricky_** reactivity in non-linear update models - as would be the case with having an update below on line 6 moved control up the scope to trigger statements 5 and 3!

```js
let outputNode = document.createElement('div'); // [Statement 1]
let count = 5;
document.body.append(outputNode); // [Statement 3]: Dependent on statement 1
let doubleCount = count * 2;
outputNode.innerHTML = doubleCount; // [Statement 5]: Dependent on statement 1
outputNode = document.createElement('span'); // [Statement 6]: Has no dependents and wouldn't move control up the scope to statements 5 and 3, as those aren't dependents
```

Of course, our current linear update model just makes everything many "x" easier to reason about!

> Note that, earlier, the update to `count` didn't happen as an operation in the same flow as the dependents themselves, but as an operation driven by an external event: `setTimeout(() => count = 10, 500);`!

Armed with this simple principle of operation, you can go pretty any length without breaking a sweat!
-->

## Creating Stateful Programs

This feature comes both as a new function type: "Stateful Functions" and as a new execution mode for whole programs: "Stateful Execution Mode" (or "Stateful Mode" for short; just in how we have "[Strict Mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)")!

Given a language-level feature, no setup or build step is required! Polyfill just ahead!

### Stateful Functions

You can designate a function as stateful using a double star notation; similar to [how generator functions look](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator):

```js
// Stateful function declaration
function** bar() {
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
bar();
```

```js
// Stateful async function declaration
async function** bar() {
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
await bar();
```

<details><summary>...and in just how a function works in JavaScript</summary>

```js
// Stateful function expression, optionally async
const bar = function** () {
  // Function body
}
```

```js
// Stateful object property, optionally async
const foo = {
  bar: function** () {
    // Function body
  },
}
```

```js
// Stateful object method, optionally async
const foo = {
  **bar() {
    // Function body
  },
}
```

```js
// Stateful class method, optionally async
class Foo {
  **bar() {
    // Function body
  }
}
```

</details>

And you can acheive the same using Stateful Function constructors:

```js
// Stateful function constructor
const bar = StatefulFunction(`
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
bar();
```

```js
// Stateful async function constructor
const bar = StatefulAsyncFunction(`
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
await bar();
```

<details><summary>...and in just how <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function">function constructors</a> work in JavaScript</summary>

```js
// With function parameters
const bar = StatefulFunction( param1, ... paramN, functionBody );
```

```js
// With the new keyword
const bar = new StatefulFunction( param1, ... paramN, functionBody );
```

```js
// As class property
class Foo {
  bar = StatefulFunction( param1, ... paramN, functionBody );
}
```

Well, this also includes the fact that, unlike normal function declarations and expressions that can see their surrounding scope, code in function constructors can see only the global scope:

```js
let a;
globalThis.b = 2;
var c = 'c'; // Equivalent to globalThis.c = 'c' assuming that we aren't running in a function scope or module scope
const bar = StatefulFunction(`
  console.log(typeof a); // undefined
  console.log(typeof b); // number
  console.log(typeof c); // string
`);
bar();
```

</details>

### Stateful Execution Mode (Whole Programs)

Think "Strict Mode", but for reactivity!

Here, given the same underlying infrastructure, any piece of code can be made to run in stateful mode. Stateful JS exposes two APIs that let us have that:

```js
// Stateful regular JS
const program = new StatefulScript(`
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
program.execute();
```

```js
// Stateful module
const program = new StatefulModule(`
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
await program.execute();
```

These will run in the global scope!

The latter does certainly let you use `import` and `export` statements!

<details><summary>Exanple</summary>

```js
// Stateful module
const program = new StatefulModule(`
  import module1, { module2 } from 'package-name';
  import { module3 as alias } from 'package-name';
  ...
  export * from 'package-name';
  export let localVar = 0;
`);
```

</details>

Now, this goes a step further to let us have "Stateful Scripts" - which ships in a related work [OOHTML](https://github.com/webqit/oohtml):

```html
<!-- Stateful classic script -->
<script stateful>
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
</script>
```

```html
<!-- Stateful module script -->
<script type="module" stateful>
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
</script>
```

And the ideas there are coming to simplify how we build single page applications!

<details><summary>Sneak peak</summary>

```html
<main id="page1">
  <script scoped stateful>

    console.log(this.id); // page1

  </script>
</main>
```

```html
<main id="page2">
  <script type="module" scoped stateful>

    console.log(this.id); // page2

  </script>
</main>
```

</details>

Now, other tooling may choose to use the same infrastructure in other ways; e.g. as compile target.

## Consuming Stateful Programs

Each call to a stateful function or script returns back a `State` object that lets us consume the program from the outside. (This is similar to [what generator functions do](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator).)

### Return Value

The `State` object features a `value` property that carries the program's actual return value:

```js
function** sum(a, b) {
  return a + b;
}
```

```js
const state = sum(5, 4);
console.log(state.value); // 9
```

But given a "live" program, the `state.value` property also comes as a "live" property that always reflects the program's new return value should anything make that change:

```js
function** counter() {
  let count = 0
  setInterval(() => count++, 500);
  return count;
}
```

```js
const state = counter();
console.log(state.value); // 0
```

Now, the general-purpose, object-observability API: [Observer API](https://github.com/webqit/observer) puts those changes right in our hands:

```js
Observer.observe(state, 'value', mutation => {
  //console.log(state.value); Or:
  console.log(mutation.value); // 1, 2, 3, 4, etc.
});
```

### Module Exports

For module programs, the `State` object also features an `exports` property that exposes the module's exports:

```js
// Stateful module
const program = new StatefulModule(`
  import module1, { module2 } from 'package-name';
  import { module3 as alias } from 'package-name';
  ...
  export * from 'package-name';
  export let localVar = 0;
`);
```

```js
const state = await program.execute();
console.log(state.exports); // { module1, module2, module3, ..., localVar }
```

But given a "live" program, each property in the `state.exports` object also comes as a "live" property that always reflects an export's new value should anything make that change:

```js
// As module
const program = new StatefulModule(`
  export let localVar = 0;
  ...
  setInterval(() => localVar++, 500);
`);
```

```js
const state = await program.execute();
console.log(state.exports); // { localVar }
```

Now, again, the Observer API puts those changes right in our hands:

```js
Observer.observe(state.exports, 'localVar', mutation => {
  //console.log(state.exports.localVar); Or:
  console.log(mutation.value); // 1, 2, 3, 4, etc.
});
```

```js
// Observe "any" export
Observer.observe(state.exports, mutations => {
  mutations.forEach(mutation => console.log(mutation.key, mutation.value));
});
```

## Disposing Stateful Programs

Stateful programs may maintain many live relationships and should be disposed when their work is done! The `State` object they return exposes a `dispose()` method that lets us do just that:

```js
state.dispose();
```

<!-- TODO: Talk about auto-disposals -->

## Interaction with the Outside World

Stateful programs can read and write to the given scope in which they run; just in how a regular JavaScript function can reference outside variables and also make side effects:

```js
let a = 2, b;
function** bar() {
  b = a * 2;
}
bar();
```

But unlike regular JavaScript, Stateful programs maintain a live relationship with the outside world:

### ...with Arbitrary Objects

With any object, every interaction happening at the property level is reactive! This means that:

#### Mutations to Object Properties from the Outside Will Be Automatically Reflected

Stateful JS programs will statically reflect changes to any property that they may depend on:

```js
// External value
const foo = { baz: 0 };
```

```js
function** bar() {
  let localVar = foo.baz;
  console.log(localVar);
}
bar();
```

whether it's a reference made from within program body itself as above, or from the place of a parameter's *default value*:

```js
function** bar(localVar = foo.baz) {
  console.log(localVar);
}
bar();
```

This will now be reflected above:

```js
// Update external dependency
foo.baz = 1;
```

<details><summary>In practice...</summary>

...since the Observer API isn't yet native, the above `foo.baz = 1` assignment would need to happen via the `Observer.set()` method:

```js
Observer.set(foo, 'baz', 1);
```

</details>

#### Interactions with Arbitrary Objects from the Inside Are Observable

Mutations from within a Stateful program may conversely be observed from the outside:

```js
// External value
const foo = { baz: 0 };
```

```js
// Observe specific property
Observer.observe(foo, 'baz', mutation => {
  console.log(mutation.type, mutation.key, mutation.value, mutation.oldValue);
});
```

The following operation will now be reported above:

```js
function** bar() {
  foo.baz++;
}
bar();
```

And if you'd go further with the Observer API, you could even intercept property access by Stateful programs!

<details><summary>Example</summary>

```js
// Intercept specific property
Observer.intercept(foo, {
    get:(e, recieved, next) => {
        if (e.key === 'props') {
          return next(['prop1', 'prop2']);
        }
        return next();
    },
});
```

</details>

### ...with the Global Scope

For global variables, interactions happening directly at the variable level, not just at the property level this time, are reactive! (Here we take advantage of the fact that global variables are really *properties* of a real *object* - the `globalThis` - which serves as JavaScript's global scope!)

This means that:

#### Changes to the Global Scope from the Outside Will Be Automatically Reflected

Stateful JS programs will statically reflect changes to any global variable that they may depend on:

```js
// External value
var baz = 0;
// Or: globalThis.baz = 0;
```

```js
function** bar() {
  let localVar = baz;
  console.log(localVar);
}
bar();
```

whether it's a reference made from within program body itself as above, or from the place of a parameter's *default value*:

```js
function** bar(localVar = baz) {
  console.log(localVar);
}
bar();
```

This will now be reflected above:

```js
// Update external dependency
baz = 1;
```

<details><summary>In practice...</summary>

...since the Observer API isn't yet native, the above `baz = 1` assignment would need to happen via the `Observer.set()` method:

```js
Observer.set(globalThis, 'baz', 1);
```

</details>

#### Interactions with the Global Scope from the Inside Are Observable

Updates to global variables from within a Stateful program may conversely be observed from the outside:

```js
// External value
var baz = 0;
```

```js
// Observe specific variable
Observer.observe(globalThis, 'baz', mutation => {
  console.log(mutation.type, mutation.key, mutation.value, mutation.oldValue);
});
```

The following operation will now be reported above:

```js
function** bar() {
  baz++;
}
bar();
```

And if you'd go further with the Observer API, you could even intercept global variable access by Stateful programs!

<details><summary>Example</summary>

```js
// Intercept specific property
Observer.intercept(globalThis, {
    get:(e, recieved, next) => {
        if (e.key === 'props') {
          return next(['prop1', 'prop2']);
        }
        return next();
    },
});
```

</details>

### ...with Stateful Parent Scopes Themselves

While bare variables in a local scope in JavaScript can't be observed or programatically updated, bare variables in a Stateful scope are reactive.

Where a function runs within a Stateful program itself, any updates it makes to those variables are automatically reflected:

```js
(function** () {
  // Stateful scope

  let count = 0;
  setInterval(() => count++, 500); // Live updates, even from within a non-stateful closure

  console.log('From main stateful scope: ', count); // Reflected here

  function** nested() {
    console.log('From inner stateful scope: ', count); // Reflected here
  }
  nested();

})();
```

## Inside a Stateful Program (How It Works!)

In how Stateful programs can already entirely manage themselves, knowledge of how they work can very much be optional! But, if you may, this section covers just that: the very *awesome* part!

Knowing how things work could give you a better way to reason about your own code, and a better background for taking full advantage of the "Stateful" magic to never again do manual work!

+ [Reactivity](https://github.com/webqit/stateful-js/wiki#reactivity)
+ [Granularity](https://github.com/webqit/stateful-js/wiki#granularity)
+ [Flow Control](https://github.com/webqit/stateful-js/wiki#flow-control)
+ [Update Model](https://github.com/webqit/stateful-js/wiki#update-model)
+ [Experimental Features](https://github.com/webqit/stateful-js/wiki#experimental-features)

## Polyfill

Stateful JS may be used today via a polyfill. And good a thing, while this is an absolutely powerful compiler at heart, there is no compile step required, and you can have all of Stateful JS live in the browser!

<details><summary>Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/stateful-js"><img align="right" src="https://img.shields.io/bundlephobia/minzip/@webqit/stateful-js?label=&style=flat&colorB=black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/stateful-js/dist/main.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives!

```js
// Destructure from the webqit namespace
const { StatefulFunction, StatefulAsyncFunction, StatefulScript, StatefulModule, State, Observer } = window.webqit;
```

</details>

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/stateful-js"><img align="right" src="https://img.shields.io/npm/v/@webqit/stateful-js?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/stateful-js
```

```js
// Import API
import { StatefulFunction, StatefulAsyncFunction, StatefulScript, StatefulAsyncScript, StatefulModule, State, Observer } from '@webqit/stateful-js';
```

</details>

<details><summary>See details</summary>

| API | Program type... |
| :------- | :----------- |
| `StatefulFunction` | `function** () {}` |
| `StatefulAsyncFunction` | `async function** () {}` |
| `StatefulScript` | `<script>` |
| `StatefulAsyncScript` | `<script async>` |
| `StatefulModule` | `<script type="module">` |

While fully supporting program-level APIs - `StatefulScript`, `StatefulAsyncScript`, `StatefulModule`, the current polyfill only supports the constructor forms - `StatefulFunction`, `StatefulAsyncFunction` - of Stateful Functions - which give you the equivalent of the normal function forms!

<details><summary>Code</summary>

```js
// External dependency
globalThis.externalVar = 10;
```

```js
// StatefulFunction
const sum = StatefulFunction(`a`, `b`, `
  return a + b + externalVar;
`);
const state = sum(10, 10);
```

```js
// Inspect
console.log(state.value); // 30
// Reflect and inspect again
Observer.set(globalThis, 'externalVar', 20);
console.log(state.value); // 40
```

</details>

But the double star syntax is supported from within a Stateful program itself:

<details><summary>Code</summary>

```js
const program = StatefulFunction(`
  // External dependency
  let externalVar = 10;

  // StatefulFunction
  function** sum(a, b) {
    return a + b + externalVar;
  }
  const state = sum(10, 10);

  // Inspect
  console.log(state.value); // 30
  // Reflect and inspect again
  externalVar = 20;
  console.log(state.value); // 40
`);
program();
```

</details>

</details>

### Stateful JS Lite

It is possible to use a lighter version of Stateful JS where you want something *further* feather weight for your initial application load. The Lite version initially comes without the compiler and yet let's you work with Stateful JS ahead of that.

<details><summary>
Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/stateful-js"><img align="right" src="https://img.shields.io/badge/10.8%20kB-black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/stateful-js/dist/main.async.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives!

```js
// Destructure from the webqit namespace
const { StatefulAsyncFunction, StatefulAsyncScript, StatefulModule, State, Observer } = window.webqit;
```

</details>

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/stateful-js"><img align="right" src="https://img.shields.io/npm/v/@webqit/stateful-js?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/stateful-js
```

```js
// Import Lite API
import { StatefulAsyncFunction, StatefulAsyncScript, StatefulModule, State, Observer } from '@webqit/stateful-js/async';
```

</details>

<details><summary>See details</summary>

| API | Program type... |
| :------- | :----------- |
| `StatefulAsyncFunction` | `async function** () {}` |
| `StatefulAsyncScript` | `<script async>` |
| `StatefulModule` | `<script type="module">` |

Here, you're only able to have APIs for just the "async" program types!

<details><summary>Code</summary>
  
```js
// External dependency
globalThis.externalVar = 10;
```

```js
// StatefulFunction
const sum = StatefulAsyncFunction(`a`, `b`, `
  return a + b + externalVar;
`);
const state = await sum(10, 10);
```

```js
// Inspect
console.log(state.value); // 30
// Reflect and inspect again
Observer.set(globalThis, 'externalVar', 20);
console.log(state.value); // 40
```

</details>

Good a thing, these specific APIs take advantage of the fact that they can do compilation for their program types off the main thread! Thus, as a perk, the compiler is loaded into a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and all compilations happen off the main thread!

> But having been designed as a movable peice, the Stateful JS Compiler is all still loadable directly - as if short-circuiting the lazy-loading strategy of the Lite APIs:
> 
> ```html
> <head>
>  <script src="https://unpkg.com/@webqit/stateful-js/dist/compiler.js"></script> <!-- Must come before the polyfil -->
>   <script src="https://unpkg.com/@webqit/stateful-js/dist/main.async.js"></script>
> </head>
> ```

</details>

## Examples

Using the Stateful JS and Observer API polyfills, the following examples work today. (Now, hopefully, you can have a lot of fun with that!)

+ [Example 1: *Reactive Custom Elements*](#example-1-reactive-custom-elements)
+ [Example 2: *Pure Computations*](#example-2-pure-computations)

### Example 1: *Reactive Custom Elements*

Manual reactivity accounts for a large part of the UI code we write today. But, what if we could simply write *Stateful* code?

In this example, we demonstrate a custom element that has Stateful Function as its `render()` method. We invoke the `render()` method only once and let it statically reflect subsequent updates:


<details><summary>Code</summary>

```js
customElements.define('click-counter', class extends HTMLElement {

  count = 10;

  connectedCallback() {
    // Initial rendering
    this._state = this.render();
    // Static reflect at click time
    this.addEventListener('click', () => {
      this.count++;
      //Observer.set(this, 'count', this.count + 1);
    });
  }

  disconnectCallback() {
    // Cleanup
    this._state.dispose();
  }

  // Using the StatefulFunction constructor
  render = StatefulFunction(`
    let countElement = this.querySelector( '#count' );
    countElement.innerHTML = this.count;
    
    let doubleCount = this.count * 2;
    let doubleCountElement = this.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    let quadCount = doubleCount * 2;
    let quadCountElement = this.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;
  `);

});
```

</details>

### Example 2: *Pure Computations*

Even outside of UI code, we often still need to write reactive logic! Now, what if we could simply write *Stateful* code?

In this example, we demonstrate a simple way to implement something like the [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) API - where you have many interdependent properties!

<details><summary>Code</summary>

```js
class MyURL {

  constructor(href) {
    // The raw url
    this.href = href;
    // Initial computations
    this.compute();
  }

  compute = StatefulFunction(`
    // These will be re-computed from this.href always
    let [ protocol, hostname, port, pathname, search, hash ] = new URL(this.href);

    this.protocol = protocol;
    this.hostname = hostname;
    this.port = port;
    this.pathname = pathname;
    this.search = search;
    this.hash = hash;

    // These individual property assignments each depend on the previous 
    this.host = this.hostname + (this.port ? ':' + this.port : '');
    this.origin = this.protocol + '//' + this.host;
    let href = this.origin + this.pathname + this.search + this.hash;
    if (href !== this.href) { // Prevent unnecessary update
      this.href = href;
    }
  `);

}
```

└ Instantiate `MyURL`:

```js
const url = new MyURL('https://www.example.com/path');
```

└ Change a property and have it's dependents auto-update:

```js
url.protocol = 'http:'; //Observer.set(url, 'protocol', 'http:');
console.log(url.href); // http://www.example.com/path

url.hostname = 'foo.dev'; //Observer.set(url, 'hostname', 'foo.dev');
console.log(url.href); // http://foo.dev/path
```

</details>

## Relationship with Other Concepts

*TODO*

## Getting Involved

All forms of contributions are welcome at this time. For example, syntax and other implementation details are all up for discussion. Also, help is needed with more formal documentation. And here are specific links:

+ [Project](https://github.com/webqit/stateful-js)
+ [Documentation](https://github.com/webqit/stateful-js/wiki)
+ [Discusions](https://github.com/webqit/stateful-js/discussions)
+ [Issues](https://github.com/webqit/stateful-js/issues)

## License

MIT.

[npm-version-src]: https://img.shields.io/npm/v/@webqit/stateful-js?style=flat&colorA=black&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/@webqit/stateful-js
[npm-downloads-src]: https://img.shields.io/npm/dm/@webqit/stateful-js?style=flat&colorA=black&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/@webqit/stateful-js
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@webqit/stateful-js?style=flat&colorA=black&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=@webqit/stateful-js
[license-src]: https://img.shields.io/github/license/webqit/stateful-js.svg?style=flat&colorA=black&colorB=F0DB4F
[license-href]: https://github.com/webqit/stateful-js/blob/master/LICENSE
