import { generate as astringGenerate } from 'astring';
import $qIdentifier from './$qIdentifier.js';
import $qDownstream from './$qDownstream.js';
import Scope from './Scope.js';
import Node from './Node.js';

/**
 * NICE TO HAVES: leaner output via heuristics
 */
export default class Transformer {

    history = [];
    scopes = [];
    functionTypes = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
    loopTypes = ['DoWhileStatement', 'WhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement'];
    labeledTypes = ['SwitchStatement', 'LabeledStatement'];
    topLevelAwait = false;
    topLevelArgsKeyword = false;
    exportIds = [];

    constructor(params = {}) {
        this.params = params;
    }

    pushScope(scopeData, callback) {
        const scope = new Scope(this.currentScope, scopeData);
        this.scopes.unshift(scope);
        const returnValue = callback();
        this.scopes.shift();
        return returnValue;
    }

    get currentScope() { return this.scopes[0]; }

    pushHistory(state, callback) {
        this.history.unshift(state);
        const returnValue = callback();
        this.history.shift();
        return returnValue;
    }

    get currentEntry() { return this.history[0]; }

    /* ------------------------------ */

    serialize(ast, params = {}) { return astringGenerate(ast, { comments: true, ...params }); }

    transform(ast) {
        if (ast.type !== 'Program') throw new Error('AST must be of type "Program".');
        return this.pushScope(ast, () => {
            this.currentScope.get$qIdentifier('$q');
            this.currentScope.get$qIdentifier('$q2');
            const body = this.transformNodes(ast.body, { static: !ast.isLiveProgram });
            const newAst = { ...ast, body };
            // -------------
            // Program body comment
            if (newAst.body.length) { newAst.body[0].comments = Node.comments('Program body'); }
            // Location data and comment
            const locationsAssignment = Node.exprStmt(Node.assignmentExpr(this.$path('locations'), Node.arrayExpr(this.currentScope.locations)));
            locationsAssignment.comments = Node.comments('Location data');
            newAst.body.unshift(locationsAssignment);
            // -------------
            if (this.exports.size) {
                // Render all exports
                this.exports.forEach(args => {
                    newAst.body.push(Node.exprStmt(this.$call('export', ...args)));
                });
                // Insert an "await exports.promises" statement after all exports
                const promiseAll = Node.memberExpr(Node.identifier('Promise'), Node.identifier('all'));
                newAst.body.push(Node.exprStmt(Node.awaitExpr(Node.callExpr(promiseAll, [this.$path('$promises.exports')]))));
                this.topLevelAwait = true;
            }
            const identifier = this.currentScope.get$qIdentifier('$q').name;
            const identifier2 = this.currentScope.get$qIdentifier('$q2').name;
            const transformedSource = this.params.astResult ? newAst : this.serialize(newAst, { startingIndentLevel: this.params.startingIndentLevel });
            const transformedSourceBase64 = this.params.base64 && !this.params.astResult ? btoa(this.params.base64.replace('%0', identifier + '').replace('%1', transformedSource)) : '';
            return {
                identifier,
                identifier2,
                transformedSource,
                transformedSourceBase64,
                originalSource: ast.originalSource,
                isLiveProgram: ast.isLiveProgram,
                hasLiveFuntions: ast.hasLiveFuntions,
                topLevelAwait: this.topLevelAwait,
                exportIds: this.exportIds,
                toString(base64 = undefined) { return base64 === 'base64' ? this.transformedSourceBase64 : this.transformedSource; },
            };
        });
    }

    transformNodes(nodes, state = {}) {
        const total = (nodes = nodes.filter(s => s)).length;
        // Hoist FunctionDeclarations and ImportDeclaration
        const [imports, functions, other] = nodes.reduce(([imports, functions, other], node) => {
            return node?.type === 'ImportDeclaration' ? [imports.concat(node), functions, other] : (
                node?.type === 'FunctionDeclaration' ? [imports, functions.concat(node), other] : [imports, functions, other.concat(node)]
            );
        }, [[], [], []]);
        // Back together...
        nodes = [...imports, ...functions, ...other];
        // Process now...
        return (function eat(build, i) {
            if (i === total) return build;
            // Generate...
            const [$node_s, $state] = this.transformNode(nodes[i], state, true);
            build = build.concat($node_s || []/* exports are often not returned */);
            if (i === imports.length - 1) {
                // Insert an "await imports.promises" statement after all imports
                const promiseAll = Node.memberExpr(Node.identifier('Promise'), Node.identifier('all'));
                build = build.concat(Node.exprStmt(Node.awaitExpr(Node.callExpr(promiseAll, [this.$path('$promises.imports')]))));
            }
            // Skip rest code after return, break, or continue
            if (['ReturnStatement', 'BreakStatement', 'ContinueStatement'].includes(nodes[i].type)) return build;
            // Construct "rest" block
            if ($state.flowControl?.size && $state.node.type === 'IfStatement') {
                const restNodes = nodes.slice(i + 1);
                if (restNodes.length) {
                    const downstream = new $qDownstream(restNodes);
                    return build.concat(this.transformNode(downstream));
                }
            }
            return eat.call(this, build, i + 1);
        }).call(this, [], 0);

    }

