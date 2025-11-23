# UseLive — Live Mode for JavaScript

[![npm version][npm-version-src]][npm-version-href]<!--[![npm downloads][npm-downloads-src]][npm-downloads-href]-->
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

[Overview](#overview) • [Creating Live Programs](#creating-live-programs) • [Implementation](#implementation) • [Examples](#examples) • [License](#license)

**UseLive** (`"use live"`) is a runtime extension to JavaScript that enables live execution mode in JavaScript.

What's that?

## Overview

Where you normally would require certain reactive primitives to express reactive logic...

```js
// Import reactive primitives
import { createSignal, createMemo, createEffect } from "solid-js";

// Declare values
const [count, setCount] = createSignal(5);
const doubleCount = createMemo(() => count() * 2);
// Log this value live
createEffect(() => {
  console.log(doubleCount());
});
```

```js
// Setup periodic updates
setInterval(() => setCount(10), 1000);
```

The `"use live"` directive gives you same reactive behavior on top of your ordinary imperative code:

```js
"use live";
// Declare values
let count = 5;
let doubleCount = count * 2;
// Log this value live
console.log(doubleCount);
```

```js
// Setup periodic updates
setInterval(() => {
  "use live";
  count = 10;
}, 1000);
```

To try:

1. Add the following script to your page:

```html
<script src="https://unpkg.com/@webqit/oohtml/dist/main.js"></script>
```

2. Write your logic with a `use live` directive:

```html
<script>
  "use live";
  // Declare values
  let count = 5;
  let doubleCount = count * 2;
  // Log this value live
  console.log(doubleCount);

  // Setup periodic updates
  setInterval(() => {
    "use live";
    count = 10;
  }, 1000);
</script>
```

3. Watch your console.

To go one step further, update your step 2 to split the logic into two separate scripts:

2.:

```html
<script>
  "use live";
  // Declare values
  let count = 5;
  let doubleCount = count * 2;
  // Setup periodic updates
  setInterval(() => {
    "use live";
    count = 10;
  }, 1000);
</script>
```

```html
<script>
  "use live";
  // Log this value live
  console.log(doubleCount);
</script>
```

Watch your console. Reactivity should still work.

To define, **live programs are JavaScript programs that stay sensitive to changes in program state in fine-grained details - and with no moving parts**.

While that is the `<script>"use live"</script>` part of the HTML page above, there are many different forms of live programs. Examples are [just ahead](#examples).

> [!NOTE]
> This project pursues a futuristic, more efficient way to write reactive applocations. And it occupies a new category in the reactivity spectrum.

> [!NOTE]
> You’re viewing **@webqit/use-live** — the newest iteration.  
> For the prev 4.6.x branch, see [webqit/use-live@0.3.*](https://github.com/webqit/use-live/tree/4.6.3).

<!--
## Idea

<details><summary>Show</summary>

Imperative programs are really the foundation for "state", "effect" and much of what we try to model today at an abstract level using, sometimes, functional reactive primitives as above, and sometimes some other means to the same end. Now, that's really us _re-implementing existing machine-level concepts_ that should be best left to the machine!

<details><summary>Learn more</summary>

Right in how the instructions in an imperative program "act" on data - from the assignment expression that sets or changes the data held in a local variable (`count = 10`) to the `delete` operator that mutates some object property (`delete object.value`), to the "if" construct that determines the program's execution path based on a certain state - we can see all of "state" (data), "effect" (instructions that modify state/data), and control structures (instructions informed by state, in turn) at play!

But what we don't get with how this works naturally is having the said instructions stay sensitive to changes to the data they individually act on! (The runtime simply not maintaining that relationship!) And that's where the problem lies; where a whole new way of doing things becomes necessary - wherein we have to approach literal operations programmatically: `setCount(10)` vs `count = 10`.

</details>

If we could get the JS runtime to add "reactivity" to how it already works - i.e. having the very instructions stay sensitive to changes to the data they individually act on - we absolutely would be enabling reactive programming in the imperative form of the language and entirely unnecessitating the manual way!

This is what we're exploring with UseLive!

└ You may want to learn more in the introductory article: [Re-Exploring Reactivity and Introducing the Observer API and Reflex Functions](https://dev.to/oxharris/re-exploring-reactivity-and-introducing-the-observer-api-and-reflex-functions-4h70)

</details>

## Status

+ Actively maintained
+ A working implementation
+ Integral to the [OOHTML project](https://github.com/webqit/oohtml)
+ Open to contributions

-->

## Implementation

As seen above, UseLive can run in the browser.

Up there, we've used a version of the UseLive implementation that supports HTML `<script>` elements. UseLive works in HTML via the OOHTML project ([OOHTML](https://github.com/webqit/oohtml)) and it's the most direct way to use UseLive in the browser.

That said, UseLive is directly usable in many different ways — both in the browser and in Node.js.

### UseLive in the browser

<details><summary>Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/use-live"><img align="right" src="https://img.shields.io/bundlephobia/minzip/@webqit/use-live?label=&style=flat&colorB=black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/use-live/dist/main.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives.

```js
// Destructure from the webqit namespace
const {
  LiveFunction,
  AsyncLiveFunction,
  LiveScript,
  LiveModule,
  LiveMode,
  Observer,
} = window.webqit;
```

</details>

### UseLive in Node.js

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/use-live"><img align="right" src="https://img.shields.io/npm/v/@webqit/use-live?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/use-live
```

```js
// Import API
import {
  LiveFunction,
  AsyncLiveFunction,
  LiveScript,
  AsyncLiveScript,
  LiveModule,
  LiveMode,
  Observer,
} from "@webqit/use-live";
```

</details>

### UseLive Lite

It is possible to use a lighter version of UseLive where you want something further feather weight for your initial application load.

<details><summary>
Load from a CDN<br>
└───────── <a href="https://bundlephobia.com/result?p=@webqit/use-live"><img align="right" src="https://img.shields.io/badge/10.8%20kB-black"></a></summary>

```html
<script src="https://unpkg.com/@webqit/use-live/dist/main.lite.js"></script>
```

└ This is to be placed early on in the document and should be a classic script without any `defer` or `async` directives!

```js
// Destructure from the webqit namespace
const { AsyncLiveFunction, AsyncLiveScript, LiveModule, LiveMode, Observer } =
  window.webqit;
```

<details><summary>Additional details</summary>

The Lite APIs initially come without the compiler and yet lets you work with UseLive ahead of that. Additionally, these APIs are able to do their compilation off the main thread by getting the UseLive compiler loaded into a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)!

> But if you may, the UseLive Compiler is all still loadable directly - as if short-circuiting the lazy-loading strategy of the Lite APIs:
>
> ```html
> <head>
>   <script src="https://unpkg.com/@webqit/use-live/dist/compiler.js"></script>
>   <!-- Must come before the polyfil -->
>   <script src="https://unpkg.com/@webqit/use-live/dist/main.lite.js"></script>
> </head>
> ```

</details>

</details>

<details><summary>Install from NPM<br>
└───────── <a href="https://npmjs.com/package/@webqit/use-live"><img align="right" src="https://img.shields.io/npm/v/@webqit/use-live?style=flat&label=&colorB=black"></a></summary>

```js
// npm install
npm i @webqit/use-live
```

```js
// Import Lite API
import {
  AsyncLiveFunction,
  AsyncLiveScript,
  LiveModule,
  LiveMode,
  Observer,
} from "@webqit/use-live/lite";
```

</details>

## Creating Live Programs

### Live Functions

You declare live functions by adding the `"use live"` directive as first statement in the function body. And you can also use the `LiveFunction` and `AsyncLiveFunction` APIs. (The first option requires a compile step, the second doesn't.)

#### The `"use live"` Directive (Option 1)

_**Function Declarations**_

```js
function bar() {
  "use live";
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
bar();
```

```js
async function bar() {
  "use live";
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
}
await bar();
```

<details><summary>Show more syntax examples</summary>

_**Function Expressions**_

```js
const bar = function () {
  "use live";
};
const bar = async function () {
  "use live";
};
```

_**Object Properties**_

```js
const foo = {
  bar: function () {
    "use live";
  },
};
const foo = {
  bar: async function () {
    "use live";
  },
};
```

_**Object Methods**_

```js
const foo = {
  bar() {
    "use live";
  },
};
const foo = {
  async bar() {
    "use live";
  },
};
```

_**Class Methods**_

```js
class Foo {
  bar() {
    "use live";
  },
}
class Foo {
  async bar() {
    "use live";
  },
}
```

_**Arrow Functions**_

```js
const bar = () => {
  "use live";
};
const bar = async () => {
  "use live";
};
```

</details>

If you have a build process for your app, you can use the UseLive compiler to compile your live functions. It's easy:

```js
import { compile } from "@webqit/use-live";

const inputSource = `
    function bar() {
      "use live";
      let count = 5;
      let doubleCount = count * 2;
      console.log(doubleCount);
    }
`;

const resultString = compile('function', inputSource);
```

Or to compile files conditionally:

```js
import { parse, compile } from "@webqit/use-live";

const ast = parse(inputSource);
if (ast.isLiveProgram || ast.hasLiveFunctions) {
    const resultString = compile('function', ast);
}
```

> Plugins for bundlers like esbuild and rollup are available soon.

#### Live Function Constructors (Option 2)

UseLive has the concept of [function constructors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) that allow you to create functions at runtime — without a build step. You obtain the APIs as shown below:

```js
// Import API
import {
  LiveFunction,
  AsyncLiveFunction,
} from "@webqit/use-live";
```

or, if loaded in the browser:

```js
// Destructure from the webqit namespace
const {
  LiveFunction,
  AsyncLiveFunction,
} = window.webqit;
```

Here, `LiveFunction` and `AsyncLiveFunction` give you the equivalent of `function() {}` and `async function() {}` respectively.

```js
const bar = LiveFunction(`
  let count = 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
bar();
```

```js
const bar = AsyncLiveFunction(`
  let count = await 5;
  let doubleCount = count * 2;
  console.log(doubleCount);
`);
await bar();
```

<details><summary>Show more syntax examples</summary>

```js
// With function parameters
const bar = LiveFunction(param1, ...paramN, functionBody);
```

```js
// With the new keyword
const bar = new LiveFunction(param1, ...paramN, functionBody);
```

```js
// As class property
class Foo {
  bar = LiveFunction(param1, ...paramN, functionBody);
}
```

</details>

Global variables are accessible in the body of these constructed functions.

```js
// External dependency
globalThis.externalVar = 10;

// LiveFunction
const sum = LiveFunction(`a`, `b`, `return a + b + externalVar;`);
const state = sum(10, 10);

// Inspect
console.log(state.value); // 30
```

And note that as is the noraml behaviour of *function constructors* in JavaScript, only the global scope is accessible as shown. Variables in the surrounding scope are not accessible:

```js
let a;
globalThis.b = 2;
var c = "c"; // Equivalent to globalThis.c = 'c' assuming that we aren't running in a function scope or module scope

const bar = LiveFunction(`
  console.log(typeof a); // undefined
  console.log(typeof b); // number
  console.log(typeof c); // string
`);
bar();
```

> Note that, unlike the main UseLive build, the UseLive Lite edition only implements the `AsyncLiveFunction` API.

### Live Scripts (Whole Programs)

UseLive has the concept of whole scripts as live programs — whether classic scripts or module scripts. You use either the `"use live"` directive (which requires a compile step) or the `LiveScript` and `LiveModule` APIs (which don't).

#### The `"use live"` Directive (Option 1)

```js
// script: index.js
"use live";
globalThis.count = 0;
setInterval(() => {
  count++;
}, 1000);
```

```js
// module: index.js
"use live";
// Import dependencies where needed
import module1, { module2 } from 'package-name';

// Export a live variable
export let count = 0;

// Update the variable every second
setInterval(() => {
  count++;
}, 1000);
```

As in the case of live functions above, these can be compiled as part of your application's build process. (In the compilation example above, you'll get `ast.isLiveProgram === true` for these scripts.)

#### The `LiveScript` and `LiveModule` APIs (Option 2)

These APIs give you the equivalent of `<script>` and `<script type="module">` respectively. You obtain the APIs as shown below:

```js
// Import API
import {
  LiveModule,
  LiveScript,
  AsyncLiveScript,
} from "@webqit/use-live";
```

Or, if loaded in the browser:

```js
const {
  LiveModule,
  LiveScript,
  AsyncLiveScript,
} = window.webqit;
```

Here, `LiveModule`, `LiveScript`, and `AsyncLiveScript` give you the equivalent of `<script type="module">`, `<script>`, and `<script async>` respectively.

```js
// Live module
const program = new LiveModule(`
  // Import dependencies where needed
  import module1, { module2 } from 'package-name';

  // Export a live variable
  export let count = 0;

  // Update the variable every second
  setInterval(() => {
    count++;
  }, 1000);
`);
await program.execute();
```

```js
const program = new LiveScript(`
  globalThis.count = 0;
  setInterval(() => {
    count++;
  }, 1000);
`);
program.execute();
```

> Note that, unlike the main UseLive build, the UseLive Lite edition only implements the `AsyncLiveScript` and `LiveModule` APIs.

## Consuming Live Programs

Each call to a Live function or script returns back a `LiveMode` object that lets you access values exposed by the program.

For Live functions:

```js
const liveMode = bar();
```

For Live scripts:

```js
const liveMode = program.execute();
```

For Live HTML scripts - `<script>"use live"</script>`, the `liveMode` object is available as a direct property of the script element:

```js
console.log(script.liveMode);
```

### Return Value

For functions, the `LiveMode` object exposes a `value` property that carries the program's actual return value:

```js
function sum(a, b) {
  "use live";
  return a + b;
}
```

```js
const liveMode = sum(5, 4);
console.log(liveMode.value); // 9
```

But given the concept of "live", `liveMode.value` is a "live" property that always reflects the program's return value at any point in time:

```js
function counter() {
  "use live";
  let count = 0
  setInterval(() => count++, 500);
  return count;
}
```

```js
const liveMode = counter();
console.log(liveMode.value); // 0
```

The general-purpose, object-observability API: [Observer API](https://github.com/webqit/observer) may be used to observe changes to the `value` property:

```js
Observer.observe(liveMode, "value", (mutation) => {
  //console.log(liveMode.value); Or:
  console.log(mutation.value); // 1, 2, 3, 4, etc.
});
```

### Module Exports

For module programs, the `LiveMode` object exposes an `exports` property that produces the module's exports:

```js
const liveMode = await program.execute();
console.log(liveMode.exports); // { count }
```

But given the concept of "live", each property in the `liveMode.exports` object is a "live" property that always reflects an export's internal value at any point in time:

```js
const program = new LiveModule(`
  export let localVar = 0;
  ...
  setInterval(() => localVar++, 500);
`);
```

```js
const state = await program.execute();
console.log(state.exports); // { localVar }
```

Again, the Observer API puts those changes in your hands:

```js
Observer.observe(state.exports, 'localVar', (mutation) => {
  console.log(mutation.value); // 1, 2, 3, 4, etc.
});
```

```js
// Observe "any" export
Observer.observe(state.exports, (mutations) => {
  mutations.forEach((mutation) => console.log(mutation.key, mutation.value));
});
```

## Aborting Live Programs

Live programs may maintain many live relationships and should be aborted when their work is done! The `LiveMode` object they return exposes an `abort()` method that lets us do that:

```js
liveMode.abort();
```

For Live HTML Scripts - `<script>"use live"</script>`, this cleanup is automatic as script element leaves the DOM!

## Interaction with the Outside World

Live programs can read and write to the given scope in which they run; just in how a regular JavaScript function can reference outside variables and also make side effects:

```js
let a = 2, b;
function bar() {
  "use live";
  b = a * 2;
  console.log('Total:', b);
}
bar();
```

But as an extension to regular JavaScript, Live programs maintain a live relationship with the outside world! This means that:

### ...Updates Happening On the Outside Are Automatically Reflected

Given the code above, the following will now be reflected:

```js
// Update external dependency
a = 4;
```

The above dependency and reactivity hold the same even if you had `a` in the place of a parameter's _default value_:

```js
let a = 2, b = 0;
function bar(param = a) {
  "use live";
  b = param * 2;
  console.log('Total:', b);
}
bar();
```

And you get the same automatic dependency tracking with object properties:

```js
// External value
const obj = { a: 2, b: 0 };
```

```js
function bar() {
  "use live";
  obj.b = obj.a * 2;
  console.log('Total:', obj.b);
}
bar();
```

```js
// Update external dependency
obj.a = 4;
```

### ...Updates Happening On the Inside Are Observable

Given the same data binding principles, you are able to observe updates the other way round as to the updates made from the inside of the function: `b = 4`, `obj.b = 4`!

For updates to object properties, you use the Observer API directly:

```js
// Observe changes to object properties
const obj = { a: 2, b: 0 };
Observer.observe(obj, "b", (mutation) => {
  console.log("New value:", mutation.value);
});
```

The above also holds for global variables:

```js
// Observe changes to global variables
b = 0; // globalThis.b = 0;
Observer.observe(globalThis, "b", (mutation) => {
  console.log("New value:", mutation.value);
});
```

And for updates to local variables, while you can't use the Observer API directly (as local variables aren't associated with a physical object as we have of global variables)...

```js
let b = 0;
Observer.observe(?, 'b', () => { ... });
```

...you can use a Live function itself to achieve the exact:

```js
(function () {
  "use live";
  console.log('New value:', b);
})();
```

...and, where necessary, you could next map those changes to an object that you intend to use the Observer API on:

```js
(function () {
  "use live";
  obj.b = b;
})();
Observer.observe(obj, 'b', () => { ... });
```

## Detailed Documentation

**Coming soon!** The docs in the wiki are for a previous version of UseLive, but may give an idea of advanced concepts.

- [Wiki](https://github.com/webqit/use-live/wiki)

## Examples

Using the UseLive and the Observer API, the following examples work today. While we demonstrate the most basic forms of these scenarios, it takes roughly the same principles to build more intricate equivalents.

<details><summary>Example 1: <i>A Custom Element-Based Counter</i><br>
└───────── </summary>

This is a custom element that works as a counter. Notice that the magic is in its live `render()` method. Reactivity starts at _connected_ time (on calling the `render()` method), and stops at _disconnected_ time (on calling dispose)!

```js
customElements.define(
  "click-counter",
  class extends HTMLElement {
    count = 10;

    connectedCallback() {
      // Initial rendering
      this._state = this.render();
      // Static reflection at click time
      this.addEventListener("click", () => {
        this.count++;
      });
    }

    disconnectCallback() {
      // Cleanup
      this._state.abort();
    }

    // Using the LiveFunction constructor
    render = LiveFunction(`
    let countElement = this.querySelector('#count');
    countElement.innerHTML = this.count;
    
    let doubleCount = this.count * 2;
    let doubleCountElement = this.querySelector('#double-count');
    doubleCountElement.innerHTML = doubleCount;
    
    let quadCount = doubleCount * 2;
    let quadCountElement = this.querySelector('#quad-count');
    quadCountElement.innerHTML = quadCount;
  `);
  }
);
```

```html
<click-counter style="display: block; padding: 1rem;">
  Click me<br />
  <span id="count"></span><br />
  <span id="double-count"></span><br />
  <span id="quad-count"></span>
</click-counter>
```

</details>

<details><summary>Example 2: <i>A Custom <code>URL</code> API</i><br>
└───────── </summary>

This is a simple replication of the [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) API - where you have many interdependent properties! Notice that the magic is in its live `compute()` method which is called from the constructor.

```js
const MyURL = class {
  constructor(href) {
    // The raw url
    this.href = href;
    // Initial computations
    this.compute();
  }

  compute = LiveFunction(`
    // These will be re-computed from this.href always
    let { protocol, hostname, port, pathname, search, hash } = new URL(this.href);

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
};
```

```js
// Instantiate
const url = new MyURL("https://www.example.com/path");

// Change a property
url.protocol = "http:"; //Observer.set(url, 'protocol', 'http:');
console.log(url.href); // http://www.example.com/path

// Change another
url.hostname = "foo.dev"; //Observer.set(url, 'hostname', 'foo.dev');
console.log(url.href); // http://foo.dev/path
```

</details>

## Getting Involved

All forms of contributions are welcome at this time. Also, implementation details are all up for discussion.

## License

MIT.

[npm-version-src]: https://img.shields.io/npm/v/@webqit/use-live?style=flat&colorA=black&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/@webqit/use-live
[npm-downloads-src]: https://img.shields.io/npm/dm/@webqit/use-live?style=flat&colorA=black&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/@webqit/use-live
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@webqit/use-live?style=flat&colorA=black&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=@webqit/use-live
[license-src]: https://img.shields.io/github/license/webqit/use-live.svg?style=flat&colorA=black&colorB=F0DB4F
[license-href]: https://github.com/webqit/use-live/blob/master/LICENSE
