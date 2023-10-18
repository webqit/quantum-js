
/**
 * @imports
 */
import { generate as astringGenerate } from 'astring';
import $fIdentifier from './$fIdentifier.js';
import $fRest from './$fRest.js';
import Scope from './Scope.js';
import Node from './Node.js';

/**
 * NICE TO HAVES: leaner output via heuristics
 */
export default class Compiler {

    history = [];
    scopes = [];
    functionTypes = [ 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression' ];
    loopTypes = [ 'DoWhileStatement', 'WhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement' ];
    labeledTypes = [ 'SwitchStatement', 'LabeledStatement' ];
    topLevelAwait = false;
    topLevelArgsKeyword = false;

    constructor( params = {} ) {
        this.params = params;
    }

    pushScope( scopeData, callback ) {
        const scope = new Scope( this.currentScope, scopeData );
        this.scopes.unshift( scope );
        const returnValue = callback();
        this.scopes.shift();
        return returnValue;
    }

    get currentScope() { return this.scopes[ 0 ]; }

    pushHistory( state, callback ) {
        this.history.unshift( state );
        const returnValue = callback();
        this.history.shift();
        return returnValue;
    }

    get currentEntry() { return this.history[ 0 ]; }

    /* ------------------------------ */

    serialize( ast, params = {} ) { return astringGenerate( ast, { comments: true, ...params } ); }

    transform( ast ) {
        if ( ast.type !== 'Program' ) throw new Error( 'AST must be of type "Program".' );
        return this.pushScope( ast, () => {
            const body = this.transformNodes( ast.body, { static: this.params.startStatic } );
            const newAst = { ...ast, body };
            // -------------
            // Program body comment
            if ( newAst.body.length ) { newAst.body[ 0 ].comments = Node.comments( 'Program body' ); }
            // Location data and comment
            const locationsAssignment = Node.exprStmt( Node.assignmentExpr( this.$path( 'locations' ), Node.arrayExpr( this.currentScope.locations ) ) );
            locationsAssignment.comments = Node.comments( 'Location data' );
            newAst.body.unshift( locationsAssignment );
            // -------------
            if ( this.exports.size ) {
                // Render all exports
                this.exports.forEach( args => { newAst.body.push( Node.exprStmt( this.$call( 'export', ...args ) ) ); } );
                // Insert an "await exports.promises" statement after all exports
                const promiseAll = Node.memberExpr( Node.identifier( 'Promise' ), Node.identifier( 'all' ) );
                newAst.body.push( Node.exprStmt( Node.awaitExpr( Node.callExpr( promiseAll, [ this.$path( '$promises.exports' ) ] ) ) ) );
            }
            const compiledSource = this.serialize( newAst, { startingIndentLevel: this.params.startingIndentLevel } );
            return {
                toString()  { return compiledSource },
                identifier: this.currentScope.get$fIdentifier( '$f' ).name,
                topLevelAwait: this.topLevelAwait,
                get originalSource() { return ast.originalSource || '' },
            };
        } );
    }

    transformNodes( nodes, state = {} ) {
        const total = nodes.length;
        // Hoist FunctionDeclarations and ImportDeclaration
        const [ imports, functions, other ] = nodes.reduce( ( [ imports, functions, other ], node ) => {
            return node.type === 'ImportDeclaration' ? [ imports.concat( node ), functions, other ] : (
                node.type === 'FunctionDeclaration' ? [ imports, functions.concat( node ), other ] : [ imports, functions, other.concat( node ) ]
            );
        }, [ [], [], [] ] );
        // Back together...
        nodes = [ ...imports, ...functions, ...other ];
        // Process now...
        return ( function eat( build, i ) {
            if ( i === total ) return build;
            // Generate...
            const [ $node_s, $state ] = this.transformNode( nodes[ i ], state, true );
            build = build.concat( $node_s || []/* exports are often not returned */ );
            if ( i === imports.length - 1 ) {
                // Insert an "await imports.promises" statement after all imports
                const promiseAll = Node.memberExpr( Node.identifier( 'Promise' ), Node.identifier( 'all' ) );
                build = build.concat( Node.exprStmt( Node.awaitExpr( Node.callExpr( promiseAll, [ this.$path( '$promises.imports' ) ] ) ) ) );
            }
            // Skip rest code after return, break, or continue
            if ( [ 'ReturnStatement', 'BreakStatement', 'ContinueStatement' ].includes( nodes[ i ].type ) ) return build;
            // Construct "rest" block
            if ( $state.flowControl?.size && $state.node.type === 'IfStatement' ) {
                const restNodes = nodes.slice( i + 1 );
                if ( restNodes.length ) {
                    const restBlock = new $fRest( restNodes );
                    return build.concat( this.transformNode( restBlock ) );
                }
            }
            return eat.call( this, build, i + 1 );
        } ).call( this, [], 0 );
        
    }

    transformNode( node, state = {}, getState = false ) {
        if ( typeof node !== 'object' || !node ) return node;
        const historyData = {
            static: this.currentEntry?.static,
            mode: this.currentEntry?.mode,
            ...state,
            parentNode: this.currentEntry?.node,
            node,
            hoistedAwaitKeyword: false,
            flowControl: new Map,
        };
        const $node = this.pushHistory( historyData, () => {
            if ( this[ `transform${ node.type }` ] ) {
                return this[ `transform${ node.type }` ].call( this, node );
            }
            return Object.keys( node ).reduce( ( $node, key ) => {
                const value = Array.isArray( node[ key ] )
                    ? this.transformNodes( node[ key ], state )
                    : this.transformNode( node[ key ], state );
                return { ...$node, [ key ]: value };
            }, {} );
        } );
        return getState ? [ $node, historyData ] : $node;
    }

    /* HELPERS */

    $serial( node ) { return this.currentScope.index( node, this.params.locations ); }
 
    $path( path ) { return  path.split( '.' ).reduce( ( obj, prop ) => Node.memberExpr( obj, Node.identifier( prop ) ), this.currentScope.get$fIdentifier( '$f' ) ); }
    
    $trail() { return this.currentEntry.trail ? [ Node.literal( this.currentEntry.trail ) ] : []; }

    $call( callee, ...args ) { return Node.callExpr( this.$path( callee ), args ); }

    $obj( obj ) {
        const entries = Object.entries( obj ).map( ( [ name, value ] ) => Node.property( Node.identifier( name ), Array.isArray( value ) ? Node.arrayExpr( value ) : value ) );
        return Node.objectExpr( entries );
    }

    $closure( ...args ) {
        const body = args.pop(), params = args.pop() || [];
        return Node.arrowFuncExpr( null, params, body, this.currentEntry.hoistedAwaitKeyword );
    }

    $var( kind, $serial, id, init ) {
        const closure = init ? this.$closure( Node.assignmentExpr( id, init ) ) : Node.identifier( 'undefined' );
        const declareExpr = Node.varDeclaration( kind, [ Node.varDeclarator( id ) ] );
        const autorunExpr = Node.exprStmt( this.$call( kind, Node.literal( id ), $serial, closure ) );
        return [ declareExpr, autorunExpr ];
    }

    $update( left, right ) {
        const closure = this.$closure( Node.assignmentExpr( left, right ) );
        return this.$call( 'update', Node.literal( left.name ), closure );
    }

    $autorun( type, ...rest ) {
        const body = rest.pop();
        const $serial = rest.pop();
        const spec = rest.pop() || {};
        const $spec = Object.keys( spec ).length ? [ this.$obj( spec ) ] : [];;
        const closure = this.$closure( ( spec.args || [] ).slice( 0 ), body );
        let autorun = this.$call( 'autorun', Node.literal( type ), ...$spec, $serial, closure );
        if ( closure.async ) { autorun = Node.awaitExpr( autorun ); }
        return Node.exprStmt( autorun );
    }

    $iteration( kind, $serial, body ) {
        const $kind = Node.literal( kind );
        const label = this.currentEntry.parentNode.label ? Node.literal( this.currentEntry.parentNode.label.name ) : Node.identifier( 'null' );
        const spec = { kind: $kind, label };
        const $body = Node.blockStmt( body );
        return this.$autorun( 'iteration', spec, $serial, $body );
    }

    $round( spec, $serial, body ) {
        // Buildup...
        const stmts = [ this.$autorun( 'round', spec, $serial, body ) ];
        // Check/action constructor
        let prevIf, exitStrategy_return;
        const pushIfStmt = ( test, consequent ) => {
            const ifStmt = Node.ifStmt( test, consequent );
            if ( prevIf ) {
                prevIf.alternate = ifStmt;
                prevIf = prevIf.alternate;
            } else { stmts.push( prevIf = ifStmt ); }
        };
        // The loop
        const flowControl = this.currentEntry.flowControl, seen = new Set;
        flowControl.forEach( ( arg, cmd ) => {
            if ( [ 'break', 'continue' ].includes( cmd.value ) && arg.endpoint ) {
                const exitSignature = `${ cmd.value }|${ arg.value || arg.name }`;
                if ( seen.has( exitSignature ) ) return;
                const exitCheck = this.$call( 'nowRunning.flowControlApplied', cmd, arg );
                const exitAction = Node.exprStmt( Node.identifier( cmd.value ) );
                pushIfStmt( exitCheck, exitAction );
                flowControl.delete( cmd );
                seen.add( exitSignature );
            } else {  exitStrategy_return = true; }
        } );
        if ( exitStrategy_return ) {
            const exitCheck = this.$call( 'nowRunning.flowControlApplied' );
            const exitAction = Node.exprStmt( Node.identifier( 'return' ) );
            pushIfStmt( exitCheck, exitAction );
        }
        // Total
        return Node.blockStmt( stmts );
    }

    /* FLOW CONTROL */

    hoistAwaitKeyword() {
        for ( const entry of this.history ) {
            entry.hoistedAwaitKeyword = true;
            if ( entry.node.type.includes( 'Function' ) ) return;
        }
        this.topLevelAwait = true;
    }

    hoistArgumentsKeyword() {
        const keywordScopes = [ 'FunctionDeclaration', 'FunctionExpression' ];
        if ( this.history.some( e => keywordScopes.includes( e.node.type ) ) ) return;
        this.topLevelArgsKeyword = true;
        return true;
    }

    hoistExitStatement( cmd, arg = {} ) {
        for ( const entry of this.history ) {
            const isTargetSwitch = () => entry.node?.type === 'SwitchStatement' && cmd.value === 'break' && arg.name === 'null';
            const isTargetLabel = () => entry.parentNode?.type === 'LabeledStatement' && this.loopTypes.includes( entry.parentNode.body.type ) && arg.value === entry.parentNode.label.name;
            const isBareExit = () => this.loopTypes.includes( entry.node.type ) && arg.name === 'null';
            if ( isTargetSwitch() ) { return entry.node; }
            if ( isTargetLabel() || isBareExit() ) {
                entry.flowControl.set( cmd, { ...arg, endpoint: true } );
                return entry.node;
            }
            if ( entry.node.type.includes( 'Function' ) ) return;
            entry.flowControl.set( cmd, arg );
        }
    }

    /* FUNCTIONS */

    transformFunctionDeclaration( node ) { return this.transformFunction( Node.funcDeclaration, ...arguments ) }
    transformFunctionExpression( node ) { return this.transformFunction( Node.funcExpr, ...arguments ) }
    transformArrowFunctionExpression( node ) { return this.transformFunction( Node.arrowFuncExpr, ...arguments ) }
    transformFunction( transform, node ) {
        const $serial = this.$serial( node );
        let { id, params, body } = node;

        // Note the static/non-static mode switch
        [ id, params, body ] = this.pushScope( node, () => {
            const $body = [];
            // Function name
            if ( id ) { this.currentScope.push( id, 'self' ); } // Before anything
            // Params
            const $params = params.map( param => {
                if ( param.type === 'AssignmentPattern' && node.isStatefulFunction ) {
                    const $rand = this.currentScope.getRandomIdentifier( '$rand', false );
                    const $param = this.transformSignal( $rand, 'param' ); // Must be registered as a param before line below
                    const declaration = Node.varDeclarator( param.left, Node.withLoc( Node.logicalExpr( '||', $rand, param.right ), param ) );
                    $body.push( ...this.transformNode( Node.varDeclaration( 'let', [ Node.withLoc( declaration, param ) ] ), { static: !node.isStatefulFunction } ) );
                    return $param;
                }
                return this.transformSignal( param, 'param' );
            } );
            // Body
            const $$body = this.transformNode( body, { static: !node.isStatefulFunction } );
            $body.push( ...( $$body.type === 'BlockStatement' ? $$body.body : [ Node.returnStmt( $$body ) ] ) );
            // -------------
            // Function body comment
            if ( $body.length ) { $body[ 0 ].comments = Node.comments( 'Function body' ); }
            // Location data and comment
            const locationsAssignment = Node.exprStmt( Node.assignmentExpr( this.$path( 'locations' ), Node.arrayExpr( this.currentScope.locations ) ) );
            locationsAssignment.comments = Node.comments( 'Location data' );
            $body.unshift( locationsAssignment );
            // -------------
            // Result
            return [ id, $params, Node.blockStmt( $body ), ];
        } );

        const $fIdentifier = this.currentScope.get$fIdentifier( '$f' );
        const closure = this.$closure( [ $fIdentifier ], body );

        const isStatefulFunctionFlag = Node.identifier( node.isStatefulFunction || false );
        const isDeclaration = Node.identifier( node.type === 'FunctionDeclaration' );
        const $body = Node.blockStmt( [ Node.returnStmt( this.$call( 'run', isStatefulFunctionFlag, closure ) ) ] );

        const metarisation = reference => this.$call( 'function', isDeclaration, isStatefulFunctionFlag, $serial, reference/* reference to the declaration */ );
        let resultNode = transform.call( Node, id, params, $body, node.async, node.expresion, node.generator );
        if ( node.type === 'FunctionDeclaration' ) {
            this.currentScope.push( id, 'static' ); // On outer scope
            resultNode = [ resultNode, Node.exprStmt( metarisation( id ) ) ];
            // Is export?
            if ( this.currentEntry.isExport ) {
                const spec = [ id, Node.literal( this.currentEntry.isExport === 'as-default' ? 'default' : id ) ];
                this.exports.add( [ Node.arrayExpr( spec ) ] );
            }
        } else if ( !this.currentEntry.isMethod ) { resultNode = metarisation( resultNode ); }
        
        return resultNode;
    }

    /* CLASSES */

    transformClassDeclaration( node ) { return this.transformClass( Node.classDeclaration, ...arguments ); }
    transformClassExpression( node ) { return this.transformClass( Node.classExpression, ...arguments ); }
    transformClass( transform, node ) {
        let { id, body, superClass } = node;
        const methods = new Set;
        body = this.pushScope( node, () => {
            // On the inner scope
            if ( id ) { this.currentScope.push( id, 'self' ); } // Before anything
            return this.transformNode( body, { methods } );
        } );
        const isDeclaration = Node.identifier( node.type === 'ClassDeclaration' );
        const metarisation = reference => {
            const methodsSpec = Node.arrayExpr( [ ...methods ].map( m => this.$obj( m ) ) );
            return this.$call( 'class', isDeclaration, reference/* reference to the declaration */, methodsSpec );
        };
        let resultNode = transform.call( Node, id, body, superClass );
        if ( node.type === 'ClassDeclaration' ) {
            this.currentScope.push( id, 'static' ); // On the outer scope
            resultNode = [ resultNode, Node.exprStmt( metarisation( id ) ) ];
            // Is export?
            if ( this.currentEntry.isExport ) {
                const spec = [ id, Node.literal( this.currentEntry.isExport === 'as-default' ? 'default' : id ) ];
                this.exports.add( [ Node.arrayExpr( spec ) ] );
            }
        } else { resultNode = metarisation( resultNode ); }

        return resultNode;
    }

    transformMethodDefinition( node ) {
        let { key, value } = node;
        if ( node.computed ) { key = this.transformNode( key ); }
        const $value = this.transformNode( value, { static: true, isMethod: true } );
        this.currentEntry.methods.add( {
            name: node.computed ? key : Node.literal( key ),
            static: Node.identifier( node.static ),
            isStatefulFunction: Node.identifier( value.isStatefulFunction || false ),
            serial: this.$serial( node ),
        } );
        return Node.methodDefinition( key, $value, node.kind, node.static, node.computed );
    }

    transformPropertyDefinition( node ) {
        let { key, value } = node;
        if ( node.computed ) { key = this.transformNode( key ); }
        value = this.transformNode( value );
        return Node.exprStmt( Node.propertyDefinition( key, value, node.static, node.computed ) );
    }

    /** IMPORTS & EXPORTS */

    exports = new Set;
    transformExportDefaultDeclaration( node ) { return this.handleExports( ...arguments ); }
    transformExportNamedDeclaration( node ) { return this.handleExports( ...arguments ); }
    transformExportAllDeclaration( node ) { return this.handleExports( ...arguments ); }
    handleExports( node ) {
        // ExportAllDeclaration: has "source" and "exported". (The equivalen of spec.type === 'ImportNamespaceSpecifier' above.)
        if ( node.type === 'ExportAllDeclaration' ) {
            const spec = [ Node.literal( '*' ), this.$serial( node.exported || node ), Node.literal( node.exported?.name || node.exported?.value || '' ) ];
            this.exports.add( [ Node.arrayExpr( spec ), this.$obj( { source: node.source, serial: this.$serial( node ) } ) ] );
            return;
        }
        // Specifiers helper
        const specifiers = specs => specs.map( spec => {
            const $spec = [ Node.literal( spec.local.name ), this.$serial( spec ) ];
            const alias = spec.exported.name || spec.exported.value;
            if ( alias !== spec.local.name ) $spec.push( Node.literal( alias ) );
            return Node.arrayExpr( $spec );
        } );
        // ExportNamedDeclaration: may have a "source" and "specifiers"
        if ( node.source ) {
            this.exports.add( specifiers( node.specifiers ).concat( this.$obj( { source: node.source, serial: this.$serial( node ) } ) ) );
            return;
        }
        // Now we're left with local exports! First we deal with specifiers of type "identifier"...
        if ( node.type === 'ExportNamedDeclaration' && node.specifiers.length ) {
            this.exports.add( specifiers( node.specifiers ) );
            return;
        }
        if ( node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'Identifier' ) {  
            const spec = [ Node.literal( node.declaration.name ), this.$serial( node ), Node.literal( 'default' ) ];
            this.exports.add( [ Node.arrayExpr( spec ) ] );
            return;
        }
        // Next we deal with declarations; which for ExportNamedDeclaration may be any sort of declaration
        // while for ExportDefaultDeclaration may be any sort of declaration other than variables
        return this.transformNode( node.declaration, { isExport: node.type === 'ExportDefaultDeclaration' ? 'as-default' : true } );
    }

    transformImportDeclaration( node ) {
        const specifiers = node.specifiers.map( spec => {
            let { imported, local } = spec;
            this.transformSignal( local, 'import' );
            if ( spec.type === 'ImportNamespaceSpecifier' ) { imported = Node.identifier( '*' ); }
            else if ( spec.type === 'ImportDefaultSpecifier' ) { imported = Node.identifier( 'default' ); }
            const $imported = imported.name || imported.value || '';
            const $spec = [ Node.literal( $imported ), this.$serial( spec ) ];
            if ( $imported !== spec.local.name ) $spec.push( Node.literal( spec.local.name ) );
            return Node.arrayExpr( $spec );
        } );
        return Node.exprStmt( this.$call( 'import', ...specifiers.concat( this.$obj( { source: node.source, serial: this.$serial( node ) } ) ) ) );
    }

    /* IDENTIFIERS & PATHS */

    transformSignal( node, mode, signals = null ) {
        if ( node.type === 'Identifier' ) {
            this.currentScope.push( node, mode, [ 'let', 'param' ].includes( mode ) );
            signals?.add( node );
            return node;
        }
        // A pattern
        return this.transformNode( node, { mode, static: true, signals } );
    }

    transformThisExpression( node ) { return this.transformIdentifier( ...arguments ); }
    transformIdentifier( node ) {
        const ref = this.currentScope.find( node );
        if ( !ref && node.name ) { this.currentScope.$fIdentifiersNoConflict( node.name ); }
        // Static mode?
        if ( node.type === 'ThisExpression' || [ 'param', 'self' ].includes( ref?.type ) || [ 'arguments' ].includes( node.name ) || ( ref && ref.type !== 'import' && !ref.willUpdate ) ) {
            if ( this.currentEntry.trail ) return this.$call( 'obj', node, ...this.$trail() );
            return node;
        }
        // We're now dealing with an identifier or path that can change
        this.history.forEach( state => state.refs?.add( node ) );
        return this.$call( 'ref', Node.literal( node ), ...this.$trail() );
    }

    transformMemberExpression( node ) {
        let { object, property, computed, optional } = node;
        if ( computed ) { property = this.transformNode( property ); }
        object = this.transformNode( object, { trail: ( this.currentEntry.trail || 0 ) + 1 } );
        return Node.memberExpr( object, property, computed, optional );
    }

    /* DECLARATIONS & MUTATIONS (SIGNALS) */

    transformVariableDeclaration( node ) {
        const staticMode = this.currentEntry.static || node.kind === 'const';
        const isExport = this.currentEntry.isExport;
        // Expanded declarations?
        const entries = node.declarations.reduce( ( decs, dec ) => {
            if ( !staticMode && [ 'ObjectPattern', 'ArrayPattern' ].includes( dec.id.type ) ) {
                return decs.concat( this.expandPattern( dec.id, dec.init ) );
            }
            return decs.concat( dec );
        }, [] );
        // Static mode?
        if ( staticMode ) {
            const exports = [];
            const declaration = Node.varDeclaration( node.kind, entries.reduce( ( decs, dec ) => {
                const signals = new Set;
                const init = this.transformNode( dec.init, { static: true } );
                const id = this.transformSignal( dec.id, node.kind, signals );
                signals.forEach( s => {
                    this.currentEntry.signals?.add( s );
                } );
                // Is export?
                if ( isExport ) { exports.push( ...[ ...signals ].map( id => Node.arrayExpr( [ id, Node.literal( id ) ] ) ) ); }
                return decs.concat( Node.varDeclarator( id, init ) );;
            }, [] ) );
            if ( exports.length ) { this.exports.add( exports ); }
            return declaration;
        }
        // Dynamic assignment construct
        return entries.reduce( ( stmts, dec ) => {
            const $serial = this.$serial( dec );
            const init = this.transformNode( dec.init );
            this.transformSignal( dec.id, node.kind, this.currentEntry.signals );
            const $stmts = stmts.concat( this.$var( node.kind, $serial, dec.id, init ) );
            // Is export?
            if ( isExport && !( dec.id instanceof $fIdentifier ) ) {
                const spec = [ Node.literal( dec.id ), $serial ];
                this.exports.add( [ Node.arrayExpr( spec ) ] );
            }
            return $stmts;
        }, [] );
    }

    transformAssignmentExpression( node ) {
        const staticMode = this.currentEntry.static;
        const expandableAsStatements = !staticMode && this.history[ 1 ].node.type === 'ExpressionStatement';
        let { left, right } = node;

        // Regular assignmentExpr
        const assignmentExpr = ( left, right ) => {
            right = this.transformNode( right );
            left = this.transformNode( left );
            return Node.assignmentExpr( left, right, node.operator );
        };

        // Property mutation?
        if ( [ 'MemberExpression', 'ChainExpression'  ].includes( left.type ) ) { return assignmentExpr( left, right ); }

        // Expanded declarations?
        if ( [ 'ObjectPattern', 'ArrayPattern' ].includes( left.type ) ) {
            let potentialNewRight = right;
            const declarations = this.expandPattern( left, right, expandableAsStatements ).reduce( ( stmts, dec ) => {
                // Was "right" simplified? We'll need the new reference
                if ( dec.id.originalB ) { potentialNewRight = dec.id; }
                // An assignment?
                if ( dec.type === 'AssignmentExpression' ) {
                    return stmts.concat( assignmentExpr( dec.left, dec.right ) );
                }
                // Actual operation
                const init = this.transformNode( dec.init );
                const closure = this.$closure( Node.assignmentExpr( dec.id, init ) );
                // As intermediate variable?
                if ( dec.id instanceof $fIdentifier ) {
                    const $serial = this.$serial( dec );
                    return stmts.concat( this.$var( 'let', $serial, dec.id, init ) );
                }
                // As update!
                this.transformSignal( dec.id, 'update', this.currentEntry.signals ); // An identifier
                return stmts.concat( this.$update( dec.id, init ) );
            }, [] );
            // As individual statements?
            if ( expandableAsStatements ) return declarations;
            // As sequence!
            return Node.sequenceExpr( declarations.concat( potentialNewRight ) );
        }

        // Other: left is an identifier
        right = this.transformNode( right );
        this.transformSignal( left, 'update', this.currentEntry.signals );
        return this.$call( 'update', Node.literal( left ), this.$closure( Node.assignmentExpr( left, right, node.operator ) ) );
    }

    transformAssignmentPattern( node ) {
        let { left, right } = node;
        right = this.transformNode( right );
        if ( [ 'MemberExpression', 'ChainExpression' ].includes( left.type ) ) {
            left = this.transformNode( left, { static: true } );
        } else/* Identifier/Object/ArrayPattern */ {
            left = this.transformSignal( left, this.currentEntry.mode, this.currentEntry.signals );
        }
        return Node.assignmentPattern( left, right );
    }

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
    
    expandPattern( a, b, withIntermediates = true ) {
        const declarations = [], _this = this;
        if ( ![ 'Identifier' ].includes( b.type ) && withIntermediates ) {
            const intermediateLocalIdentifier = Node.withLoc( _this.currentScope.getRandomIdentifier( '$rand', false ), b );
            intermediateLocalIdentifier.originalB = true;
            declarations.push( Node.withLoc( Node.varDeclarator( intermediateLocalIdentifier, b ), b ) );
            b = intermediateLocalIdentifier;
        }
        ( function expand( patternEntries, $init ) {
            for ( let i = 0; i < patternEntries.length; i ++ ) {
                let entry = patternEntries[ i ], key = i, value = entry;
                const isProperty = entry.type === 'Property';
                if ( isProperty ) { ( { key, value } = entry ); }
                else { key = Node.literal( key ); }
                // Obtain default value and local identifier
                let defaultValue, localIdentifier;
                if ( value.type === 'AssignmentPattern' ) {
                    defaultValue = value.right;
                    if ( value.left.type === 'Identifier' ) { localIdentifier = value.left; }
                    else { value = value.left; }
                } else if ( value.type === 'Identifier' ) {
                    localIdentifier = value;
                }
                // Generate for let and var
                let init = Node.memberExpr( $init, key, isProperty ? entry.computed : true );
                if ( defaultValue ) { init = Node.logicalExpr( '||', init, defaultValue ); }
                if ( localIdentifier ) {
                    declarations.push( Node.withLoc( Node.varDeclarator( localIdentifier, init ), entry ) );
                } else if ( value.type === 'MemberExpression' || ( value.type === 'ChainExpression' && ( value = value.expression ) ) ) {
                    declarations.push( Node.withLoc( Node.assignmentExpr( value, init ), entry ) );
                } else if ( value.elements || value.properties ) {
                    const numDeclarationsAtLevel = value.properties 
                        ? value.properties
                        : value.elements
                    if ( withIntermediates && numDeclarationsAtLevel.length > 1 ) {
                        const intermediateLocalIdentifier = _this.currentScope.getRandomIdentifier( '$rand', false );
                        declarations.push( Node.withLoc( Node.varDeclarator( intermediateLocalIdentifier, init ), entry ) );
                        init = intermediateLocalIdentifier;
                    }
                    expand( ( value.elements || value.properties ), init );
                }
            }
        } )( ( a.elements || a.properties ), b );
        return declarations;
    }

    transformUpdateExpression( node ) {
        if ( node.argument.type === 'Identifier' ) {
            this.transformSignal( node.argument, 'update', this.currentEntry.signals );
            const currentValueLocalIdentifier = this.currentScope.getRandomIdentifier( '$current', false );
            const expr = Node.binaryExpr( node.operator === '--' ? '-' : '+', currentValueLocalIdentifier, Node.literal( 1 ), true/* being now a bare value */ );
            return this.$call( 'update', Node.literal( node.argument.name ), this.$closure( [ currentValueLocalIdentifier ], expr ), Node.identifier( node.prefix ) );
        }
        return transform.call( Node, node.operator, this.transformNode( node.argument ), node.prefix );
    }

    /* FLOW CONTROL */

    transformIfStatement( node ) {
        const $serial = this.$serial( node );
        let { test, consequent, alternate } = node;

        // test and consequent
        test = this.transformNode( node.test );
        consequent = this.pushScope( node, () => this.transformNodes( [ node.consequent ] ) );
        if ( consequent[ 0 ].type !== 'BlockStatement' && consequent.length > 1 ) {
            consequent = Node.blockStmt( consequent );
        } else { consequent = consequent[ 0 ]; }

        // alternate
        if ( alternate ) {
            alternate = this.pushScope( node, () => this.transformNodes( [ node.alternate ] ) );
            // An update expression like ({ a, b } = {});, for example, will come expanded
            if ( alternate[ 0 ] && alternate[ 0 ].type !== 'BlockStatement' && alternate.length > 1 ) {
                alternate = Node.blockStmt( alternate );
            } else { alternate = alternate[ 0 ]; }
            if ( alternate.type === 'BlockStatement' ) {
                alternate = this.$autorun( 'block', this.$serial( node.alternate ), alternate );
            }
        }

        const construct = Node.ifStmt( test, consequent, alternate );
        // Static mode?
        if ( this.currentEntry.static ) return construct;

        return this.$autorun( 'block', $serial, Node.blockStmt( [ construct ] ) );
    }

    transformSwitchStatement( node ) {
        const $serial = this.$serial( node );
        return this.pushScope( node, () => {
            const discriminant = this.transformNode( node.discriminant );
            const cases = node.cases.map( caseNode => {
                const test = this.transformNode( caseNode.test );
                const consequent = this.transformNodes( caseNode.consequent );
                return Node.switchCase( test, consequent );
            } );

            const construct = Node.switchStmt( discriminant, cases );
            // Static mode?
            if ( this.currentEntry.static ) return construct;

            return this.$autorun( 'block', $loc, Node.blockStmt( [ construct ] ) );
        } );
    }

    /* LOOPS */

    transformWhileStatement( node ) { return this.transformLoopStmtA( Node.whileStmt, ...arguments ); }
    transformDoWhileStatement( node ) { return this.transformLoopStmtA( Node.doWhileStmt, ...arguments ); }
    transformForStatement( node ) { return this.transformLoopStmtA( Node.forStmt, ...arguments ); }
    transformLoopStmtA( transform, node ) {
        const kind = node.type === 'WhileStatement' ? 'while' : ( node.type === 'DoWhileStatement' ? 'do-while' : 'for' );
        const $serial = this.$serial( node );
        return this.pushScope( node, () => {
            let createNodeCallback, init, test, update, outerStmts = [], signals = new Set;
            
            if ( kind === 'for' ) {
                const $init = this.transformNode( node.init );
                if ( Array.isArray( $init ) && $init.length > 1 ) {
                    outerStmts.push( ...$init );
                    init = null;
                } else { init = [].concat( $init )[ 0 ]; }
                [ test, update ] = this.transformNodes( [ node.test, node.update ], { signals } );
                createNodeCallback = $body => transform.call( Node, init, test, update, $body );
            } else {
                test = this.transformNode( node.test );
                createNodeCallback = $body => transform.call( Node, test, $body );
            }
            const body = this.transformNode( node.body );

            // Static mode?
            return createNodeCallback( body );
            if ( this.currentEntry.static ) { return createNodeCallback( body ); }

            const $body = this.$round( { args: [ ...signals ] }, $serial, body );
            return this.$iteration( kind, $serial, [ ...outerStmts, createNodeCallback( $body ) ] );
        } );
    }

    transformForOfStatement( node ) { return this.transformLoopStmtB( Node.forOfStmt, ...arguments ); }
    transformForInStatement( node ) { return this.transformLoopStmtB( Node.forInStmt, ...arguments ); }
    transformLoopStmtB( transform, node ) {
        const kind = node.type === 'ForInStatement' ? 'for-in' : 'for-of';
        const $serial = this.$serial( node );
        const right = this.transformNode( node.right );
        return this.pushScope( node, () => {
            if ( this.currentEntry.static ) {
                const [ left, body ] = this.transformNodes( [ node.left, node.body ] );
                return transform.call( Node, left, right, body );
            }

            const production = this.currentScope.get$fIdentifier( kind === 'for-of' ? '$val' : '$key', false );
            const spec = {
                kind: Node.literal( kind ),
                label: this.currentEntry.parentNode.label ? Node.literal( this.currentEntry.parentNode.label.name ) : Node.identifier( 'null' ),
                iteratee: this.$closure( right ),
                production: Node.literal( production ),
            };
            let originalLeft;
            if ( node.left.type === 'VariableDeclaration' ) {
                const declarator = Node.withLoc( Node.varDeclarator( node.left.declarations[ 0 ].id, production ), node.left );
                originalLeft = Node.varDeclaration( node.left.kind, [ declarator ] )
            } else {
                originalLeft = Node.withLoc( Node.assignmentExpr( node.left, production ), node.left );
            }
            const $body = Node.blockStmt( this.transformNodes( [ originalLeft ].concat( node.body.body ) ) );

            return this.$autorun( 'iteration', spec, $serial, $body );
        } );
    }

    transformBreakStatement( node ) { return this.transformExitStmt( Node.breakStmt, ...arguments ); }
    transformContinueStatement( node ) { return this.transformExitStmt( Node.continueStmt, ...arguments ); }
    transformExitStmt( transform, node ) {
        const keyword = node.type === 'BreakStatement' ? 'break' : 'continue';
        const cmd = Node.literal( keyword );
        const label = node.label ? Node.literal( node.label.name ) : Node.identifier( 'null' );
        // Hoisting...
        const exitTarget = this.hoistExitStatement( cmd, label );
        if ( exitTarget?.type === 'SwitchStatement' ) {
            return transform.call( Node );
        }
        return Node.exprStmt( this.$call( `nowRunning.${ keyword }`, label ), );
    }

    transformReturnStatement( node ) {
        const refs = new Set;
        const argument = this.transformNode( node.argument, { refs } );
        // Static mode
        if ( this.currentEntry.static ) { return Node.returnStmt( argument ); }

        const cmd = Node.literal( 'return' );
        const args = argument ? [ cmd, argument ] : [ cmd ];
        this.hoistExitStatement( ...args );

        const hoisting = Node.callExpr(
            Node.memberExpr( Node.logicalExpr( '||', this.$path( 'nowRunning' ), this.currentScope.get$fIdentifier( '$f' ) ), Node.identifier( 'return' )
        ), args.slice( 1 ) );
        if ( !refs.size ) return Node.exprStmt( hoisting );

        // Return statement hoisting
        const $serial = this.$serial( node );
        return this.$autorun( 'return', $serial, hoisting );
    }

    /* GENERAL */

    transformBlockStatement( node ) {
        if ( node instanceof $fRest ) {
            const $serial = this.$serial( node );
            const body = this.transformNodes( node.body );
            return this.$autorun( 'rest', $serial, Node.blockStmt( body ) );
        }
        const body = this.pushScope( node, () => this.transformNodes( node.body ) );
        return Node.blockStmt( body );
    }

    transformLabeledStatement( node ) {
        this.currentScope.push( node.label, 'const' ); // Before
        const body = [].concat( this.transformNode( node.body ) );
        return [ Node.labeledStmt( node.label, body.shift() ), ...body ];
    }

    transformExpressionStatement( node ) {
        const $serial = this.$serial( node );
        const expression_s = [].concat( this.transformNode( node.expression ) || [] );
        return expression_s.reduce( ( stmts, expression ) => {
            if ( expression.type === 'VariableDeclaration' || expression.type.endsWith( 'Statement' ) ) {
                return stmts.concat( expression );
            }
            // Static mode?
            if ( this.currentEntry.static ) { return Node.exprStmt( expression ); }
            return stmts.concat( this.$autorun( 'stmt', $serial, expression ) );
        }, [] );
    }

    transformAwaitExpression( node ) {
        this.hoistAwaitKeyword();
        const argument = this.transformNode( node.argument );
        return Node.awaitExpr( argument );
    }

    transformSequenceExpression( node ) {
        const expresions = node.expressions.reduce( ( exprs, expr, i ) => {
            return exprs.concat( this.transformNode( expr, { trail: i === node.expressions.length - 1 ? this.currentEntry.trail : undefined } ) );
        }, [] );
        if ( this.history[ 1 ].node.type === 'ExpressionStatement' ) return expresions;
        return Node.sequenceExpr( expresions );
    }

    transformConditionalExpression( node ) {
        let { test, consequent, alternate } = node;
        test = this.transformNode( test );
        consequent = this.transformNode( consequent, { trail: this.currentEntry.trail } );
        alternate = this.transformNode( alternate, { trail: this.currentEntry.trail } );
        return Node.conditionalExpr( test, consequent, alternate );
    }

    transformLogicalExpression( node ) {
        let { left, right } = node;
        left = this.transformNode( left, { trail: this.currentEntry.trail } );
        right = this.transformNode( right, { trail: this.currentEntry.trail } );
        return Node.logicalExpr( node.operator, left, right );
    }

    transformBinaryExpression( node ) {
        let { left, right } = node;
        left = this.transformNode( left );
        right = this.transformNode( right );
        const expr = Node.binaryExpr( node.operator, left, right );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }

    transformCallExpression( node ) { return this.transformCallExpr( Node.callExpr, ...arguments ); }
    transformNewExpression( node ) { return this.transformCallExpr( Node.newExpr, ...arguments ); }
    transformCallExpr( transform, node ) {
        // The ongoing reference must be used for callee
        const callee = this.transformNode( node.callee, { mode: 'callee' } );
        const args = node.arguments.map( argument => this.transformNode( argument ) );
        const expr = transform.call( Node, callee, args, node.optional );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }

    transformObjectExpression( node ) {
        const expr = Node.objectExpr( node.properties.map( property => this.transformNode( property ) ) );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }

    transformProperty( node ) {
        let { key, value } = node;
        if ( node.computed ) { key = this.transformNode( key ); }
        value = this.transformNode( value );
        return Node.property( key, value, node.kind, node.shorthand, node.computed, false/* node.method. due to the transformation */ );
    }

    transformArrayExpression( node ) {
        const expr = Node.arrayExpr( node.elements.map( element => this.transformNode( element ) ) );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }

    transformTaggedTemplateExpression( node ) {
        const [ tag, quasi ] = this.transformNodes( [ node.tag, node.quasi ] );
        const expr = Node.taggedTemplateExpr( tag, quasi );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }
 
    transformTemplateLiteral( node ) {
        const expressions = node.expressions.map( expression => this.transformNode( expression ) );
        const expr = Node.templateLiteral( node.quasis, expressions );
        // Object mode?
        if ( this.currentEntry.trail ) { return this.$call( 'obj', expr, ...this.$trail() ); }
        return expr;
    }

}
