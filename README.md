# Subscript

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/subscript.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/subscript.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

*[Subscript](https://webqit.io/tooling/subscript)* is a pseudo implementation (parser + runtime) of the JavaScript language. It is used for parsing JavaScript code and executing them in user-defined context.

Subscript is currently at the core of the [Scoped Scripts](https://webqit.io/tooling/oohtml/scoped-scripts) feature of the [OOHTML](https://webqit.io/tooling/oohtml) technology. It is also light enough for simple language tooling.

> [Visit project homepage](https://webqit.io/tooling/subscript).

```js
// parse() an expression
var exprObj = Subscript.parse(expr);

// get result with eval()
console.log(exprObj.eval());
```

Follow the [installation guide](https://webqit.io/tooling/subscript/installation) to obtain this library.

## Documentation
+ [The Language](https://webqit.io/tooling/subscript/language)

## Issues
To report bugs or request features, please submit an [issue](https://github.com/webqit/subscript/issues).

## License
MIT.
