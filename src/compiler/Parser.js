
/**
 * @import
 */
import { Parser, tokTypes } from 'acorn';

// "quantum" isn't anymore treated as a keyword
//keywordTypes.quantum = new TokenType( 'quantum', { keyword: 'quantum', prefix: true } );
//tokTypes._quantum = keywordTypes.quantum;

export default Parser.extend( function( Parser ) {
    return class extends Parser {

        static parse( input, options ) {
            const ast = super.parse( input, options );
            ast.isQuantumProgram = options.executionMode !== 'RegularProgram';
            ast.originalSource = input;
            return ast;
        }

        constructor( ...args ) {
            super( ...args );
            // "quantum" isn't anymore treated as a keyword
            //this.keywords = new RegExp( this.keywords.source.replace( '|', '|quantum|' ), this.keywords.flags );
            //this.useQuabtumDirectiveStack = [ this.options.executionMode !== 'RegularProgram' ];
            this.isQuantumFunction = false;
            this.functionStack = [];
        }

        isQuantumToekn() {
            return this.value === 'quantum';
            // "quantum" isn't anymore treated as a keyword
            //return this.type === tokTypes._quantum;
        }

        nextToken() {
            const ctx = this.type;
            super.nextToken();
            // Capture "async" followed by "quantum" and make "quantum" invisible
            if ( this.type === tokTypes.name && this.value === 'async' && this.input.slice( this.pos ).trim().startsWith( 'quantum' ) ) {
                /**
                 * function declaration: "async quantum" function name() { ... }
                 * named function expression; f = "async quantum" function name() { ... }
                 * annonymous function expression; f = "async quantum" function() { ... }
                 * object method; o = { "async quantum" name() { ... }, }
                 * object property; o = { name: "async quantum" function name() { ... }, }
                 * class method; o = { "async quantum" name() { ... } }
                 * static class method; o = { static "async quantum" name() { ... } }
                 * class property; o = { name = "async quantum" function name() { ... }; }
                 * static class property; o = { static name = "async quantum" function name() { ... }; }
                 */
                if ( ctx === tokTypes.name ) {
                    // "static async quantum" methods
                    this.functionStack[ 0 ].isQuantumFunction = true;
                } else {
                    // Other
                    this.isQuantumFunction = true;
                }
                const { type, value, start, end, startLoc, endLoc } = this;
                super.nextToken(); // Advance away from "quantum"
                // But retain "async" token for internal methods to see
                Object.assign( this, { type, value, start, end, startLoc, endLoc } );
            }
            // Capture "quantum" followed by "function" and make "quantum" invisible
            else if ( this.isQuantumToekn() && this.input.slice( this.pos ).trim().startsWith( 'function' ) ) {
                /**
                 * function declaration: "quantum function" name() { ... }
                 * named function expression; f = "quantum function" name() { ... }
                 * annonymous function expression; f = "quantum function"() { ... }
                 * object property; o = { name: "quantum function" name() { ... }, }
                 * class property; o = { name = "quantum function" name() { ... }; }
                 * static class property; o = { static name = "quantum function" name() { ... }; }
                 */
                // Advance away from "quantum" to tokenType "name", which parseFunction() sees
                super.nextToken();
                this.isQuantumFunction = true;
            }
            // "static quantum" methods
            else if ( ctx === tokTypes.name && this.functionStack[ 0 ]?.type === 'classElement' && this.isQuantumToekn() ) {
                /**
                 * o = class { "static quantum" name() { ... }; }
                 */
                // Advance away from "quantum"
                super.nextToken();
                // Annotate this.functionStack[ 0 ] as QuantumFunction for parseClassElement() to see
                this.functionStack[ 0 ].isQuantumFunction = true;
            }
            // "quantum" arrow function
            else if ( this.isQuantumToekn() && /^(\(|[\w$]+(\s+)?=>)/.test( this.input.slice( this.pos ).trim() ) ) {
                // Advance away from "quantum"
                super.nextToken();
                this.isQuantumFunction = true;
            }

            // Support starstar notation
            else if ( this.type === tokTypes.starstar ) {
                if ( ctx === tokTypes._function ) {
                    // parseFunction() is yet to be called
                    // Advance away from "starstar" to tokenType "name", which parseFunction() sees
                    if ( !this.isQuantumFunction ) {
                        super.nextToken();
                        // Annotate tokenType "name" as QuantumFunction for parseFunction() to see
                        this.isQuantumFunction = true;
                    }
                } else if ( [ 'property', 'classElement' ].includes( this.functionStack[ 0 ]?.type ) ) {
                    // parseProperty() or parseClassElement() has been called but "starstar" wasn't the first token
                    // Annotate token in context as QuantumFunction which parseProperty() or parseClassElement() is seeing
                    if ( !this.functionStack[ 0 ].isQuantumFunction ) {
                        this.functionStack[ 0 ].isQuantumFunction = true;
                        super.nextToken(); // Advance away from "starstar"
                    }
                }
            }
        }

        /*
        parseFunctionBody( ...args ) {
            this.useQuabtumDirectiveStack.unshift( /^([`'"])use\squantum\1/.test( this.input.slice( this.pos ).trim() ) );
            const node = super.parseFunctionBody( ...args );
            this.useQuabtumDirectiveStack.shift();
            return node;
        }
        */

        parseArrowExpression( ...args ) {
            // Check and normalize flag
            const isQuantumFunction = this.isQuantumFunction;
            this.isQuantumFunction = false;
            // Handle
            this.functionStack.unshift( { type: 'arrowFunction', isQuantumFunction } ); // Push stack
            // -------------------
            const node = super.parseArrowExpression( ...args );
            // -------------------
            if ( this.functionStack[ 0 ].isQuantumFunction ) {
                node.isQuantumFunction = true;
            }
            this.functionStack.shift(); // Pop stack
            return node;
        }

        parseFunction( node, statement, allowExpressionBody, isAsync, forInit ) {
            // Check and normalize flag
            const isQuantumFunction = this.isQuantumFunction;
            this.isQuantumFunction = false;
            // Handle
            this.functionStack.unshift( { type: 'function', isQuantumFunction } ); // Push stack
            if ( this.functionStack[ 0 ].isQuantumFunction ) {
                node.isQuantumFunction = true;
            }
            // -------------------
            const _node = super.parseFunction( node, statement, allowExpressionBody, isAsync, forInit );
            // -------------------
            this.functionStack.shift(); // Pop stack
            return _node;
        }

        parseProperty( isPattern, refDestructuringErrors ) {
            // Check and normalize flag
            const isQuantumFunction = this.isQuantumFunction;
            this.isQuantumFunction = false;
            // Handle
            this.functionStack.unshift( { type: 'property', isQuantumFunction } ); // Push stack
            if ( this.type === tokTypes.starstar || this.isQuantumToekn() ) {
                this.functionStack[ 0 ].isQuantumFunction = true;
                super.nextToken();
            }
            // -------------------
            const node = super.parseProperty( isPattern, refDestructuringErrors );
            // -------------------
            if ( this.functionStack[ 0 ].isQuantumFunction ) {
                node.value.isQuantumFunction = true;
            }
            this.functionStack.shift(); // Pop stack
            return node;
        }

        parseClassElement( constructorAllowsSuper ) {
            // Check and normalize flag
            const isQuantumFunction = this.isQuantumFunction;
            this.isQuantumFunction = false;
            // Handle
            this.functionStack.unshift( { type: 'classElement', isQuantumFunction } ); // Push stack
            if ( this.type === tokTypes.starstar || this.isQuantumToekn() ) {
                this.functionStack[ 0 ].isQuantumFunction = true;
                super.nextToken();
            }
            // -------------------
            const node = super.parseClassElement( constructorAllowsSuper );
            // -------------------
            if ( this.functionStack[ 0 ].isQuantumFunction ) {
                node.value.isQuantumFunction = true;
            }
            this.functionStack.shift(); // Pop stack
            return node;
        }

    }
} );