    transformNode(node, state = {}, getState = false) {
        if (typeof node !== 'object' || !node) return node;
        const historyData = {
            static: this.currentEntry?.static,
            isLeft: this.currentEntry?.isLeft,
            mode: this.currentEntry?.mode,
            ...state,
            parentNode: this.currentEntry?.node,
            node,
            hoistedAwaitKeyword: false,
            flowControl: new Map,
        };
        const $node = this.pushHistory(historyData, () => {
            if (this[`transform${node.type}`]) {
                return this[`transform${node.type}`].call(this, node);
            }
            return Object.keys(node).reduce(($node, key) => {
                const value = Array.isArray(node[key])
                    ? this.transformNodes(node[key], state)
                    : this.transformNode(node[key], state);
                return { ...$node, [key]: value };
            }, {});
        });
        return getState ? [$node, historyData] : $node;
    }

    /* HELPERS */

    $serial(node) { return this.currentScope.index(node, this.params.locations); }

    $path(path) { return path.split('.').reduce((obj, prop) => Node.memberExpr(obj, Node.identifier(prop)), this.currentScope.get$qIdentifier('$q')); }

    $trail() { return this.currentEntry.trail ? [Node.literal(this.currentEntry.trail)] : []; }

    $call(callee, ...args) { return Node.callExpr(this.$path(callee), args); }

    $typed(as, value, name = null) {
        const $namePart = name ? [Node.literal(name)] : [];
        return this.$call('typed', Node.literal(as), value, ...$namePart);
    }

    $obj(obj) {
        const entries = Object.entries(obj).map(([name, value]) => Node.property(Node.identifier(name), Array.isArray(value) ? Node.arrayExpr(value) : value));
        return Node.objectExpr(entries);
    }

    $closure(...args) {
        let body = args.pop(), params = args.pop() || [];
        if (body.type === 'EmptyStatement') body = Node.blockStmt([]);
        return Node.arrowFuncExpr(null, params, body, this.currentEntry.hoistedAwaitKeyword);
    }

    $var(kind, $serial, id, init, ...$rest) {
        const closure = init ? this.$closure([this.currentScope.get$qIdentifier('$q')], init) : Node.identifier('undefined');
        let autorunExpr = this.$call(kind, Node.literal(id), $serial, closure, ...$rest);
        if (closure.async) { autorunExpr = Node.awaitExpr(autorunExpr); }
        return Node.exprStmt(autorunExpr);
    }

    $update(left, right, ...$rest) {
        const closure = this.$closure(right);
        return this.$call('update', Node.literal(left.name), closure, ...$rest);
    }

    $autorun(type, ...rest) {
        const body = rest.pop();
        const $serial = rest.pop();
        const spec = rest.pop() || {};
        const $spec = Object.keys(spec).length ? [this.$obj(spec)] : [];;
        const closure = this.$closure([this.currentScope.get$qIdentifier('$q')], body);
        let autorunExpr = this.$call('autorun', Node.literal(type), ...$spec, $serial, closure);
        if (closure.async) { autorunExpr = Node.awaitExpr(autorunExpr); }
        return Node.exprStmt(autorunExpr);
    }

    $iteration(kind, $serial, body) {
        const $kind = Node.literal(kind);
        const label = this.currentEntry.parentNode?.label ? Node.literal(this.currentEntry.parentNode.label.name) : Node.identifier('null');
        const spec = { kind: $kind, label };
        const $body = Node.blockStmt(body);
        return this.$autorun('iteration', spec, $serial, $body);
    }

    /* FLOW CONTROL */

    hoistAwaitKeyword() {
        for (const entry of this.history) {
            entry.hoistedAwaitKeyword = true;
            if (entry.node.type.includes('Function')) return;
        }
        this.topLevelAwait = true;
    }

    hoistArgumentsKeyword() {
        const keywordScopes = ['FunctionDeclaration', 'FunctionExpression'];
        if (this.history.some(e => keywordScopes.includes(e.node.type))) return;
        this.topLevelArgsKeyword = true;
        return true;
    }

    hoistExitStatement(cmd, arg = {}) {
        for (const entry of this.history) {
            const isTargetSwitch = () => entry.node?.type === 'SwitchStatement' && cmd.value === 'break' && arg.name === 'null';
            const isTargetLabel = () => entry.parentNode?.type === 'LabeledStatement' && this.loopTypes.includes(entry.parentNode.body.type) && arg.value === entry.parentNode.label.name;
            const isBareExit = () => this.loopTypes.includes(entry.node.type) && arg.name === 'null';
            if (isTargetSwitch()) { return entry.node; }
            if (isTargetLabel() || isBareExit()) {
                entry.flowControl.set(cmd, { ...arg, endpoint: true });
                return entry.node;
            }
            if (entry.node.type.includes('Function')) return;
            entry.flowControl.set(cmd, arg);
        }
    }

    /* FUNCTIONS */

