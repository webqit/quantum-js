# Reflex Functions

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/reflex-functions" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/reflex-functions.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/reflex-functions" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/reflex-functions.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES --> 

**[Motivation](#motivation) • [Overview](#an-overview) • [Polyfill](#the-polyfill) • [Design Discussion](#design-discussion) • [Getting Involved](#getting-involved) • [License](#license)**

Reflex Functions are a new type of JavaScript functions that enable fine-grained Reactive Programming in the *imperative* form of the language - this time, where reactivity is drawn entirely on the dependency graph of your own code!

Reflex Functions is an upcoming proposal! (Introducing Imperative Reactive Programming (IRP) in JavaScript!)

## Motivation

Reactivity has hostorically relied on a lot of runtime techniques and compiler magics, has required much manual plumbing, and overall, constituted a fundamental paradigm shift to how we build applications. Approaches have often eaten away at the idiomatic use of the language, taken a toll on performance, and fiendishly messed with our brain with tricky runtime behaviours!

This is discussed extensively in [the introductory blog post](https://dev.to/oxharris/on-the-language-of-reactivity-part-1-and-introducing-the-observer-api-pkn-temp-slug-2525455?preview=74f1766eb6ae03dff8a4ceee33c4b1b534dc2fb007ddfc9e651e6e03ef59394d784f84e98d50cc7f1b48584585153af5fb1516c3d2555a80510d77d9)<sup>draft</sup>

We realized that we could solve the idea of Reactivity down to just plain "JavaScript" - in both the *literal* form and *linear* flow of the language, in a way that translates well to a native language feature! This is what we explore now as Reflex Functions!

## An Overview

Imagine a function that works like any other function - e.g. accepts a number of arguments:

```js
function calculate(a, b) {
  console.log('Operand #1:', a);
  console.log('Operand #2:', b);
  console.log('Total:', a + b);
}
calculate(2, 3);
```

<details><summary>Console</summary>

```js
Operand #1: 2
Operand #2: 3
Total: 5
```

</details>

But has a special ability to statically "reflect" changes to its external dependencies - e.g. those arguments:

```js
b = 8;
reflect('b');
```

<details><summary>Console</summary>

```js
Operand #2: 8
Total: 10
```

</details>

Giving you fine-grained reactivity *at the precision of the dependency graph of your own code*!

Okay, here's how it works:

Reflex Functions have a distinguishing syntax: a double star notation.

```js
function** calculate() {
  // Function body
}
```

> See [Formal Syntax](https://github.com/webqit/reflex-functions/wiki#formal-syntax) for details.

Function body is any regular piece of code that needs to be automatically maintained as a "reflex" with its dependencies:

```js
let count = 10; // External dependency
function** calculate(factor) {
  // Reactive expressions
  let doubled = count * factor;
  console.log(doubled);
}
```

Return value is a two-part array that contains both the function's actual return value and a special `reflect` function for getting the reflex to reflect updates:

```js
let [ returnValue, reflect ] = calculate(2);
console.log(returnValue); // undefined
```

<details><summary>Console</summary>

| doubled | returnValue |
| ------- | ----------- |
| `20`    | `undefined` |

</details>

The `reflect()` function takes just the string representation of the external dependencies that have changed and need to be reflected in the reflex:

```js
count = 20;
reflect('count');
```

<details><summary>Console</summary>

| doubled |
| ------- |
| `40`    |

</details>

Path dependencies are expressed in array notation. And multiple dependencies can be reflected at once, if they changed at once:

```js
count++;
this.property = value;
reflect('count', [ 'this', 'property' ]);
```

### Change Propagation

Reactivity exists with Reflex Functions where there are dependencies "up" the scope to respond to! And here's the mental model for that:

`┌─` a change *happens outside* function scope

`└─` is *propagated into* function, then *self-propagates down* `─┐`

Changes within the function body itself is *self-propagation* all the way, going "top-down" the scope, but re-running only those expressions that depend on the specific change, and rippling down the dependency graph!

Below is a good way to see that: a Reflex Function having `score` as an external dependency, with lines having been drawn to show the dependency graph for that variable, or, in other words, the deterministic update path for that dependency:

```js
let score = 40;
```

```js
function** ui() {
  let divElement = document.createElement('div');
  // >>─────────┐
  let tense = score > 50 ? 'passed' : 'failed';
  //    └─>────────────────────────────────────┐
  let message = `Hi ${ p.firstName }, you ${ tense } this test!`;
  //    │
  let sp│anElement = document.createElement('span');
  //    └─>──────────────┐
  let fullMessage = [ message, ' ', 'Thank you!' ].join( '' );
  //    └─>─────────────────────────────┐
  let broadcast = { [ p.username ]: fullMessage };
  //    │
  let se│ctionElement = document.createElement('section');
  //    ├─>─────────────────────────────────────────┐
  let br│oadcastInstance = new BroadcastMessage( broadcast );
  //    └─>───────┐ └─>──────────┐
  console.log( broadcast, broadcastInstance );

  document.body.append(divElement, spanElement, sectionElement);
}
```

```js
let [ returnValue, reflect ] = ui();
```

It turns out to be the very mental model you would have drawn as you set out to think about your code; **in just how anyone would *predict* it**!

Plus, there's a hunble brag: that "pixel-perfect" level of fine-grained reactivity that the same algorithm translates to - which you could never model manually; that precision that means *no more*, *no less* performance - which you could never achieve with manual optimization; yet, all without working for it!

### Documentation

There's a whole lot possible here  which is covered in [the docs](https://github.com/webqit/reflex-functions/wiki).

### Examples

**--> Example 1:** Below is a custom element that has Reflex Function as its `render()` method. The `render()` method has only been called once, and subsequent updates are just a fine-grained reflection.

```js
customElements.define('click-counter', class extends HTMLElement {
  count = 10;
  connectedCallback() {
    // Full rendering at connected time
    // The querySelector() calls below are run
    let [ , reflect ] = this.render();

    // Fine-grained rendering at click time
    // The querySelector() calls below don't run again
    this.addEventListener('click', () => {
      this.count ++;
      treflect([ 'this', 'count' ]);
    });
  }
  **render() {
    let countElement = document.querySelector( '#count' );
    countElement.innerHTML = this.count;
    
    let doubleCount = this.count * 2;
    let doubleCountElement = document.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    let quadCount = doubleCount * 2;
    let quadCountElement = document.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;
  }
});
```

<details><summary><b>Try it</b></summary>

While the above syntax isn't supported as-is by the polyfill, you may find the [Play UI PlayElement](https://github.com/webqit/playui/tree/master/packages/playui-element) mixin useful in this regard.

</details>

## The Polyfill

Reflex Functions is being developed as something to be used today - via a polyfill. The polyfill features a specialized compiler and a small *runtime* that work together to enable all of Reflex Functions as documented, with quite a few exceptions. Known limitations are in the area of syntax, and these can be found in the relevant parts of the [docs](https://github.com/webqit/reflex-functions/wiki).

<details><summary>Load from a CDN</summary>

```html
<script src="https://unpkg.com/@webqit/reflex-functions/dist/main.js"></script>
```

> This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives:

> 47.8 kB min + gz | 167 KB min [↗](https://bundlephobia.com/package/@webqit/reflex-functions)

```js
// Destructure from the webqit namespace
const { ReflexFunction } = window.webqit;
```

</details>

<details><summary>Install from a NPM</summary>

```js
// npm install
npm i @webqit/reflex-functions
```

```js
// Import API
import { ReflexFunction } from '@webqit/reflex-functions';
```

</details>

The current polyfill only supports the constructable form of Reflex Functions:

```js
// External dependency
globalThis.externalVar = 10;

// Initial run
let sum = ReflexFunction( `a`, `b`, `return a + b + externalVar;` );
let [ result, reflect ] = sum(10, 10); // 30

// Reflections
result = reflect( 'externalVar' ); // 30
```

But the double star syntax is supported from within the function itself:

```js
const reflex = ReflexFunction(`
  // External dependency
  let externalVar = 10;

  // Initial run
  function** sum( a, b ) {
    return a + b + externalVar;
  }
  let [ result, reflect ] = sum( 10, 10 ); // 30

  // Reflections
  result = reflect( 'externalVar' ); // 30
`);
reflex();
```

### Reflex Functions Lite

It is possible to use a lighter version of Reflex Functions where the bundle size of the main build above will impact *initial* application loading. The *Lite* version initially comes without the compiler and yet let's you work with Reflex Functions ahead of that.

This lazy-loading strategy **also means that the Reflex Functions API will *only* be available in [*async* mode](https://github.com/webqit/reflex-functions/wiki#async-mode)**! (This *async* mode is what makes it possible to load the compiler lazily!) And it comes with an additional perk: the compiler is loaded into a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and all compilations are able to happen off the main thread!

<details><summary>Load from a CDN</summary>

```html
<script src="https://unpkg.com/@webqit/reflex-functions/dist/lite.js"></script>
```

> This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives:

<!--
> 47.8 kB min + gz | 167 KB min [↗](https://bundlephobia.com/package/@webqit/reflex-functions/dist/lite.js)
-->

```js
// Destructure from the webqit namespace
const { ReflexFunction: ReflexFunctionLite } = window.webqit;
```

</details>

<details><summary>Install from a NPM</summary>

```js
// npm install
npm i @webqit/reflex-functions
```

```js
// Import Lite API
import { ReflexFunctionLite } from '@webqit/reflex-functions';
```

</details>

Reflex Functions Lite comes this way in *async* mode:

```js
// External dependency
globalThis.externalVar = 10;

// Initial run
let sum = ReflexFunctionLite( `a`, `b`, `return a + b + externalVar;` );
let [ result, reflect ] = await sum(10, 10); // 30

// Reflections
result = await reflect( 'externalVar' ); // 30
```

But just for the fact that the Reflex Functions Compiler is designed as a movable peice, it is all still possible to explicitly and synchronously load it alongside the *Lite* script - thus acheiving the exact same thing about the main build above, including being usable in **sync** mode.

```html
<head>
  <script src="https://unpkg.com/@webqit/reflex-functions/dist/compiler.js"></script> <!-- Must come before the polyfil -->
  <script src="https://unpkg.com/@webqit/reflex-functions/dist/main.js"></script>
</head>
```

## Design Discussion

*[TODO]*

## Getting Involved

All forms of contributions are welcome at this time. For example, syntax and other implementation details are all up for discussion. Also, help is needed with more formal documentation. And here are specific links:

+ [Project](https://github.com/webqit/reflex-functions)
+ [Documentation](https://github.com/webqit/reflex-functions/wiki)
+ [Discusions](https://github.com/webqit/reflex-functions/discussions)
+ [Issues](https://github.com/webqit/reflex-functions/issues)

## License

MIT.
