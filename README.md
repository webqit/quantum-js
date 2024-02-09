# Quantum JS

[![npm version][npm-version-src]][npm-version-href]<!--[![npm downloads][npm-downloads-src]][npm-downloads-href]-->
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

[Overview](#overview) • [Creating Quantum Programs](#creating-quantum-programs) • [Implementation](#implementation) • [Examples](#examples) • [License](#license)

Quantum JS is a runtime extension to JavaScript that enables us do Imperative Reactive Programming (IRP) in the very language! This project pursues a futuristic, more efficient way to build reactive applocations *today*!

Quantum JS occupies [a new category](https://en.wikipedia.org/wiki/Reactive_programming#Imperative) in the reactivity landscape!

## Overview
 
Whereas you currently need a couple primitives to express reactive logic...

```js
import { createSignal, createMemo, createEffect } from 'solid-js';

// count
const [ count, setCount ] = createSignal(5);
// doubleCount
const doubleCount = createMemo(() => count() * 2);
// console.log()
createEffect(() => {
  console.log(doubleCount());
});
```

```js
// An update
setTimeout(() => setCount(10), 500);
```

Quantum JS lets you acheive the same in the ordinary imperative form of the language:

```js
let count = 5;
let doubleCount = count * 2;
console.log(doubleCount);
```

```js
// An update
setTimeout(() => count = 10, 500);
```

This time, the code you write is able to *statically* reflect changes to state in <del>fine-grained</del> *micro* details, without needing you to manually model your dependency graphs or worry about how values propagate through your code!

## Idea

<details><summary>Show</summary>

Imperative programs are really the foundation for "state", "effect" and much of what we try to model today at an abstract level using, sometimes, functional reactive primitives as above, and sometimes some other means to the same end. Now, that's really us _re-implementing existing machine-level concepts_ that should be best left to the machine!

<details><summary>Learn more</summary>

Right in how the instructions in an imperative program "act" on data - from the assignment expression that sets or changes the data held in a local variable (`count = 10`) to the `delete` operator that mutates some object property (`delete object.value`), to the "if" construct that determines the program's execution path based on a certain state - we can see all of "state" (data), "effect" (instructions that modify state/data), and control structures (instructions informed by state, in turn) at play!

But what we don't get with how this works naturally is having the said instructions stay sensitive to changes to the data they individually act on! (The runtime simply not maintaining that relationship!) And that's where the problem lies; where a whole new way of doing things becomes necessary - wherein we have to approach literal operations programmatically: `setCount(10)` vs `count = 10`.

</details>

If we could get the JS runtime to add "reactivity" to how it already works - i.e. having the very instructions stay sensitive to changes to the data they individually act on - we absolutely would be enabling reactive programming in the imperative form of the language and entirely unnecessitating the manual way!

This is what we're exploring with Quantum JS!

└ You may want to learn more in the introductory article: [Re-Exploring Reactivity and Introducing the Observer API and Reflex Functions](https://dev.to/oxharris/re-exploring-reactivity-and-introducing-the-observer-api-and-reflex-functions-4h70)

</details>

## Status

+ Actively maintained
+ A working implementation
+ Integral to the [OOHTML project](https://github.com/webqit/oohtml)
+ Open to contributions

## Implementation

Quantum JS may be used today. While this is a full-fledged compiler at heart, there is no compile step required, and you can have all of Quantum JS live in the browser!

<details><summary>Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/quantum-js"><img align="right" src="https://img.shields.io/bundlephobia/minzip/@webqit/quantum-js?label=&style=flat&colorB=black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/quantum-js/dist/main.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives!

```js
// Destructure from the webqit namespace
const { QuantumFunction, AsyncQuantumFunction, QuantumScript, QuantumModule, State, Observer } = window.webqit;
```

</details>

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/quantum-js"><img align="right" src="https://img.shields.io/npm/v/@webqit/quantum-js?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/quantum-js
```

```js
// Import API
import { QuantumFunction, AsyncQuantumFunction, QuantumScript, AsyncQuantumScript, QuantumModule, State, Observer } from '@webqit/quantum-js';
```

</details>

</details>

### Quantum JS Lite

It is possible to use a lighter version of Quantum JS where you want something further feather weight for your initial application load.

<details><summary>
Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/quantum-js"><img align="right" src="https://img.shields.io/badge/10.8%20kB-black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/quantum-js/dist/main.lite.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives!

```js
// Destructure from the webqit namespace
const { AsyncQuantumFunction, AsyncQuantumScript, QuantumModule, State, Observer } = window.webqit;
```

<details><summary>Additional details</summary>

The Lite APIs initially come without the compiler and yet lets you work with Quantum JS ahead of that. Additionally, these APIs are able to do their compilation off the main thread by getting the Quantum JS compiler loaded into a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)!

> But if you may, the Quantum JS Compiler is all still loadable directly - as if short-circuiting the lazy-loading strategy of the Lite APIs:
> 
> ```html
> <head>
>  <script src="https://unpkg.com/@webqit/quantum-js/dist/compiler.js"></script> <!-- Must come before the polyfil -->
>   <script src="https://unpkg.com/@webqit/quantum-js/dist/main.lite.js"></script>
> </head>
> ```

</details>

</details>

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/quantum-js"><img align="right" src="https://img.shields.io/npm/v/@webqit/quantum-js?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/quantum-js
```

```js
// Import Lite API
import { AsyncQuantumFunction, AsyncQuantumScript, QuantumModule, State, Observer } from '@webqit/quantum-js/lite';
```

</details>

## Creating Quantum Programs

This feature comes both as a new function type: "Quantum Functions" and as a new execution mode for whole programs: "Quantum Scripts"!

Given a language-level feature, no setup or build step is required!

### Quantum Functions

You can make a Quantum function via either of three ways:

#### Syntax 1: Using the `quantum` Function Flag

> Available from v4.3.

Here you prepend your function with the `quantum` flag, just in how you use the `async` function flag:

```js
// Quantum function declaration
quantum function bar() {
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
bar();
```

```js
// Async quantum function declaration
async quantum function bar() {
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
await bar();
```

<details><summary>Show more syntax examples</summary>

```js
// Quantum function expression
const bar = quantum function() {
}
const bar = async quantum function() {
}
```

```js
// Quantum object property
const foo = {
  bar: quantum function() { ... },
}
const foo = {
  bar: async quantum function() { ... },
}
```

```js
// Quantum object method
const foo = {
  quantum bar() { ... },
}
const foo = {
  async quantum bar() { ... },
}
```

```js
// Quantum class method
class Foo {
  quantum bar() { ... }
}
class Foo {
  async quantum bar() { ... }
}
```

```js
// Quantum arrow function expression
const bar = quantum () => {
}
const bar = async quantum () => {
}
```

```js
// Quantum arrow function expression
const bar = quantum arg => {
}
const bar = async quantum arg => {
}
```

</details>

<details><summary>Show polyfill support</summary>

This syntax is supported from within any piece of code compiled by the Quantum JS compiler, e.g.:

+ code made via Quantum JS APIs (discussed below):

    ```js
    const program = new QuantumFunction(`
      // External dependency
      let externalVar = 10;

      // QuantumFunction
      quantum function sum(a, b) {
        return a + b + externalVar;
      }
      const state = sum(10, 10);

      // Inspect
      console.log(state.value); // 30
    `);
    program();
    ```
    
+ code within inline `<script>` tags when using the [OOHTML Polyfill](https://github.com/webqit/oohtml) (discussed below):

    ```html
    <script>
      // External dependency
      let externalVar = 10;

      // QuantumFunction
      quantum function sum(a, b) {
        return a + b + externalVar;
      }
      const state = sum(10, 10);

      // Inspect
      console.log(state.value); // 30
    </script>
    ```

</details>
 
#### Syntax 2: Using the Double Star `**` Notation

Here you append your function with the double star `**` notation, much like how you write [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator):

```js
// Quantum function declaration
function** bar() {
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
bar();
```

```js
// Async quantum function declaration
async function** bar() {
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
await bar();
```

<details><summary>Show more syntax examples</summary>

```js
// Quantum function expression
const bar = function** () {
}
const bar = async function** () {
}
```

```js
// Quantum object property
const foo = {
  bar: function** () { ... },
}
const foo = {
  bar: async function** () { ... },
}
```

```js
// Quantum object method
const foo = {
  **bar() { ... },
}
const foo = {
  async **bar() { ... },
}
```

```js
// Quantum class method, optionally async
class Foo {
  **bar() { ... }
}
class Foo {
  async **bar() { ... }
}
```

</details>

<details><summary>Show polyfill support</summary>

This syntax is supported from within any piece of code compiled by the Quantum JS compiler, e.g.:

+ code made via Quantum JS APIs (discussed below):

    ```js
    const program = new QuantumFunction(`
      // External dependency
      let externalVar = 10;

      // QuantumFunction
      function** sum(a, b) {
        return a + b + externalVar;
      }
      const state = sum(10, 10);

      // Inspect
      console.log(state.value); // 30
    `);
    program();
    ```
    
+ code within inline `<script>` tags when using the [OOHTML Polyfill](https://github.com/webqit/oohtml) (discussed below):

    ```html
    <script>
      // External dependency
      let externalVar = 10;

      // QuantumFunction
      function** sum(a, b) {
        return a + b + externalVar;
      }
      const state = sum(10, 10);

      // Inspect
      console.log(state.value); // 30
    </script>
    ```

</details>

#### Syntax 3: Using Quantum Function Constructors

Here you use special function constructors to create a new Quantum function:

```js
// Quantum function constructor
const bar = QuantumFunction(`
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
bar();
```

```js
// Async quantum function constructor
const bar = AsyncQuantumFunction(`
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
await bar();
```

<details><summary>Show more syntax examples</summary>

```js
// With function parameters
const bar = QuantumFunction( param1, ... paramN, functionBody );
```

```js
// With the new keyword
const bar = new QuantumFunction( param1, ... paramN, functionBody );
```

```js
// As class property
class Foo {
  bar = QuantumFunction( param1, ... paramN, functionBody );
}
```

</details>

<details><summary>Show polyfill support</summary>

This is the direct syntax of the Quantum JS APIs:

```js
// Import API
import { QuantumFunction, AsyncQuantumFunction } from '@webqit/quantum-js';
```

```js
const { QuantumFunction, AsyncQuantumFunction } = window.webqit;
```

| API | Equivalent semantics... |
| :------- | :----------- |
| `QuantumFunction` | `function() {}` |
| `AsyncQuantumFunction` | `async function() {}` |

```js
// External dependency
globalThis.externalVar = 10;

// QuantumFunction
const sum = QuantumFunction(`a`, `b`, `
  return a + b + externalVar;
`);
const state = sum(10, 10);

// Inspect
console.log(state.value); // 30
```

> Note that, unlike the main Quantum JS build, the Quantum JS Lite edition only implements the `AsyncQuantumFunction` API which falls within the premise of off the main thread compilation.

</details>

<details><summary>Additional details</summary>
 
Note that unlike normal function declarations and expressions that can see their surrounding scope, as in syntaxes 1 and 2 above, code in [function constructors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) is only able to see the global scope:

```js
let a;
globalThis.b = 2;
var c = 'c'; // Equivalent to globalThis.c = 'c' assuming that we aren't running in a function scope or module scope
const bar = QuantumFunction(`
  console.log(typeof a); // undefined
  console.log(typeof b); // number
  console.log(typeof c); // string
`);
bar();
```

</details>

### Quantum Scripts (Whole Programs)

Here, whole programs are able to run in *quantum* execution mode using special scripting APIs:

```js
// Quantum regular JS
const program = new QuantumScript(`
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
program.execute();
```

```js
// Quantum module
const program = new QuantumModule(`
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
// Quantum module
const program = new QuantumModule(`
  import module1, { module2 } from 'package-name';
  import { module3 as alias } from 'package-name';
  ...
  export * from 'package-name';
  export let localVar = 0;
`);
```

</details>

<details><summary>Show polyfill support</summary>

This is the direct syntax of the Quantum JS APIs:

```js
// Import API
import { QuantumScript, QuantumModule, AsyncQuantumScript } from '@webqit/quantum-js';
```

```js
const { QuantumScript, QuantumModule, AsyncQuantumScript } = window.webqit;
```

| API | Equivalent semantics... |
| :------- | :----------- |
| `QuantumScript` | `<script>` |
| `QuantumModule` | `<script type="module">` |
| `AsyncQuantumScript` | `<script async>` |

> Note that, unlike the main Quantum JS build, the Quantum JS Lite edition only implements the `AsyncQuantumScript` and `QuantumModule` APIs which falls within the premise of off the main thread compilation.

</details>

Now, this brings us to having real Quantum scripts in HTML:

```html
<!-- Quantum classic script -->
<script quantum>
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
</script>
```

```html
<!-- Quantum module script -->
<script type="module" quantum>
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
</script>
```

But this as a HTML-level feature is made possible via a related project: [OOHTML](https://github.com/webqit/oohtml#quantum-scripts)! You'll, this time, need to use the OOHTML polyfill, instead of the Quantum JS polyfill, to have Quantum HTML Scripts.

You're in fact able to also use the `quantum` or double star `**` function notation right within an ordinary imline script:

```html
<script>
quantum function bar() {
}
</script>
```

That said, other tooling may choose to use the same API infrastructure in other ways; e.g. as compile target.

## Consuming Quantum Programs

Each call to a Quantum function or script returns back a `State` object that lets us consume the program from the outside. (This is similar to [what generator functions do](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator).)

For the Quantum functions above:

```js
const state = bar();
```

For the Quantum Script APIs above:

```js
const state = program.execute();
```

For Quantum HTML scripts - `<script quantum>`, the `state` object is available as a direct property of the script element:

```js
console.log(script.state);
```

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
// Quantum module
const program = new QuantumModule(`
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
const program = new QuantumModule(`
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

## Disposing Quantum Programs

Quantum programs may maintain many live relationships and should be disposed when their work is done! The `State` object they return exposes a `dispose()` method that lets us do just that:

```js
state.dispose();
```

For Quantum HTML Scripts - `<script quantum>`,  state disposal is automatic as script element leaves the DOM!

## Interaction with the Outside World

Quantum programs can read and write to the given scope in which they run; just in how a regular JavaScript function can reference outside variables and also make side effects:

```js
let a = 2, b;
function** bar() {
  b = a * 2;
}
bar();
```

But unlike regular JavaScript, Quantum programs maintain a live relationship with the outside world:

### ...with Arbitrary Objects

With any given object, every interaction happening at the property level is potentially reactive! This means that:

#### Mutations to Object Properties from the Outside Will Be Automatically Reflected

Quantum JS programs will statically reflect changes to any property that they may depend on:

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

Mutations from within a Quantum program may conversely be observed from the outside:

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

And if you'd go further with the Observer API, you could even intercept every access to an object's properties ahead of Quantum programs!

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

For global variables, interactions happening directly at the variable level, not just at the property level this time, are potentially reactive! (Here we take advantage of the fact that global variables are actually *properties* of a real *object* - the `globalThis` - which serves as JavaScript's global scope!)

This means that:

#### Changes to the Global Scope from the Outside Will Be Automatically Reflected

Quantum JS programs will statically reflect changes to any global variable that they may depend on:

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

Updates to global variables from within a Quantum program may conversely be observed from the outside:

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

And if you'd go further with the Observer API, you could even intercept every access to global variables ahead of Quantum programs!

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

### ...with Quantum Parent Scopes Themselves

While bare variables in a local scope in JavaScript don't map to a physical, observable object like we have of global variables, bare variables in a Quantum scope are potentially reactive like we have of global variables.

Where a function runs within a Quantum program itself, any updates it makes to those variables are automatically reflected:

```js
(function** () {
  // Quantum scope

  let count = 0;
  setInterval(() => count++, 500); // Live updates, even from within a non-quantum closure

  // "count" is automatically reflected here
  console.log('From main quantum scope: ', count);

  function** nested() {
    // "count" is automatically reflected here
    console.log('From inner quantum scope: ', count);
  }
  nested();

})();
```

## Inside a Quantum Program (How It Works!)

In how Quantum programs can already entirely manage themselves, knowledge of how they work is very much optional! But, if you may look, this section covers just that very *awesome* part!

Knowing how things work presents a great way to reason about Quantum programs, and a better background for taking full advantage of the "Quantum" magic to never again do manual work!

+ [Reactivity](https://github.com/webqit/quantum-js/wiki#reactivity)
+ [Sensitivity](https://github.com/webqit/quantum-js/wiki#sensitivity)
+ [Update Model](https://github.com/webqit/quantum-js/wiki#update-model)
+ [Flow Control](https://github.com/webqit/quantum-js/wiki#flow-control)
+ [Experimental Features](https://github.com/webqit/quantum-js/wiki#experimental-features)

## Examples

Using the Quantum JS and Observer API polyfills, the following examples work today. While we'll demonstrate the most basic forms of these scenarios, it takes roughly the same principles to build more intricate equivalents.

<details><summary>Example 1: <i>Reactive Custom Elements</i><br>
└───────── </summary>

Manual reactivity accounts for a large part of the UI code we write today. But, what if we could simply write "Quantum" logic?

In this example, we demonstrate a custom element that has a Quantum `render()` method. We invoke the `render()` method only once and let every subsequent *prop* change be statically reflected:

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

  // Using the QuantumFunction constructor
  render = QuantumFunction(`
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

<details><summary>Example 2: <i>Pure Computations</i><br>
└───────── </summary>

Even outside of UI code, we often still need to write reactive logic! Now, what if we could simply write "Quantum" logic?

In this example, we demonstrate a simple way to implement something like the [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) API - where you have many interdependent properties!

```js
class MyURL {

  constructor(href) {
    // The raw url
    this.href = href;
    // Initial computations
    this.compute();
  }

  compute = QuantumFunction(`
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

## Getting Involved

All forms of contributions are welcome at this time. For example, syntax and other implementation details are all up for discussion. Also, help is needed with more formal documentation. And here are specific links:

+ [Project](https://github.com/webqit/quantum-js)
+ [Documentation](https://github.com/webqit/quantum-js/wiki)
+ [Discusions](https://github.com/webqit/quantum-js/discussions)
+ [Issues](https://github.com/webqit/quantum-js/issues)

## License

MIT.

[npm-version-src]: https://img.shields.io/npm/v/@webqit/quantum-js?style=flat&colorA=black&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/@webqit/quantum-js
[npm-downloads-src]: https://img.shields.io/npm/dm/@webqit/quantum-js?style=flat&colorA=black&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/@webqit/quantum-js
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@webqit/quantum-js?style=flat&colorA=black&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=@webqit/quantum-js
[license-src]: https://img.shields.io/github/license/webqit/quantum-js.svg?style=flat&colorA=black&colorB=F0DB4F
[license-href]: https://github.com/webqit/quantum-js/blob/master/LICENSE