    transformFunctionDeclaration(node) { return this.transformFunction(Node.funcDeclaration, ...arguments) }
    transformFunctionExpression(node) { return this.transformFunction(Node.funcExpr, ...arguments) }
    transformArrowFunctionExpression(node) { return this.transformFunction(Node.arrowFuncExpr, ...arguments) }
    transformFunction(transform, node) {
        if (node.generator && node.isLiveFunction) {
            throw new Error(`Generator functions cannot be live functions.`);
        }
        const $serial = this.$serial(node);
        let { id, params, body } = node;
        // Note the static/non-static mode switch
        [id, params, body] = this.pushScope(node, () => {
            const $body = [];
            // Function name
            if (this.currentEntry.isExport && !id) {
                // default export
                id = this.currentScope.getRandomIdentifier('$rand', true);
            }
            if (id) { this.currentScope.push(id, 'self'); } // Before anything
            // Params
            const $params = params.map(param => {
                if (param.type === 'AssignmentPattern' && node.isLiveFunction) {
                    const $rand = this.currentScope.getRandomIdentifier('$rand', false);
                    const $param = this.transformSignal($rand, 'param'); // Must be registered as a param before line below
                    const declaration = Node.varDeclarator(param.left, Node.withLoc(Node.logicalExpr('||', $rand, param.right), param));
                    $body.push(...this.transformNode(Node.varDeclaration('let', [Node.withLoc(declaration, param)]), { static: !node.isLiveFunction }));
                    return $param;
                }
                return this.transformSignal(param, 'param');
            });
            // Body
            const $$body = this.transformNodes(body.type === 'BlockStatement' ? body.body : [Node.returnStmt(body)], { static: !node.isLiveFunction });
            $body.push(...$$body);
            // -------------
            // Function body comment
            if ($body.length) { $body[0].comments = Node.comments('Function body'); }
            // Location data and comment
            const locationsAssignment = Node.exprStmt(Node.assignmentExpr(this.$path('locations'), Node.arrayExpr(this.currentScope.locations)));
            locationsAssignment.comments = Node.comments('Location data');
            $body.unshift(locationsAssignment);
            // -------------
            // Result
            return [id, $params, Node.blockStmt($body),];
        });

        const $qIdentifier = this.currentScope.get$qIdentifier('$q');
        const closure = this.$closure([$qIdentifier], body);

        const executionMode = Node.literal(node.isLiveFunction ? 'LiveFunction' : (node.isHandler ? 'HandlerFunction' : (node.isFinalizer ? 'FinalizerFunction' : 'RegularFunction')));
        const functionKind = Node.literal(node.type === 'FunctionDeclaration' ? 'Declaration' : 'Expression');
        const $body = Node.blockStmt([Node.returnStmt(this.$call('runtime.spawn', executionMode, node.type === 'ArrowFunctionExpression' ? Node.identifier('null') : Node.thisExpr(), closure, $qIdentifier/*Lexical context*/))]);

        const metarisation = reference => this.$call('function', executionMode, functionKind, $serial, reference/* reference to the declaration */);
        let resultNode = transform.call(Node, id, params, $body, node.async, node.expresion, node.generator);
        if (node.type === 'FunctionDeclaration') {
            this.currentScope.push(id, 'static'); // On outer scope
            resultNode = [resultNode, Node.exprStmt(metarisation(id))];
            // Is export?
            if (this.currentEntry.isExport) {
                const spec = [Node.literal(id), $serial];
                if (this.currentEntry.isExport === 'as-default') {
                    spec.push(Node.literal('default'));
                    this.exportIds.push('default');
                } else {
                    this.exportIds.push(id.name);
                }
                this.exports.add([Node.arrayExpr(spec)]);
            }
        } else if (!this.currentEntry.isMethod) { resultNode = metarisation(resultNode); }

        return resultNode;
    }

    /* CLASSES */

    transformClassDeclaration(node) { return this.transformClass(Node.classDeclaration, ...arguments); }
    transformClassExpression(node) { return this.transformClass(Node.classExpression, ...arguments); }
    transformClass(transform, node) {
        let { id, body, superClass } = node;
        if (superClass) { superClass = this.transformNode(superClass); }
        const methods = new Set;
        body = this.pushScope(node, () => {
            if (this.currentEntry.isExport && !id) {
                // default export
                id = this.currentScope.getRandomIdentifier('$rand', true);
            }
            // On the inner scope
            if (id) { this.currentScope.push(id, 'self'); } // Before anything
            return this.transformNode(body, { methods });
        });
        const classKind = Node.literal(node.type === 'ClassDeclaration' ? 'Declaration' : 'Expression');
        const metarisation = reference => {
            const methodsSpec = Node.arrayExpr([...methods].map(m => this.$obj(m)));
            return this.$call('class', classKind, reference/* reference to the declaration */, methodsSpec);
        };
        let resultNode = transform.call(Node, id, body, superClass);
        if (node.type === 'ClassDeclaration') {
            this.currentScope.push(id, 'static'); // On the outer scope
            resultNode = [resultNode, Node.exprStmt(metarisation(id))];
            // Is export?
            if (this.currentEntry.isExport) {
                const spec = [Node.literal(id), this.$serial(node)];
                if (this.currentEntry.isExport === 'as-default') {
                    spec.push(Node.literal('default'));
                    this.exportIds.push('default');
                } else {
                    this.exportIds.push(id.name);
                }
                this.exports.add([Node.arrayExpr(spec)]);
            }
        } else { resultNode = metarisation(resultNode); }

        return resultNode;
    }

