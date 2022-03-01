# Subscript

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/subscript.svg" alt="NPM version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/subscript" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/subscript.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

Subscript is a reactivity runtime for JavaScript. It takes any valid JavaScript code, reads its dependency graph, and gives you the mechanism to run it both in whole and in selected parts, called dependency threads.

## What's A Dependency Thread?

That's simply the line of dependencies involving two or more expressions.

```js
let count = 10, doubleCount = count * 2, quadCount = doubleCount * 2;
```

We just expressed that `doubleCount` should be two times the value of `count`, and that `quadCount` should be two times the value of `doubleCount`.

```js
console,log( count, doubleCount, quadCount );
< 10, 20, 40
```

Problem is: this mathematical relationship only holds for as long as nothing changes. Should the value of `count` change, then its dependents would be out of sync.

```js
count ++;
```

```js
console,log( count, doubleCount, quadCount );
< 11, 20, 40
```

This is that reminder that expressions in JavaScript aren't automatically bound to their dependencies. And that's what we'd expect of any programming language.

If we had this in real life in some sort of a UI render function…

```js
let count = 10, doubleCount, quadCount;
```

```js
let render = function() {
    let countElement = document.querySelector( '#count' );
    countElement.innerHTML = count;
    
    doubleCount = count * 2;
    let doubleCountElement = document.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    quadCount = doubleCount * 2;
    let quadCountElement = document.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;
}
```

…then, we'd have to execute `render()` in whole each time the value of `count` changes. And here comes the additional overhead of querying the DOM every time!

In the time it takes to take a deep breath, we could make a drop-in replacement of the render function with a hypothetical function that, in addition to being a normal function, offers us a way to run expressions in isolation.

```js
render = new SubscriptFunction(`
    let countElement = document.querySelector( '#count' );
    countElement.innerHTML = count;
    
    doubleCount = count * 2;
    let doubleCountElement = document.querySelector( '#double-count' );
    doubleCountElement.innerHTML = doubleCount;
    
    quadCount = doubleCount * 2;
    let quadCountElement = document.querySelector( '#quad-count' );
    quadCountElement.innerHTML = quadCount;`
);
```

\> Run as a normal function…

```js
render();
```

The above executes the function body in full as designed… elements are selected and assigned content. And we can see the counters in the console.

```js
console,log( count, doubleCount, quadCount );
< 10, 20, 40
```

\> Run as a reactive function…

```js
count ++;
render.signal( [ 'count' ] );
```

This time, only statements 2, 3, 5, 6, and 8 were run - *the count dependency thread*; and the previously selected UI elements in those local variables are updated.

```js
console,log( count, doubleCount, quadCount );
< 11, 22, 44
```

Now, that's a bit of magic! But that hypothetical function is really Subscript Function!

But before we go into the details, there's a fever pitch that can't wait:

As trivial as our example code looks, we can see it applicable in real life places! Consider a neat reactive web component for our counter below.

```js
// We'll still keep count as a global variable for now
let count = 10;
```

```js
// This custom element extends Subscript as a base class… more on this later
customElements.define( 'click-counter', class extends SubscriptElement( HTMLElement ) {
    
    // This is how we designate methods as reactive methods
    // But this is implicit having extended SubscriptElement()
    static get subscriptMethods() {
        return [ 'render' ];
    }
        
    connectedCallback() {
        // Full execution at connected time
        this.render();
        // Granularly-selective execution at click time
        this.addEventListener( 'click', () => {
            count ++;
            this.render.signal( [ 'count' ] );
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

## What Is Subscript?

A general-purpose reactivity runtime for JavaScript, with an overarching philosophy of *reactivity that is based on the dependency graph of your own code, and nothing of its own syntax*!

It takes any piece of code and compiles it into an ordinary JavaScript function that can also run expressions in dependency threads!

Being function-based let's you have Subscript as a building block… to fit anywhere!

+ [Concepts](#concepts)
+ [API](#api)
+ [Why Subscript](#why-subscript)

## Concepts

### Signals

Subscript is not concerned with how changes happen or are detected on the outer scope of the function. It simply gives us a way to announce that something has changed. That announcement is called a *signal*.

A Subscript function has a `signal()` method that lets us specify the list of outside variables or properties that have changed.

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
// Updates and signals
b = 'Breadfruit';
fn.signal( [ 'b' ] );
```

The array syntax allows us to send signals for property changes as paths.

```js
fn.signal( [ 'c', 'prop' ] );
```

And we can send multiple signals in one call.

```js
fn.signal( [ 'a' ], [ 'b' ] );
```

