# Subscript

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/subscript.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/subscript.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

Subscript is a light-weight JavaScript parser and interpreter written in JavaScript; Subscript provides a completely-bendable JavaScript runtime for ambitious usecases.

## Overview

You can `parse()` a JavaScript expression `(2 + 2) * 3` into a *Subscript AST*,

```js
var subscript = Subscript.parse(expr);
```

then, `stringify()` the *Subscript AST* back into its original JavaScript expression `(2 + 2) * 3`,

```js
let expr = subscript.stringify();
```

or even `eval()` the JavaScript expression.

```js
let result = subscript.eval();
// 12
```

### Features

#### Small! Fast!

Being an implementation of a subset of JavaScript, as the name implies, Subscript supports the everyday JavaScript that's just enough for most use-cases. That gives us something small and fast that fits anywhere.

#### Transformable AST

Make any language transformation between `Subscript.parse(expr)` and `subscript.stringify()` / `subscript.eval()`. Subscript's syntax tree transformability offers a great way to do code transpiling, static code analysis, and more.

#### A Pseudo Runtime!

Subscript's `eval()` feature is a standalone JavaScript runtime that supports user-defined contexts. This provides the level of runtime encapsulation that is not available with the native JavaScript's `eval()` function. (*Examples ahead.*)

#### Runtime Traps and Hooks

Supercharge everything with runtime traps. Subscript accepts the same *trap* object as a Proxy trap, for intercepting runtime *assignment* `=`, `delete`, and `in` operators, and object accessors. This brings a new level of depth to JavaScript code. (*Examples ahead.*)

### Examples

#### Evaluate a JavaScript expression

**`MathExpression`:**

```js
var expr1 = '7 + 8';
var exprObj1 = Subscript.parse(expr1);
// MathExpression
```

```js
var result1 = exprObj1.eval();
// (Number) 15
```

**`ArrayExpression`:**

```js
var expr2 = '[ "New York City", "Lagos", "Berlin" ]';
var exprObj2 = Subscript.parse(expr2);
// ArrayExpression
```

```js
var result2 = exprObj2.eval();
// (Array) [ "New York City", "Lagos", "Berlin" ]
```

**`ObjectExpression`:**

```js
var expr3 = '{ city1: "New York City", city2: "Lagos", city3: "Berlin", city4: cityNameFromContext }';
var exprObj3 = Subscript.parse(expr3);
// ObjectExpression
```

```js
var result3 = exprObj3.eval();
// (Object) { city1: "New York City", city2: "Lagos", city3: "Berlin", city4: undefined }
```

```js
var context = { cityNameFromContext: 'London' };
var result3 = exprObj3.eval(context);
// (Object) { city1: "New York City", city2: "Lagos", city3: "Berlin", city4: "London" }
```

**`FunctionExpression`:**

```js
var expr4 = '( arg1, arg2 ) => { return arg1 + arg2 + (argFromContext ? argFromContext : 0); }';
var exprObj4 = Subscript.parse(expr4);
// FunctionExpression
```

```js
var result4 = exprObj4.eval();
// (Function) ( arg1, arg2 ) => { return arg1 + arg2 + (argFromContext ? argFromContext : 0); }

result4(10, 3);
// (Number) 13
```

```js
var context = { argFromContext: 20 };
var result4 = exprObj4.eval(context);
// (Function) ( arg1, arg2 ) => { return arg1 + arg2 + (argFromContext ? argFromContext : 0); }

result4(10, 3);
// (Number) 33
```

**`.stringify()`:**

```js
var expr1 = exprObj1.stringify();
// 7 + 8
```

#### Use conditionals, call a function in scope

**`ConditionalExpression`:**

```js
var expr1 = 'age < 18 ? fname + " " + lname + " does not meet the age requirement!" : fname + " " + lname + " is old enough!"';
var exprObj1 = Subscript.parse(expr1);
// ConditionalExpression
```

```js
var context = { fname: "John", lname: "Doe", age: 24 };
var result1 = exprObj1.eval();
// (String) John Doe is old enough!
```

```js
var context = { fname: "John2", lname: "Doe2", age: 10 };
var result1 = exprObj1.eval(context);
// (String) John Doe does not meet the age requirement!
```

**`StringExpression`:**

```js
var expr2 = '"Today is: " + date().stringify()';
var exprObj2 = Subscript.parse(expr2);
// StringExpression
```

```js
var context = { date:() => (new Date) };
var result2 = exprObj2.eval(context);
// (String) Today is: <current date>
```

**`.stringify()`:**

```js
var expr2 = exprObj2.stringify();
// "Today is: " + date().stringify()
```

#### Write multiple expressions and Comments, plus a top-level return

**`BlockExpression`:**

```js
var expr = `
/**
 * Block comments
 */

// Single line comments
delete obj1.prop1;
delete /*comment anywhere*/obj2.prop1;

return;

delete obj2.prop2;
`;

var exprObj = Subscript.parse(expr);
// BlockExpression
```

```js
var context = { obj1: { prop1: "John" }, obj2: { prop1: "Doe", prop2: "Bar" } };
var result = exprObj.eval();

context;
// (Object) { obj1: { }, obj2: { prop2: "Bar" } }
```

#### Use traps

**`IfExpression`:**

```js
var expr = `if ("prop1" in obj1) {
    console.log('prop1 exists.');
} else {
    console.log('prop1 does not exist. Creating it now.');
    obj1.prop1 = 'John';
}
`;

var exprObj = Subscript.parse(expr);
// IfExpression
```

```js
var pseudoContext = { obj1: { prop1: "John" }, obj2: { prop1: "Doe", prop2: "Bar" } };
var context = {};
var result = exprObj.eval(context, {
    has: (target, property) => {
        return property in pseudoContext;
    },
    set: (target, property, value) => {
        pseudoContext[property] = value;
        return true;
    },
});

// (String) prop1 exists.
```

## Documentation

+ See [project homepage](https://webqit.io/tooling/subscript) for download options and full documentation.

## Issues

To report bugs or request features, please submit an [issue](https://github.com/webqit/subscript/issues).

## License

MIT.