    transformMethodDefinition(node) {
        let { key, value } = node;
        if (node.computed) { key = this.transformNode(key); }
        const $value = this.transformNode(value, { static: true, isMethod: true });
        this.currentEntry.methods.add({
            name: node.computed ? key : Node.literal(key),
            static: Node.identifier(node.static),
            isLiveFunction: Node.identifier(value.isLiveFunction || false),
            serial: this.$serial(node),
        });
        return Node.methodDefinition(key, $value, node.kind, node.static, node.computed);
    }

    transformPropertyDefinition(node) {
        let { key, value } = node;
        if (node.computed) { key = this.transformNode(key); }
        value = this.transformNode(value);
        return Node.exprStmt(Node.propertyDefinition(key, value, node.static, node.computed));
    }

    /** IMPORTS & EXPORTS */

    exports = new Set;
    transformExportDefaultDeclaration(node) { return this.handleExports(...arguments); }
    transformExportNamedDeclaration(node) { return this.handleExports(...arguments); }
    transformExportAllDeclaration(node) { return this.handleExports(...arguments); }
    handleExports(node) {
        // ExportAllDeclaration: has "source" and "exported". (The equivalen of spec.type === 'ImportNamespaceSpecifier' above.)
        if (node.type === 'ExportAllDeclaration') {
            const spec = [Node.literal('*'), this.$serial(node.exported || node), Node.literal(node.exported?.name || node.exported?.value || '')];
            this.exports.add([Node.arrayExpr(spec), this.$obj({ source: node.source, serial: this.$serial(node) })]);
            this.exportIds.push(spec[2].value);
            return;
        }
        // Specifiers helper
        const specifiers = specs => specs.map(spec => {
            const $spec = [Node.literal(spec.local.name), this.$serial(spec)];
            const alias = spec.exported.name || spec.exported.value;
            if (alias !== spec.local.name) $spec.push(Node.literal(alias));
            this.exportIds.push(alias);
            return Node.arrayExpr($spec);
        });
        // ExportNamedDeclaration: may have a "source" and "specifiers"
        if (node.source) {
            this.exports.add(specifiers(node.specifiers).concat(this.$obj({ source: node.source, serial: this.$serial(node) })));
            return;
        }
        // Now we're left with local exports! First we deal with specifiers of type "identifier"...
        if (node.type === 'ExportNamedDeclaration' && node.specifiers.length) {
            this.exports.add(specifiers(node.specifiers));
            return;
        }
        if (node.type === 'ExportDefaultDeclaration') {
            if (['Identifier', 'ThisExpression'].includes(node.declaration.type)) {
                const spec = [Node.literal(node.declaration.name || 'this'), this.$serial(node), Node.literal('default')];
                this.exports.add([Node.arrayExpr(spec)]);
                this.exportIds.push('default');
                return;
            }
            if (node.declaration.type === 'Literal') {
                const spec = [Node.identifier(null), this.$serial(node), Node.literal('default'), node.declaration];
                this.exports.add([Node.arrayExpr(spec)]);
                this.exportIds.push('default');
                return;
            }
        }
        // Next we deal with declarations; which for ExportNamedDeclaration may be any sort of declaration
        // while for ExportDefaultDeclaration may be any sort of declaration other than variables
        return this.transformNode(node.declaration, { isExport: node.type === 'ExportDefaultDeclaration' ? 'as-default' : true });
    }

    transformImportDeclaration(node) {
        const specifiers = node.specifiers.map(spec => {
            let { imported, local } = spec;
            this.transformSignal(local, 'import');
            if (spec.type === 'ImportNamespaceSpecifier') { imported = Node.identifier('*'); }
            else if (spec.type === 'ImportDefaultSpecifier') { imported = Node.identifier('default'); }
            const $imported = imported.name || imported.value || '';
            const $spec = [Node.literal($imported), this.$serial(spec)];
            if ($imported !== spec.local.name) $spec.push(Node.literal(spec.local.name));
            return Node.arrayExpr($spec);
        });
        return Node.exprStmt(this.$call('import', ...specifiers.concat(this.$obj({ source: node.source, serial: this.$serial(node) }))));
    }

    transformImportExpression(node) {
        return this.$call('import', this.$obj({ source: node.source, isDynamic: Node.identifier('true'), serial: this.$serial(node) }));
    }

    /* IDENTIFIERS & PATHS */

    transformSignal(node, mode, signals = null) {
        if (node.type === 'Identifier') {
            this.currentScope.push(node, mode, ['let', 'param'].includes(mode));
            signals?.add(node);
            return node;
        }
        // A pattern
        return this.transformNode(node, { mode, static: true, signals });
    }

    transformThisExpression(node) { return this.transformIdentifier(...arguments); }
    transformIdentifier(node) {
        const ref = this.currentScope.find(node);
        if (!ref && node.name) {
            this.currentScope.$qIdentifiersNoConflict(node.name);
        }
        const hintArg = [];
        if (node.hint) { hintArg.push(this.$obj({ [node.hint]: Node.identifier(true) })); }
        else if (this.currentEntry.mode === 'callee') {
            //hintArg.push( this.$obj( { funCall: Node.identifier( true ) } ) );
        }
        // Static mode?
        if (/*node.type === 'ThisExpression' ||*/ ['param', 'self'].includes(ref?.type) || ['arguments'].includes(node.name)) {
            if (this.currentEntry.trail) return this.$call('obj', node, ...this.$trail(), ...hintArg);
            return node;
        }
        if (node.type === 'ThisExpression') {
            return this.$call('ref', Node.literal('this'), ...this.$trail(), ...hintArg);
        }
        // We're now dealing with an identifier or path that can change
        this.history.forEach(state => state.refs?.add(node));
        if (this.currentEntry.isLeft && this.currentEntry.mode !== 'callee') {
            hintArg.push(this.$obj({ isLeft: Node.literal(true) }));
        }
        return this.$call('ref', Node.literal(node), ...this.$trail(), ...hintArg);
    }

