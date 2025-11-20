
import { Parser, tokTypes } from 'acorn';
import { matchPrologDirective, nextKeyword } from '../util.js';

export default Parser.extend(function (Parser) {
    return class extends Parser {

        static parse(input, options) {
            if (!options.ecmaVersion) {
                options = { ...options, ecmaVersion: 'latest' };
            }
            const ast = super.parse(input, options);
            return ast;
        }

        constructor(...args) {
            super(...args);
            this.___meta = {};
            this.isLiveFunction = false;
            this.isLiveProgram = args[0]/* IMPORTANT */.executionMode !== 'RegularProgram';
            this.functionStack = [];
        }

        parse(...args) {
            const ast = super.parse(...args);

            ast.isLiveProgram = this.isLiveProgram
                || matchPrologDirective(this.input.trimStart(), true);
            ast.hasLiveFunctions = !!this.___meta.hasLiveFunctions;
            ast.originalSource = this.input;

            return ast;
        }

        parseFunctionBody(...args) {
            const isLiveExecutionMode = matchPrologDirective(nextKeyword(this.input, this.pos, 0), true);
            if (isLiveExecutionMode && this.functionStack[0]) {
                this.functionStack[0].isLiveFunction = true;
                this.___meta.hasLiveFunctions = true;
            }
            return super.parseFunctionBody(...args);
        }

        parseArrowExpression(...args) {
            this.functionStack.unshift({ type: 'arrowFunction', isLiveFunction: this.isLiveFunction });

            const node = super.parseArrowExpression(...args);
            if (this.functionStack[0].isLiveFunction) {
                node.isLiveFunction = true;
            }

            this.functionStack.shift();
            return node;
        }

        parseFunction(node, statement, allowExpressionBody, isAsync, forInit) {
            this.functionStack.unshift({ type: 'function', isLiveFunction: this.isLiveFunction });
            this.isLiveFunction = false;

            const _node = super.parseFunction(node, statement, allowExpressionBody, isAsync, forInit);
            if (this.functionStack[0].isLiveFunction) {
                _node.isLiveFunction = true;
            }

            this.functionStack.shift();
            return _node;
        }

        parseProperty(isPattern, refDestructuringErrors) {
            this.functionStack.unshift({ type: 'property', isLiveFunction: this.isLiveFunction });

            const node = super.parseProperty(isPattern, refDestructuringErrors);
            if (this.functionStack[0].isLiveFunction) {
                node.value.isLiveFunction = true;
            }

            this.functionStack.shift();
            return node;
        }

        parseClassElement(constructorAllowsSuper) {
            this.functionStack.unshift({ type: 'classElement', isLiveFunction: this.isLiveFunction });

            const node = super.parseClassElement(constructorAllowsSuper);
            if (this.functionStack[0].isLiveFunction) {
                node.value.isLiveFunction = true;
            }

            this.functionStack.shift();
            return node;
        }

    }
});
