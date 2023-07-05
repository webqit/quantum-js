# Reflex Functions

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/reflex-functions" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/reflex-functions.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/reflex-functions" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/reflex-functions.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES --> 

**[Motivation](#motivation) • [Overview](#an-overview) • [Usecases](#usecases) • [Documentation](#documentation) • [Polyfill](#the-polyfill) • [Getting Involved](#getting-involved) • [License](#license)**

Reflex Functions are a new type of JavaScript function that enables fine-grained Reactive Programming in the *imperative* form of the language - wherein reactivity is drawn entirely on the dependency graph of your own code!

This is an upcoming proposal! (Introducing Imperative Reactive Programming (IRP) in JavaScript!)

## Motivation

Reactivity has hostorically relied on a lot of runtime techniques and compiler magics, has required much manual work, and overall, constituted a fundamental paradigm shift to how we build applications. Approaches have often eaten away at the idiomatic use of the language, taken a toll on performance, and fiendishly messed with our brain with tricky runtime behaviours!

This is discussed extensively in [the introductory blog post](https://dev.to/oxharris/re-exploring-reactivity-and-introducing-the-observer-api-and-reflex-functions-4h70)

We realized that we could solve the Language of Reactivity down to plain "JavaScript" - in both the *literal* form and *linear* flow of the language, in a way that translates well to a native language feature! This is what we explore now as Reflex Functions!

## An Overview

Imagine a function that works like any other function - e.g. accepts a number of arguments:

```js
function calculate(a, b) {
  console.log('Operand #1:', a);
  console.log('Operand #2:', b);
  console.log('Total:', a + b);
}
let operand1 = 2;
let operand2 = 3;
calculate(operand1, operand2);
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
operand2 = 8;
reflect('b'); // "b" being what the function sees
```

<details><summary>Console</summary>

```js
Operand #2: 8
Total: 10
```

</details>

Giving you fine-grained reactivity *at the precision of the individual expressions*!

This is what you have of Reflex Functions, and here's how it works:

Reflex Functions have a distinguishing syntax: a double star notation.

```js
function** calculate() {
  // Function body
}
```

> See [Formal Syntax](https://github.com/webqit/reflex-functions/wiki#formal-syntax) for details.

Function body is any regular piece of code that should statically reflect changes to its external dependencies:

```js
let count = 10; // External dependency
function** calculate(factor) {
  // Reactive expressions
  let doubled = count * factor;
  console.log(doubled);
}
```

Return value is a two-part array that contains both the function's actual return value and a special `reflect` function for getting the function to reflect updates:

```js
let [ returnValue, reflect ] = calculate(2);
console.log(returnValue); // undefined
```

<details><summary>Console</summary>

| doubled | returnValue |
| ------- | ----------- |
| `20`    | `undefined` |

</details>

The `reflect()` function takes just the string representation of the external dependencies that have changed:

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

`┌─` a change *happens outside* of function scope

`└─` is *propagated into* function, then *self-propagates down* `─┐`

Changes within the function body itself *self-propagate* down the scope, but re-running only those expressions that depend on the specific change, and rippling down the dependency graph!

Below is a good way to see that: a Reflex Function having `score` as an external dependency, with "reflex lines" having been drawn to show the dependency graph for that variable, or, in other words, the deterministic update path for that dependency:

![Code with reflex lines](https://github.com/webqit/reflex-functions/blob/master/resources/reflex-lines-1.png)

<!--
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
-->

It turns out to be the very mental model you would have drawn if you set out to think about your own code! Everything works **in just how anyone would *predict* it**!

Plus, there's a hunble brag: that "pixel-perfect" level of fine-grained reactivity that the same algorithm translates to - which you could never model manually; that precision that means *no more*, *no less* performance - which you could never achieve with manual optimization; yet, all without working for it!

## Usecases

+ [Usecase: *Reactive Custom Elements*](#usecase-reactive-custom-elements)
+ [Usecase: *Compile Target*](#usecase-compile-target)
+ [Usecase: *Pure Computations*](#usecase-pure-computations)

### Usecase: *Reactive Custom Elements*

Reactivity with Custom Elements has often relied on manual change-propagation techniques and, in some cases, custom syntaxes that themselves rely on a compile step! ([Lit](https://lit.dev/), for example, follows a "HTML as string" approach for DOM structure - albeit via JavaScript template strings!) **But what if we could decouple behaviour and presentation and just write *normal* rendering logic and yet gain fine-grained reactivity on top of that?**

This is one thing that Reflex Functions could help with!

#### *Example 1:*

Below is a custom element that has Reflex Function as its `render()` method. The `render()` method would be invoked only once and subsequent updates would happen via reflections:

```js
customElements.define('click-counter', class extends HTMLElement {

  count = 10;
  connectedCallback() {
    // Full rendering at connected time
    // meaning that the querySelector() calls in there are run as normal
    let [ , reflect ] = this.render();

    // Reflex actions at click time
    // this time, meaning that the querySelector() calls in there don't re-run
    this.addEventListener('click', () => {
      this.count ++;
      reflect([ 'this', 'count' ]);
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

#### *Example 2:*

Below is a repeat of the example above; this time showing how the [Observer API](https://github.com/webqit/observer) may be used to automatically drive updates into the `render` function:

```js
customElements.define('click-counter', class extends HTMLElement {
  
  count = 10;
  connectedCallback() {
    // Full rendering at connected time
    // meaning that the querySelector() calls in there are run as normal
    let [ , reflect ] = this.render();

    // Using the Observer API to automatically drive updates into the render function
    Observer.observe(this, changes => {
      changes.forEach(change => reflect([ 'this', change.key ]));
    });

    // Reflex actions at click time
    // this time, meaning that the querySelector() calls in there don't re-run
    this.addEventListener('click', () => {
      this.count ++;
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

<details><summary>Try it using the polyfill</summary>

The above is possible with the polyfills today with only a few modifications:

1. The above *double star* syntax isn't supported as-is in JavaScript, but you could acheive the same using the `ReflexFunction` constructor as below:

    ```js
    customElements.define('click-counter', class extends HTMLElement {
      constructor(href) {
        const [ , reflect ] = this.render.call(this); // notice the .call(this)
      }

      render = ReflexFunction(`
        // code here
      `);
    });
    ```

    Or you can check out the `PlayElement` mixin below.

2. The literal update expression `this.count++` isn't reactive as-is in JavaScript, but you can acheive the same using the Observer API's mutation methods:

    ```js
    Observer.set(this, 'count', this.count + 1);
    ```

    Or you can "pre-transform" the `count` property to a reactive property:

    ```js
    customElements.define('click-counter', class extends HTMLElement {
      connectedCallback() {
        Observer.accessorize(this, [ 'count' ]);
      }
    });
    ```

</details>

#### *Example 3:*

Below is how the [`PlayElement`](https://github.com/webqit/playui/tree/master/packages/playui-element) Custom Element mixin takes this concept further to bring Reflex-based reactivity to Custom Elements! Here's an example:

```js
customElements.define( 'count-element', class extends PlayElement( HTMLElement ) {
  // List of methods that should be transformed to "reflex" functions
  static get reflexFunctions() {
    return [ 'render' ];
  }

  count = 10;
  connectedCallback() {
    this.addEventListener('click', () => {
      this.count ++;
    });
  }

  render() {
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

└ [Visit `PlayElement`](https://github.com/webqit/playui/tree/master/packages/playui-element)

### Usecase: *Compile Target*

Custom template languages have been designed to support reactivity on the frontend! (Sometimes extending JavaScript with XML-like syntaxes (JSX), and sometimes extending HTML with special directives (`ngIf`, `v-if`, `{#each}{/each}`, etc.) to support various things like data binding, event handling, conditional rendering, looping, and more!) **But what if, instead of re-inventing a new language, we could just write *conventional* JavaScript as template language and gain fine-grained reactivity on top of that?**

You could simply have Reflex Functions as your *compile target*!

#### *Example 1:*

Below is how the [`<script reflex>`](https://github.com/webqit/oohtml#reactive-html) element in the OOHTML suite brings Reflex-based reactivity to HTML - by simply compiling to Reflex Functions under the hood:

```html
<div>
  <script reflex scoped>
    console.log(this) // div

    console.log(this.liveProperty) // live expression

    if (this.bindings.isCollapsed) {
        // Live block
        console.log('Section collapsed!');
    }
  </script>
</div>
```

```js
// Mutate a binding:
divElement.bindings.isCollapsed = true;
```

└ [Visit OOHTML](https://github.com/webqit/oohtml#reactive-html)

### Usecase: *Pure Computations*

Reactivity isn't all a UI thing! Sometimes we find ourself elsewhere manually wiring callbacks to model depencencies that need to stay in sync! (And often, this takes a toll on readability and ergonomics!) But what if we could sometimes just express the logic in its *static* form and *turn on* reactivity on top of it? (Much like an escape hatch out of complexity :))

Consider some of these *pure computational* usecases!

#### *Example 1:*

Below is a simple way to implement something like the [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) API - where you have interdependent properties! Reflex Functions just lets you express the logic and has it binding automatically:

```js
class Url {

  constructor(href) {
    // The raw url
    this.href = href;
    // Initial computations
    const [ , reflect ] = this.compute();

    // Detect updates and reflect them
    Observer.observe(this, changes => {
      changes.forEach(change => reflect([ 'this', change.key ]));
    });

  }

  **compute() {
    // These will be re-computed from this.href always
    let [ protocol, hostname, port, pathname, search, hash ] = parseUrl(this.href);

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
  }

}
```

```js
// Change a property and have it's dependents auto-compute
const url = new Url('https://www.example.com/path');

url.protocol = 'http:';
console.log(url.href); // http://www.example.com/path

url.hostname = 'foo.dev';
console.log(url.href); // http://foo.dev/path
```

#### *Example 2:*

Below is a repeat of the example above; this time showing how we could take advantage of the Observer API's **batching** feature to batch updates and be even more performant:

```js
class Url {

  constructor(href) {
    // The raw url
    this.href = href;
    // Initial computations
    const [ , reflect ] = this.compute();

    // Detect updates and reflect them
    Observer.observe(this, changes => {
      // All the updates from batch() below will now also be reflected as one batch
      let paths = changes.map(change => ([ 'this', change.key ]));
      reflect(...paths);
    });

  }

  **compute() {
    // These will be re-computed from this.href always
    let [ protocol, hostname, port, pathname, search, hash ] = parseUrl(this.href);

    // We batch the operations here so that they're delivered and reflected above as one batch
    Observer.batch(this, () => {
      this.protocol = protocol;
      this.hostname = hostname;
      this.port = port;
      this.pathname = pathname;
      this.search = search;
      this.hash = hash;
    });

    // These individual property assignments each depend on the previous 
    this.host = this.hostname + (this.port ? ':' + this.port : '');
    this.origin = this.protocol + '//' + this.host;
    let href = this.origin + this.pathname + this.search + this.hash;
    if (href !== this.href) { // Prevent unnecessary update
      this.href = href;
    }
  }

}
```

```js
// Change a property and have it's dependents auto-compute
const url = new Url('https://www.example.com/path');

url.port = 1914;
console.log(url.href); // https://www.example.com:1914/path

url.pathname = '/level1/level2';
console.log(url.href); // https://www.example.com:1914//level1/level2
```

<details><summary>Try it using the polyfill</summary>

The above is possible with the polyfills today with only a few modifications:

1. The above *double star* syntax isn't supported as-is in JavaScript, but you could acheive the same using the `ReflexFunction` constructor as below:
    &ensp;

    ```js
    class Url {
      constructor(href) {
        const [ , reflect ] = this.compute.call(this); // notice the .call(this)
      }

      compute = ReflexFunction(`
        // code here
      `);
    }
    ```
    &ensp;

2. The literal update expressions like `this.href = href` aren't reactive as-is in JavaScript, but you can acheive the same using the Observer API's mutation methods:
    &ensp;

    ```js
    Observer.set(this, 'href', href);
    ```
    &ensp;

    Or you can "pre-transform" the properties to reactive properties:
    &ensp;

    ```js
    customElements.define('click-counter', class extends HTMLElement {
      connectedCallback() {
        Observer.accessorize(this, [ 'protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host', 'origin', 'href' ]);
      }
    });
    ```

</details>

#### *Example 3:*

Check out how the [`ReflexFunction.inspect()`](https://github.com/webqit/reflex-functions/wiki#example-usecase) method ties in with the [Observer API](https://github.com/webqit/observer)!

## Documentation

Visit the [docs](https://github.com/webqit/reflex-functions/wiki) for details around [Formal Syntax](https://github.com/webqit/reflex-functions/wiki#formal-syntax), [Heuristics](https://github.com/webqit/reflex-functions/wiki#heuristics), [Flow Control](https://github.com/webqit/reflex-functions/wiki#flow-control) and [Functions](https://github.com/webqit/reflex-functions/wiki#functions), [API](https://github.com/webqit/reflex-functions/wiki#api), etc.

## The Polyfill

Reflex Functions is being developed as something to be used today - via a polyfill. The polyfill features a specialized compiler and a small *runtime* that work together to enable all of Reflex Functions as documented, with quite a few exceptions. Known limitations are in the area of syntax, and these can be found in the relevant parts of the [docs](https://github.com/webqit/reflex-functions/wiki).

<details><summary>Load from a CDN</summary>

```html
<script src="https://unpkg.com/@webqit/reflex-functions/dist/main.js"></script>
```

> This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives:

> `47.8` kB min + gz | `167` KB min [↗](https://bundlephobia.com/package/@webqit/reflex-functions)

```js
// Destructure from the webqit namespace
const { ReflexFunction } = window.webqit;
```

</details>

<details><summary>Install from NPM</summary>

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
externalVar = 20;
result = reflect( 'externalVar' ); // 40
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
  externalVar = 20;
  result = reflect( 'externalVar' ); // 40
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

Reflex Functions Lite is an *async* API:

```js
// External dependency
globalThis.externalVar = 10;

// Initial run
let sum = ReflexFunctionLite( `a`, `b`, `return a + b + externalVar;` );
let [ result, reflect ] = await sum(10, 10); // 30

// Reflections
externalVar = 20;
result = await reflect( 'externalVar' ); // 40
```

But being that the Reflex Functions Compiler is designed as a movable peice, it is all still possible to explicitly and synchronously load it alongside the *Lite* script - thus acheiving the exact same thing about the main build above, including being usable in **sync** mode.

```html
<head>
  <script src="https://unpkg.com/@webqit/reflex-functions/dist/compiler.js"></script> <!-- Must come before the polyfil -->
  <script src="https://unpkg.com/@webqit/reflex-functions/dist/lite.js"></script>
</head>
```

## Getting Involved

All forms of contributions are welcome at this time. For example, syntax and other implementation details are all up for discussion. Also, help is needed with more formal documentation. And here are specific links:

+ [Project](https://github.com/webqit/reflex-functions)
+ [Documentation](https://github.com/webqit/reflex-functions/wiki)
+ [Discusions](https://github.com/webqit/reflex-functions/discussions)
+ [Issues](https://github.com/webqit/reflex-functions/issues)

## License

MIT.