    transformMemberExpression(node) {
        let { object, property, computed, optional } = node;
        if (computed) { property = this.transformNode(property); }
        let $object = this.transformNode(object, { trail: (this.currentEntry.trail || 0) + 1 });
        if (object.typed) {
            $object = this.$typed(object.typed, $object, Node.literal(property));
        }
        return Node.memberExpr($object, property, computed, optional);
    }

    /* DECLARATIONS & MUTATIONS (SIGNALS) */

    transformVariableDeclaration(node) {
        const isExport = this.currentEntry.isExport;
        // Expanded declarations?
        const entries = node.declarations.reduce((decs, dec) => {
            if (['ObjectPattern', 'ArrayPattern'].includes(dec.id.type)) {
                return decs.concat(this.expandPattern(dec.id, dec.init));
            }
            return decs.concat(dec);
        }, []);
        // Dynamic assignment construct
        return entries.reduce((stmts, dec) => {
            const $serial = this.$serial(dec);
            let $init = this.transformNode(dec.init);
            this.transformSignal(dec.id, node.kind, this.currentEntry.signals);
            let $rest = [];
            if (dec.restOf) {
                $init = this.$typed(dec.init.typed, $init);
                $rest.push(this.$obj({ restOf: dec.restOf, type: Node.literal(dec.init.typed === 'iterable' ? 'array' : 'object') }));
            }
            const $stmts = stmts.concat(this.$var(node.kind, $serial, dec.id, $init, ...$rest));
            // Is export?
            if (isExport && !(dec.id instanceof $qIdentifier)) {
                const spec = [Node.literal(dec.id), $serial];
                this.exports.add([Node.arrayExpr(spec)]);
                this.exportIds.push(dec.id.name);
            }
            return $stmts;
        }, []);
    }

    transformAssignmentExpression(node) {
        const staticMode = this.currentEntry.static;
        const expandableAsStatements = !staticMode && this.history[1].node.type === 'ExpressionStatement';
        let { left, right } = node;

        // Regular assignmentExpr
        const assignmentExpr = (left, right) => {
            right = this.transformNode(right);
            left = this.transformNode(left, { isLeft: true });
            return Node.assignmentExpr(left, right, node.operator);
        };

        // Property mutation?
        if (['MemberExpression', 'ChainExpression'].includes(left.type)) { return assignmentExpr(left, right); }

        // Expanded declarations?
        if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
            let potentialNewRight = right;
            const declarations = this.expandPattern(left, right, expandableAsStatements).reduce((stmts, dec) => {
                // Was "right" simplified? We'll need the new reference
                if (dec.id.originalB) { potentialNewRight = dec.id; }
                // An assignment?
                if (dec.type === 'AssignmentExpression') {
                    return stmts.concat(assignmentExpr(dec.left, dec.right));
                }
                // Actual operation
                let $init = this.transformNode(dec.init);
                // As intermediate variable?
                if (dec.id instanceof $qIdentifier) {
                    const $serial = this.$serial(dec);
                    return stmts.concat(this.$var('let', $serial, dec.id, $init));
                }
                // As update!
                this.transformSignal(dec.id, 'update', this.currentEntry.signals); // An identifier
                let $rest = [];
                // A Rest parameter?
                if (dec.restOf) {
                    $init = this.$typed(dec.init.typed, $init);
                    $rest.push(this.$obj({ restOf: dec.restOf, type: Node.literal(dec.init.typed === 'iterable' ? 'array' : 'object') }));
                }
                return stmts.concat(this.$update(dec.id, $init, ...$rest));
            }, []);
            // As individual statements?
            if (expandableAsStatements) return declarations;
            // As sequence!
            return Node.sequenceExpr(declarations.concat(potentialNewRight));
        }