Variables declared within the function belong in their own scope and do not respond to outside signals. But when they do reference variables from the outside scope, they are included in the dependency thread of those variables.

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
// The following signals will have no effect since a and b are local variables.
fn.signal( [ 'a' ], [ 'b' ] );
```

```js
// The local variable b will be part of the dependency thread for the following signal
// (The console will therefore show the result of the last two statements in the function)
fn.signal( [ 'c', 'prop' ] );
```

### References And Bindings

Expressions and statements in Subscript maintain a binding to their references. And that's the basis for reactivity in Subscript.

Variable declarations, with `let` and `var`, and assignment expressions, are bound to any references that may be in their argument. (`const` declarations are an exception as they're always *const* in nature.)

```js
var tense = score > 50 ? 'passed' : 'failed';
```

Above, `tense` is bound to the reference `score`. The effect of a signal from `score` is that `tense` is updated. That update, in turn, becomes a signal to any subsequent expression referencing `tense`.

```js
let message = `Hi ${ candidate.firstName }, you ${ tense } this test!`;
```

```js
message += subjects.next ? ' Up next is: ' + subjects.next : ' The end!';
```

Above, `message` is bound to the references `candidate`, `candidate.firstName`, and `tense`. (Likewise, in the additional assignment for `message`, `message` is bound to the reference `subjects.next`.) The effect of a signal from any of these references is that `message` is updated. That update, in turn, becomes a signal to any subsequent expression referencing `message`.

And the dependency thread continues!

Other types of operations like `score ++`, and `delete subjects.next` make a signal to their dependents.

Array/Object expressions, as another example, are bound to any references that they may be composed of, and the expressions are reevaluated should any of those change.

```js
let fullName = [ candidate.firstName, candidate.lastName, ].join( ' ' );
```

Above, `fullName` is updated as any of `candidate`, `candidate.firstName`, `candidate.lastName` changes.

```js
result = { …result, [ subjects.current ]: score };
```

Above, the `result` object gets, or updates, a property corresponding to `subjects.current`, with an associated value `score`, as any of `subjects.current` and `score` changes.

References in call-time arguments are binding.

```js
alert( message ); // alert() runs again on receiving a change signal from message.
```

```js
let candidate = new Candidate( id ); // candidate is a new instance on receiving a change signal from id.
```

### Conditionals And Logic

When the parameters of an *If/Else* statement, *Switch* statement, or other logical expressions contain references, the statement or logical expression is bound to those references. That lets us have reactive conditionals and logic.

#### If/Else Statements

When the *test* expression of an *If* statement contains references, the *if/else* construct is bound to those references.

```js
if ( score > 80 && passesSomeOtherTest() ) {
    addBadge( candidate );
    candidate.remark = 'You\'ve got a badge';
} else {
}
```

Above, the effect of a signal from the reference `score` is that the *test* expression (`score > 80 && passesSomeOtherTest()`) is evaluated again and the corresponding branch is executed in whole.

Now, adding an *else if* block would be just as adding another *if* statement in the *else* block of a parent *if* statement.

```js
if ( score > 80 && passesSomeOtherTest() ) {
    addBadge( candidate );
    candidate.remark = 'You\'ve got a badge';
} else if ( someOtherCondition ) {
} else {
}
```

Nested *If* statements have their own *if/else* branches bound to the references in their own *test* expression. So, above, every effect of a signal from the reference `someOtherCondition` is scoped to just the nested *if* statement.

Now, for as long as one side of a logical expression remains active, expressions on the other side are always unexposed to signals. Above, for as long as the parent *test* expression (`score > 80 && passesSomeOtherTest()`) holds true:
+ The *If* statement nested on its inactive side remains unexposed to signals from the reference `someOtherCondition`.
+ The individual expressions nested on its active side remain exposed to signals from the references they themselves might be bound to.
A change of state in the parent *test* expression reverses the situation.

#### Switch Statements

When the *switch* expression or any of the *test* expressions of a *Switch* statement contains references, the *Switch* construct is bound to those references.

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

Above, the effect of a signal on any of the references `score` and `maxScore` is that the *test* expressions are tested again and the body of the corresponding case is executed in whole.

Now, for as long as the applicable case(s) of a *Switch* statement remain active, expressions in the others are always unexposed to signals. Above, for as long as the first or second case holds true, the assignment expression in the default case remains unexposed to signals from the reference `defaultRemark`.

#### Logical And Ternary Operators

Subscript observes the state of logical expressions (`a && b || c`), and conditional expressions with the *ternary* operator (`a ? b : c`), when running the dependency thread for a signal.

```js
let a = () => 1, b = 2, c = 3, d, e;
```

```js
d = a() ? b : c;
e = a() && b || c;
```

Above, because of the *truthy* nature of the condition `a()`, the logical expressions will always return the value of `b`. This logic holds true even if the value of `c` continues to change. The assignment expressions are therefore not exposed at all to any signals from `c`, and this saves the potential overhead of calling `a()` each time `c` changes.

Should the condition `a()` become *falsey*, as in `a = () => 0`, the scenario above changes to favour `c` over `b`.

### Loops

When the parameters of a loop (`for` loops, `do` and `do … while` loops) contain references, the loop is bound to those references. That lets us have reactive loops.

#### A `for` Loop, `do` And `do … while` Loop

When any of the three parts of a `for` loop contains references, the loop is bound to those references.

```js
let start = 0, items = [ 'one', 'two', 'three', 'four', 'five' ], targetItems = [];
```

```js
for ( let index = start; index < items.length; index ++ ) {
    targetItems[ index ] = items[ index ];
}
```

Above, the effect of a signal from `start` or `items`, or `items.length`, is that the loop runs again.

```js
// Say, start and items were global variables
start = 2;
fn.signal( [ 'start' ] );
items.unshift( 'zero' );
fn.signal( [ 'items', 'length' ] );
```

Similar to a `for` loop, when the *condition* expression of a `do` or `do … while` loop contains references, the loop is bound to those references.

```js
let index = 0, items = [ 'one', 'two', 'three', 'four', 'five' ], targetItems = [];
```

```js
while ( index < items.length ) {
    targetItems[ index ] = items[ index ];
    index ++;
}
```

Above, the effect of a signal from `items`, or `items.length`, is that the loop runs again.

```js
// Say, items were global variables
items.unshift( 'zero' );
fn.signal( [ 'items', 'length' ] );
```

#### A `for … of` Loop

When the *iteratee* of a `for … of` loop is a reference, the loop is bound to that reference.

```js
let  entries = [ 'one', 'two', 'three', 'four', 'five' ], targetEntries = [];
```

```js
for ( let entry of entries ) {
    let index = entries.indexOf( entry );
    console.log( `Current iteration index is: ${ index }, and entry is: '${ entry }'` );
    targetEntries[ index ] = entries[ index ];
}
```

Above, the effect of a signal from the reference `entries` is that the loop runs again.

```js
// Say, entries were a global variable
entries = [ 'six', 'seven', 'eight', 'nine', 'ten' ];
fn.signal( [ 'entries' ] );
```

As an added advantage of this form of loop, updating a specific entry in `entries` moves the loop's pointer to the specific iteration involving that entry, and the body of that iteration is run again.

```js
entries[ 7 ] = 'This is new eight';
fn.signal( [ 'entries', 7 ] );
```

Now, the console reports…

```js
Current iteration index is: 7, and entry is: 'This is new eight'
```

…and index `7` of `targetEntries` is updated.

#### A `for … in` Loop

When the *iteratee* of a `for … in` loop is a reference, the loop is bound to that reference.

```js
let  entries = { one: 'one', two: 'two', three: 'three', four: 'four', five: 'five' }, targetEntries = {};
```

```js
for ( let propertyName in entries ) {
    console.log( `Current property name is: ${ propertyName }, and associated value is: '${ entries[ propertyName ] }'` );
    targetEntries[ propertyName ] = entries[ propertyName ];
}
```

Above, the effect of a signal from the reference `entries` is that the loop runs again.

```js
// Say, entries were a global variable
entries = { six: 'six', seven: 'seven', eight: 'eight', nine: 'nine', ten: 'ten' };
fn.signal( [ 'entries' ] );
```

As an added advantage of this form of loop, updating a specific property in `entries` moves the loop's pointer to the specific iteration involving that property, and the body of that iteration is run again.

```js
entries[ 'eight' ] = 'This is new eight';
fn.signal( [ 'entries', 'eight' ] );
```

Now, the console reports…

```js
Current property name is: eight, and property value is: 'This is new eight'
```

…and the property `eight` of `targetEntries` is updated.

#### Iteration States

Conceptually, each round of iteration in a loop is an instance that Subscript can access directly during a reactive run. A round of iteration is thus updatable in isolation in response to a directed signal. This is what happens when the *iteratee* of a `for … of` or `for … in` loop *signals* about an updated entry, as seen above.

Below is a similar case.

```js
let  entries = { one: { name: 'one' }, two: { name: 'two' } }, targetEntries = {};
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
fn.signal( [ 'entries', 'one' ] );
```

For even more granularity, individual expressions inside a round of iteration are also responsive to signals of their own. So, if we updated just `entries.one.name`…

```js
entries.one.name = 'New one';
fn.signal( [ 'entries', 'one', 'name' ] );
```

…we would have skipped the iteration instance itself, to match just the first statement within it.

This granular reactivity makes it often pointless to trigger a full rerun of a loop, offering multiple opportunities to deliver unmatched performance.

#### Breakouts

Subscript observes `break` and `continue` statements even in a reactive run. And any of these statements may employ *labels*.

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

## Documentation

+ See [project homepage](https://webqit.io/tooling/subscript) for download options and full documentation.

## Issues

To report bugs or request features, please submit an [issue](https://github.com/webqit/subscript/issues).

## License

MIT.