        // Other: left is an identifier
        right = this.transformNode(right);
        this.transformSignal(left, 'update', this.currentEntry.signals);
        const currentValueLocalIdentifier = this.currentScope.getRandomIdentifier('$current', false);
        return this.$call('update', Node.literal(left), this.$closure([currentValueLocalIdentifier], Node.assignmentExpr(currentValueLocalIdentifier, right, node.operator.replace('====', ''))));
    }

    transformAssignmentPattern(node) {
        let { left, right } = node;
        right = this.transformNode(right);
        if (['MemberExpression', 'ChainExpression'].includes(left.type)) {
            left = this.transformNode(left, { static: true });
        } else/* Identifier/Object/ArrayPattern */ {
            left = this.transformSignal(left, this.currentEntry.mode, this.currentEntry.signals);
        }
        return Node.assignmentPattern(left, right);
    }

    /*
    NO-MORE
    transformObjectPattern( node ) {
        const properties = node.properties.map( property => {
            let { key, value } = property;
            if ( property.computed && key.type !== 'Literal' ) {
                key = this.transformNode( key );
            }
            value = this.transformSignal( value, this.currentEntry.mode, this.currentEntry.signals );
            return Node.property( key, value, property.kind, property.shorthand, property.computed, property.method );
        } );
        return Node.objectPattern( properties );
    }
    
    transformArrayPattern( node ) {
        const elements = node.elements.map( element => {
            if ( [ 'MemberExpression', 'ChainExpression' ].includes( element.type ) ) {
                return this.transformNode( element, { static: true } );
            }
            // Identifier/Object/ArrayPattern
            return this.transformSignal( element, this.currentEntry.mode, this.currentEntry.signals );
        } );
        return Node.arrayPattern( elements );
    }
    */

    expandPattern(a, b, withIntermediates = true) {
        const declarations = [], _this = this;
        if (!['Identifier', 'Literal'].includes(b.type) && withIntermediates) {
            const intermediateLocalIdentifier = Node.withLoc(_this.currentScope.getRandomIdentifier('$rand', false), b);
            intermediateLocalIdentifier.originalB = true;
            b.typed = a.type === 'ObjectPattern' ? 'desctructurable' : 'iterable';
            declarations.push(Node.withLoc(Node.varDeclarator(intermediateLocalIdentifier, b), b));
            b = intermediateLocalIdentifier;
        }
        (function expand(patternEntries, $init, isObjectType) {
            $init.typed = isObjectType ? 'desctructurable' : 'iterable';
            const localIdentifiers = [];
            for (let i = 0; i < patternEntries.length; i++) {
                let entry = patternEntries[i], key = i, value = entry;
                if (entry === null) {
                    localIdentifiers.push(i);
                    continue;
                }
                if (entry.type === 'RestElement') {
                    const dec = Node.withLoc(Node.varDeclarator(entry.argument, $init), entry);
                    dec.restOf = localIdentifiers.map(v => Node.literal(v));
                    declarations.push(dec);
                    continue;
                }
                if (isObjectType) { ({ key, value } = entry); }
                else { key = Node.literal(key); }
                // Obtain default value and local identifier
                let defaultValue, localIdentifier;
                if (value.type === 'AssignmentPattern') {
                    defaultValue = value.right;
                    if (value.left.type === 'Identifier') { localIdentifier = value.left; }
                    else { value = value.left; }
                } else if (value.type === 'Identifier') {
                    localIdentifier = value;
                }
                // Generate for let and var
                let init = Node.memberExpr($init, key, isObjectType ? entry.computed : true);
                if (defaultValue) { init = Node.logicalExpr('||', init, defaultValue); }
                if (localIdentifier) {
                    declarations.push(Node.withLoc(Node.varDeclarator(localIdentifier, init), entry));
                    localIdentifiers.push(key);
                } else if (value.type === 'MemberExpression' || (value.type === 'ChainExpression' && (value = value.expression))) {
                    declarations.push(Node.withLoc(Node.assignmentExpr(value, init), entry));
                } else if (value.elements || value.properties) {
                    const numDeclarationsAtLevel = (value.properties ? value.properties : value.elements).length > 1;
                    if (withIntermediates && numDeclarationsAtLevel) {
                        const intermediateLocalIdentifier = _this.currentScope.getRandomIdentifier('$rand', false);
                        declarations.push(Node.withLoc(Node.varDeclarator(intermediateLocalIdentifier, init), entry));
                        init = intermediateLocalIdentifier;
                    }
                    expand((value.elements || value.properties), init, value.properties && true);
                }
            }
        })((a.elements || a.properties), b, a.properties && true);
        return declarations;
    }

    transformUpdateExpression(node) {
        if (node.argument.type === 'Identifier') {
            this.transformSignal(node.argument, 'update', this.currentEntry.signals);
            const currentValueLocalIdentifier = this.currentScope.getRandomIdentifier('$current', false);
            const expr = Node.binaryExpr(node.operator === '--' ? '-' : '+', currentValueLocalIdentifier, Node.literal(1), true/* being now a bare value */);
            const kind = (node.prefix ? 'pre' : 'post') + (node.operator === '--' ? 'dec' : 'inc');
            return this.$call('update', Node.literal(node.argument.name), this.$closure([currentValueLocalIdentifier], expr), this.$obj({ kind: Node.literal(kind) }));
        }
        return Node.updateExpr(node.operator, this.transformNode(node.argument), node.prefix);
    }

    transformUnaryExpression(node) {
        if (node.operator === 'typeof' && node.argument.type === 'Identifier') {
            node.argument.hint = 'isTypeCheck';
        }
        return Node.unaryExpr(node.operator, this.transformNode(node.argument));
    }

    /* FLOW CONTROL */

    transformIfStatement(node) {
        const $serial = this.$serial(node);
        let { test, consequent, alternate } = node;
        // test
        test = this.transformNode(node.test);
        // consequent and alternate
        consequent = this.pushScope(node, () => this.transformNodes(consequent.type === 'BlockStatement' ? consequent.body : [consequent]));
        if (alternate) alternate = [].concat(this.transformNode(alternate))[0];
        const construct = Node.ifStmt(test, Node.blockStmt(consequent), alternate);
        return this.$autorun('block', { static: Node.identifier(this.currentEntry.static) }, $serial, Node.blockStmt([construct]));
    }

    transformSwitchStatement(node) {
        const $serial = this.$serial(node);
        return this.pushScope(node, () => {
            const discriminant = this.transformNode(node.discriminant);
            const cases = node.cases.map(caseNode => {
                const test = this.transformNode(caseNode.test);
                const consequent = this.transformNodes(caseNode.consequent);
                return Node.switchCase(test, consequent);
            });
            const construct = Node.switchStmt(discriminant, cases);
            return this.$autorun('switch', { static: Node.identifier(this.currentEntry.static) }, $serial, Node.blockStmt([construct]));
        });
    }

    transformTryStatement(node) {
        return this.pushScope(node, () => {
            const $serial = this.$serial(node);
            const { block, handler, finalizer } = node;
            const body = this.transformNodes(block.body);
            const spec = {};
            if (handler) {
                const { start, end } = handler;
                const $handler = Node.arrowFuncExpr(null, [handler.param], handler.body,);
                spec.handler = this.transformNode({ ...$handler, isHandler: true, start, end }, { static: true });
            }
            if (finalizer) {
                const { start, end } = finalizer;
                const $finalizer = Node.arrowFuncExpr(null, [], finalizer.body,);
                spec.finalizer = this.transformNode({ ...$finalizer, isFinalizer: true, start, end }, { static: true });
            }
            return this.$autorun('block', spec, $serial, Node.blockStmt(body));
        });
    }

    /* LOOPS */

    transformWhileStatement(node) { return this.transformLoopStmtA(Node.whileStmt, ...arguments); }
    transformDoWhileStatement(node) { return this.transformLoopStmtA(Node.doWhileStmt, ...arguments); }
    transformForStatement(node) { return this.transformLoopStmtA(Node.forStmt, ...arguments); }
    transformLoopStmtA(transform, node) {
        const kind = node.type === 'WhileStatement' ? 'while' : (node.type === 'DoWhileStatement' ? 'do-while' : 'for');
        const $serial = this.$serial(node);
        return this.pushScope(node, () => {
            const $qIdentifier = this.currentScope.get$qIdentifier('$q');
            let createNodeCallback;
            const spec = {
                kind: Node.literal(kind),
                label: this.currentEntry.parentNode?.label ? Node.literal(this.currentEntry.parentNode.label.name) : Node.identifier('null'),
                static: Node.identifier(this.currentEntry.static),
            };
            if (kind === 'for') {
                const init = Node.blockStmt([].concat(this.transformNode(node.init) || []));
                spec.init = this.$closure([$qIdentifier], init);
                const test = this.transformNode(node.test);
                spec.test = this.$closure([$qIdentifier], test);
                const update = this.transformNode(node.update);
                spec.advance = this.$closure([$qIdentifier], update);
                createNodeCallback = $body => transform.call(Node, init, test, update, $body);
            } else {
                const test = this.transformNode(node.test);
                spec.test = this.$closure([$qIdentifier], test);
                createNodeCallback = $body => transform.call(Node, test, $body);
            }
            const $body = Node.blockStmt(this.transformNodes(node.body.type === 'BlockStatement' ? node.body.body : [node.body]));
            return this.$autorun('iteration', spec, $serial, $body);
        });
    }

    transformForOfStatement(node) { return this.transformLoopStmtB(Node.forOfStmt, ...arguments); }
    transformForInStatement(node) { return this.transformLoopStmtB(Node.forInStmt, ...arguments); }
    transformLoopStmtB(transform, node) {
        const kind = node.type === 'ForInStatement' ? 'for-in' : 'for-of';
        const $serial = this.$serial(node);
        const right = this.transformNode(node.right);
        return this.pushScope(node, () => {
            // Iteration driver
            const $qIdentifier = this.currentScope.get$qIdentifier('$q');
            const production = this.currentScope.get$qIdentifier(kind === 'for-of' ? '$val' : '$key', false);
            const spec = {
                kind: Node.literal(kind),
                label: this.currentEntry.parentNode?.label ? Node.literal(this.currentEntry.parentNode.label.name) : Node.identifier('null'),
                parameters: this.$closure([$qIdentifier], Node.arrayExpr([Node.literal(production), right])),
                static: Node.identifier(this.currentEntry.static),
            };
            // Iteration round...
            let originalLeft;
            if (node.left.type === 'VariableDeclaration') {
                const declarator = Node.withLoc(Node.varDeclarator(node.left.declarations[0].id, production), node.left);
                originalLeft = Node.varDeclaration(node.left.kind, [declarator])
            } else {
                originalLeft = Node.withLoc(Node.assignmentExpr(node.left, production), node.left);
            }
            const $body = Node.blockStmt(this.transformNodes([originalLeft].concat(node.body.type === 'BlockStatement' ? node.body.body : node.body)));
            return this.$autorun('iteration', spec, $serial, $body);
        });
    }

    transformBreakStatement(node) { return this.transformExitStmt(Node.breakStmt, ...arguments); }
    transformContinueStatement(node) { return this.transformExitStmt(Node.continueStmt, ...arguments); }
    transformExitStmt(transform, node) {
        const keyword = node.type === 'BreakStatement' ? 'break' : 'continue';
        const cmd = Node.literal(keyword);
        const label = node.label ? Node.literal(node.label.name) : Node.identifier('null');
        // Hoisting...
        this.hoistExitStatement(cmd, label);
        if (this.currentEntry.parentNode?.type === 'SwitchStatement') {
            return transform.call(Node);
        }
        return Node.exprStmt(this.$call(keyword, label),);
    }

    transformReturnStatement(node) {
        const refs = new Set;
        const argument = this.transformNode(node.argument, { refs });
        const cmd = Node.literal('return');
        const args = argument ? [cmd, argument] : [cmd];
        this.hoistExitStatement(...args);

        const hoisting = this.$call('return', ...args.slice(1));
        if (!refs.size) return Node.exprStmt(hoisting);

        // Return statement hoisting
        const $serial = this.$serial(node);
        return this.$autorun('return', $serial, hoisting);
    }

    /* GENERAL */

    transformBlockStatement(node) {
        const $serial = this.$serial(node);
        if (node instanceof $qDownstream) {
            const body = this.transformNodes(node.body, { static: false });
            return this.$autorun('downstream', $serial, Node.blockStmt(body));
        }
        return this.pushScope(node, () => {
            const body = Node.blockStmt(this.transformNodes(node.body));
            return this.$autorun('block', { static: Node.identifier(this.currentEntry.static) }, $serial, body);
        });
    }

    transformLabeledStatement(node) {
        this.currentScope.push(node.label, 'const'); // Before
        const body = [].concat(this.transformNode(node.body));
        return [Node.labeledStmt(node.label, body.shift()), ...body];
    }

    transformExpressionStatement(node) {
        const $serial = this.$serial(node);
        const expression = this.transformNode(node.expression);
        const expression_s = [].concat(expression || []);
        return expression_s.reduce((stmts, expression) => {
            if (expression.type === 'VariableDeclaration' || expression.type.endsWith('Statement')) {
                return stmts.concat(expression);
            }
            const spec = {};
            if ( this.currentEntry.static ) {
                spec.static = Node.literal(true);
            }
            if ( ['UpdateExpression', 'UnaryExpression'].includes(expression.type) ) {
                spec.isWrite = Node.literal(true);
            }
            return stmts.concat(this.$autorun('stmt', spec, $serial, expression));
        }, []);
    }

    transformAwaitExpression(node) {
        this.hoistAwaitKeyword();
        const argument = this.transformNode(node.argument);
        return Node.awaitExpr(argument);
    }

    transformSequenceExpression(node) {
        const expresions = node.expressions.reduce((exprs, expr, i) => {
            return exprs.concat(this.transformNode(expr, { trail: i === node.expressions.length - 1 ? this.currentEntry.trail : undefined }));
        }, []);
        if (this.history[1].node.type === 'ExpressionStatement') return expresions;
        return Node.sequenceExpr(expresions);
    }

    transformConditionalExpression(node) {
        let { test, consequent, alternate } = node;
        test = this.transformNode(test);
        consequent = this.transformNode(consequent, { trail: this.currentEntry.trail });
        alternate = this.transformNode(alternate, { trail: this.currentEntry.trail });
        return Node.conditionalExpr(test, consequent, alternate);
    }

    transformLogicalExpression(node) {
        let { left, right } = node;
        left = this.transformNode(left, { trail: this.currentEntry.trail });
        right = this.transformNode(right, { trail: this.currentEntry.trail });
        return Node.logicalExpr(node.operator, left, right);
    }

    transformBinaryExpression(node) {
        let { left, right } = node;
        left = this.transformNode(left);
        right = this.transformNode(right);
        const expr = Node.binaryExpr(node.operator, left, right);
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

    transformCallExpression(node) { return this.transformCallExpr(Node.callExpr, ...arguments); }
    transformNewExpression(node) { return this.transformCallExpr(Node.newExpr, ...arguments); }
    transformCallExpr(transform, node) {
        // The ongoing reference must be used for callee
        const callee = this.transformNode(node.callee, { mode: 'callee' });
        const args = node.arguments.map(argument => this.transformNode(argument));
        const expr = transform.call(Node, callee, args, node.optional);
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

    transformObjectExpression(node) {
        const expr = Node.objectExpr(node.properties.map(property => this.transformNode(property)));
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

    transformProperty(node) {
        let { key, value } = node;
        if (node.computed) { key = this.transformNode(key); }
        value = this.transformNode(value);
        return Node.property(key, value, node.kind, false/* node.shorthand. due to the transformation */, node.computed, false/* node.method. due to the transformation */);
    }

    transformArrayExpression(node) {
        const expr = Node.arrayExpr(node.elements.map(element => this.transformNode(element)));
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

    transformTaggedTemplateExpression(node) {
        const [tag, quasi] = this.transformNodes([node.tag, node.quasi]);
        const expr = Node.taggedTemplateExpr(tag, quasi);
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

    transformTemplateLiteral(node) {
        const expressions = node.expressions.map(expression => this.transformNode(expression));
        const expr = Node.templateLiteral(node.quasis, expressions);
        // Object mode?
        if (this.currentEntry.trail) { return this.$call('obj', expr, ...this.$trail()); }
        return expr;
    }

}
