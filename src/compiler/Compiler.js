
/**
 * @imports
 */
import { generate as astringGenerate } from 'astring';
import EffectReference from './EffectReference.js';
import SignalReference from './SignalReference.js';
import Context from './Context.js';
import Node from './Node.js';

export default class Compiler {

    constructor( params = {} ) {
        this.params = params;
        this.locations = [];
        this._locStart = this.params.locStart || 0;
        this.deferredTasks = [];
    }

    setLocation( runtimeObject, node ) {
        if ( !this.params.locations || !node ) /* such as case: null / default: */ return;
        let loc = [ node.start + this._locStart, node.end + this._locStart ];
        if ( node.loc ) loc.push( node.loc );
        if ( this.params.locations === 'detached' ) {
            this.locations.push( loc );
            runtimeObject.loc = this.locations.length - 1;
        } else {
            runtimeObject.loc = loc;
        }
    }

    serialize(ast, params = {}) {
        return astringGenerate( ast, { comments: true, ...params } );
    }

    /* ------------------------------ */
    /* ------------------------------ */

    generate( nodes ) {
        let def = { type: 'Global' };
        let globalContext = new Context( null, '#', { ...def, params: this.params, } );
        globalContext.defineReflexIdentifier( '$reflex', [ '$x' ] );
        let [ ast ] = globalContext.createScope( def, () => this.generateNodes( globalContext, [ nodes ] ) );
        this.deferredTasks.forEach( task => task() );
        const compilation = {
            source: this.serialize( ast ),
            graph: globalContext.toJson( false ),
            identifier: globalContext.getReflexIdentifier( '$reflex' ),
            locations: this.locations,
            ast,
        };
        if ( this.params.originalSource === true ) {
            compilation.graph.originalSource = this.serialize( nodes );
        }
        return compilation;
    }

    /**
     * ------------
     * @Array of Nodes
     * ------------
     */
    generateNodes( context, nodes, $static = false ) {
        const total = nodes.length;
        if ( total > 1 ) {
            // Hoist FunctionDeclarations
            nodes = nodes.reduce( ( _nodes, node ) => {
                return node.type === 'FunctionDeclaration' ? [ node ].concat( _nodes ) : _nodes.concat( node );
            }, [] );
        }
        const next = index => {
            if ( index === total ) return [];
            let nextCalled = false;
            let _next = () => {
                nextCalled = true;
                return next( index + 1 );
            };
            let transformed;
            if ( nodes[ index ] ) {
                let generate = () => this.generateNode( context, nodes[ index ], $static );
                if ( this[ `generate${ nodes[ index ].type }` ] && ( !$static || [ 'Identifier', 'FunctionDeclaration', 'FunctionExpression' ].includes( nodes[ index ].type ) ) ) {
                    generate = () => this[ `generate${ nodes[ index ].type }` ].call( this, context, nodes[ index ], _next );
                }
                transformed = generate();
            } else {
                transformed = [ nodes[ index ] ];
            }
            if ( !nextCalled ) {
                transformed = [].concat( transformed ).concat( _next(1) );
            }
            return transformed;
        };
        return next( 0 );
    }

    /**
     * ------------
     * @Any Node
     * ------------
     */
    generateNode( context, node, $static = false ) {
        return Object.keys( node ).reduce( ( _node, key ) => {
            let value = node[ key ];
            if ( Array.isArray( value ) ) {
                value = this.generateNodes( context, value, $static );
            } else if ( typeof value === 'object' && value ) {
                [ value ] = this.generateNodes( context, [ value ], $static );
            }
            return { ..._node, [ key ]: value };
        }, {} );
    }

    /* ------------------------------ */
    /* ------------------------------ */

    /**
     * ------------
     * @Program
     * ------------
     */
    generateProgram( context, node ) {
        let def = { type: node.type };
        let body = context.createScope( def, () => this.generateNodes( context, node.body ) );
        return { ...node, body };
    }

    /**
     * ------------
     * @MethodDefinition
     * ------------
     */
    generateMethodDefinition( context, node ) {
        let value = this.generateNode( context, node.value, true/*$static*/ );
        return Node.methodDefinition( node.key, value, node.kind, node.static, node.computed );
    }
    
    /**
     * ------------
     * @FunctionDeclaration
     * @FunctionExpression
     * @ArrowFunctionExpression
     * ------------
     */
    generateFunctionDeclaration( context, node ) { return this.generateFunction( Node.funcDeclaration, ...arguments ) }
    generateFunctionExpression( context, node ) { return this.generateFunction( Node.funcExpr, ...arguments ) }
    generateArrowFunctionExpression( context, node ) { return this.generateFunction( Node.arrowFuncExpr, ...arguments ) }
    generateFunction( generate, context, node ) {
        
        const generateId = ( id, context ) => !id ? [ id ] : context.effectReference( { type: node.type }, () => this.generateNodes( context, [ id ] ), false );
        const def = { type: node.type, isReflexFunction: node.isReflexFunction };
        if ( this.params.originalSource === true ) {
            def.originalSource = this.serialize( node );
        }
        const generateFunction = ( id, params, body ) => context.defineContext( def, functionReflex => {
            return functionReflex.createScope( { type: node.type }, () => {
                // FunctionExpressions have their IDs in function scope
                id = generateId( id, functionReflex )[ 0 ];
                // Function params go into function scope
                params = params.map( param => {
                    if ( param.type === 'AssignmentPattern' ) {
                        let right = this.generateNode( functionReflex, param.right );
                        let def = { type: param.left.type };
                        let [ left ] = functionReflex.effectReference( def, () => this.generateNodes( functionReflex, [ param.left ] ), false );
                        return Node.assignmentPattern( left, right );
                    }
                    let def = { type: param.type };
                    [ param ] = functionReflex.effectReference( def, () => this.generateNodes( functionReflex, [ param ] ), false );
                    return param;
                } );
                if ( node.type === 'ArrowFunctionExpression' && node.expression ) {
                    body = this.generateNode( functionReflex, Node.blockStmt( [ Node.returnStmt( body ) ] ) );
                } else {
                    body = this.generateNode( functionReflex, body );
                }
                return [ functionReflex, id, params, body ];
            } );
        } );

        const id$reflex = Node.identifier( context.getReflexIdentifier( '$reflex', true ) );
        const spliceArgumentsObject = body => {
            if ( !functionReflex.hoistedArgumentsKeyword || node.type === 'ArrowFunctionExpression' ) return body;
            const left = Node.memberExpr( id$reflex, Node.identifier( 'args' ) );
            const _right = Node.callExpr( Node.memberExpr( Node.identifier( 'Array' ), Node.identifier( 'from' ) ), [ Node.identifier( 'arguments' ) ] );
            const right = Node.callExpr( Node.memberExpr( _right, Node.identifier( 'slice' ) ), [ Node.literal( 1 ) ] );
            body.body.unshift( Node.exprStmt( Node.assignmentExpr( left, right ) ) );
            return body;
        };
        
        const reflexCreate = ( generate, functionReflex, funcName, params, body ) => functionReflex.generate(
            generate.call( Node, funcName, [ id$reflex ].concat( params ), spliceArgumentsObject( body ), node.async, node.expression, node.generator ), {
                args: [ Node.literal( node.type ), Node.identifier( node.isReflexFunction ? 'true' : 'false' ) ],
                isFunctionReflex: true,
                generateForArgument: true,
            }
        );

        let resultNode, functionReflex, id, params, body;
        if ( node.type === 'FunctionDeclaration' ) {
            // FunctionDeclarations have their IDs in current scope
            [ id ] = generateId( node.id, context );
            [ functionReflex, , params, body ] = generateFunction( null, node.params, node.body );
            resultNode = reflexCreate( Node.funcExpr, functionReflex, id, params, body );
            // We'll physically do hoisting
            let definitionRef = Node.memberExpr( id$reflex, Node.identifier( 'functions' ) );
            let definitionCall = ( method, ...args ) => Node.callExpr( Node.memberExpr( definitionRef, Node.identifier( method ) ), [ id, ...args ] );
            // Generate now
            resultNode = [
                Node.exprStmt( definitionCall( 'declaration', resultNode ) ),
                generate.call( Node, id, params, Node.blockStmt( [
                    Node.returnStmt( Node.callExpr( Node.memberExpr( definitionCall( 'get' ), Node.identifier( 'call' ) ), [
                            Node.thisExpr(), Node.spreadElement( Node.identifier( 'arguments' ) )
                        ] ) ),
                ] ) )
            ];
        } else {
            // FunctionExpressions and ArrowFunctionExpressions are quite simpler
            [ functionReflex, id, params, body ] = generateFunction( node.id, node.params, node.body );
            resultNode = reflexCreate( generate, functionReflex, id, params, body );
        }

        this.deferredTasks.unshift( () => {
            functionReflex.sideEffects.forEach( sideEffect => {
                functionReflex.ownerScope.doSideEffectUpdates( sideEffect.reference, sideEffect.remainderRefs );
            } );
        } );

        return resultNode;
    }

    /**
     * ------------
     * @VariableDeclaration
     * ------------
     */
    generateVariableDeclaration( context, node ) {
        let def = { type: node.type, kind: node.kind };
        let assignmentRefactors = [];
        let exec = ( reflex, declarator, isForLoopInit ) => {
            this.setLocation( reflex, declarator );
            let initReference, [ init ] = reflex.signalReference( def, reference => ( initReference = reference, this.generateNodes( context, [ declarator.init ] ) ) );
            let idReference, [ id ] = reflex.effectReference( def, reference => ( idReference = reference, this.generateNodes( context, [ declarator.id ] ) ) );
            initReference.setAssignee( idReference );
            if (
                isForLoopInit || node.kind === 'const' || !declarator.init
                // note that we're not asking initReference.refs.size
                || ( !this.params.devMode && !reflex.references.filter( reference => reference instanceof SignalReference ).length )
            ) {
                // init might still have effects
                return Node.varDeclarator( id, init );
            }
            // Strip out the init, and re-declare only the local identifiers
            // ID might be Array or Object pattern, so we're better off taking the resolved bare identifiers
            let isPattern = [ 'ObjectPattern', 'ArrayPattern' ].includes( declarator.id.type );
            let declarations = Array.from( idReference.refs ).map( ref => Node.varDeclarator( Node.identifier( ref.path[ 0 ].name ), null ) );
            // Now, covert the init part to an assignment expression
            let assignmentExpr = Node.assignmentExpr( id, init );
            if ( isPattern ) {
                // The below line has been safely removed... astring automatically adds the parens
                //assignmentExpr = Node.parensExpr( assignmentExpr );
            }
            if ( assignmentRefactors.length ) {
                assignmentRefactors.push( Node.varDeclaration( node.kind, declarations ), ...reflex.generate( Node.exprStmt( assignmentExpr ) ) );
                return [];
            }
            assignmentRefactors.push( ...reflex.generate( Node.exprStmt( assignmentExpr ) ) );
            return declarations;
        }
        let isForLoopInit = context.currentReflex && [ 'ForStatement', 'ForOfStatement', 'ForInStatement' ].includes( context.currentReflex.type );
        let declarations = node.declarations.reduce( ( declarators, declarator ) => {
            if ( isForLoopInit ) return declarators.concat( exec( context.currentReflex, declarator, true ) );
            return context.defineReflex( def, reflex => declarators.concat( exec( reflex, declarator ) ) );
        }, [] );
        if ( !declarations.length ) return assignmentRefactors;
        return [ Node.varDeclaration( node.kind, declarations ), ...assignmentRefactors ];
    }

    /**
     * ------------
     * @IfStatement
     * ------------
     */
    generateIfStatement( context, node ) {
        let def = { type: node.type };
        return context.defineReflex( def, reflex => {
            let { consequent, alternate } = node;
            let [ test ] = reflex.signalReference( def, () => this.generateNodes( context, [ node.test ] ) ),
                [ $test, memo ] = context.defineMemo( { expr: test } ).generate();
            consequent = context.createCondition( { when: memo }, () => this.generateNodes( context, [ node.consequent ] ) );
            if ( consequent[ 0 ].type !== 'BlockStatement' && consequent.length > 1 ) {
                consequent = Node.blockStmt( consequent );
            } else {
                consequent = consequent[ 0 ];
            }
            if ( node.alternate ) {
                alternate = context.createCondition( { whenNot: memo }, () => this.generateNodes( context, [ node.alternate ] ) );
                if ( alternate[ 0 ] && alternate[ 0 ].type !== 'BlockStatement' && alternate.length > 1 ) {
                    alternate = Node.blockStmt( alternate );
                } else {
                    alternate = alternate[ 0 ];
                }
            }
            this.setLocation( reflex, node );
            this.setLocation( memo, node.test );
            return reflex.generate(  Node.ifStmt( $test, consequent, alternate ) );
        } );
    }

    /**
     * ------------
     * @SwitchStatement
     * ------------
     */
    generateSwitchStatement( context, node ) {
        let def = { type: node.type };
        return context.defineReflex( def, reflex => {
            let [ discriminant ] = reflex.signalReference( def, () => this.generateNodes( context, [ node.discriminant ] ) );
            let [ $discriminant, memo ] = context.defineMemo( { expr: discriminant } ).generate();
            
            let $cases = context.createScope( def, () => node.cases.reduce( ( casesDef, caseNode ) => {
                let prevCaseDef = casesDef.slice( -1 )[ 0 ];
                let hasBreak = caseNode.consequent.some( stmt => stmt.type === 'BreakStatement' );
                let [ test ] = reflex.signalReference( { type: caseNode.type }, () => this.generateNodes( context, [ caseNode.test ] ) );
                let [ $test, _memo ] = context.defineMemo( { expr: test } ).generate();
                let condition = { switch: memo, cases: [ _memo ] };
                if ( prevCaseDef && !prevCaseDef.hasBreak ) {
                    condition.cases.push( ...prevCaseDef.condition.cases );
                }
                this.setLocation( _memo, caseNode.test );
                return casesDef.concat( { caseNode, $test, condition, hasBreak } );
            }, [] ).map( ( { caseNode, $test, condition } ) => {
                let consequent = context.createCondition( condition, () => this.generateNodes( context, caseNode.consequent ) );
                return Node.switchCase( $test, consequent );
            } ) );

            this.setLocation( reflex, node );
            this.setLocation( memo, node.discriminant );
            return reflex.generate( Node.switchStmt( $discriminant, $cases ) );
        } );
    }

    /**
     * ------------
     * @WhileStatement
     * @DoWhileStatement
     * @ForStatement
     * ------------
     */
    generateWhileStatement( context, node ) { return this.generateLoopStmtA( Node.whileStmt, ...arguments ); }
    generateDoWhileStatement( context, node ) { return this.generateLoopStmtA( Node.doWhileStmt, ...arguments ); }
    generateForStatement( context, node ) { return this.generateLoopStmtA( Node.forStmt, ...arguments ); }
    generateLoopStmtA( generate, context, node ) {
        let def = { type: node.type };
        return context.defineReflex( { type: node.type }, iteratorReflex => {
            this.setLocation( iteratorReflex, node );
            iteratorReflex.defineReflexIdentifier( '$counter', [ '$x_index' ] );
            // A scope for variables declared in header
            return context.createScope( { type: 'Iteration' }, () => {
                let createNodeCallback, init, test, update;
                
                if ( node.type === 'ForStatement' ) {
                    [ init, test, update ] = iteratorReflex.signalReference( def, () => this.generateNodes( context, [ node.init, node.test, node.update ] ) );
                    createNodeCallback = $body => generate.call( Node, init, test, update, $body );
                } else {
                    [ test ] = iteratorReflex.signalReference( def, () => this.generateNodes( context, [ node.test ] ) );
                    createNodeCallback = $body => generate.call( Node, test, $body );
                }

                return context.defineContext( { type: 'Iteration', isIteration: true }, iterationContext => {
                    this.setLocation( iterationContext, node.body );
                    let preIterationDeclarations;
                    let [ body ] = this.generateNodes( iterationContext, [ node.body ] );
                    if ( body.body.length ) {
                        [ preIterationDeclarations, body ] = this.composeLoopStmt( iterationContext, body );
                    }
                    let statements = [].concat( preIterationDeclarations || [] ).concat( createNodeCallback( Node.blockStmt( body ) ) );
                    return iteratorReflex.generate( statements );
                } );

            } );
        } );
    }
    
    /**
     * --------------
     * @composeLoopStmt
     * --------------
     */
    composeLoopStmt( iterationContext, body, params = {} ) {
        let disposeCallbacks = [ params.disposeCallback ], disposeCallback = () => disposeCallbacks.forEach( callback => callback && callback() );
        let preIterationDeclarations = [], iterationDeclarations = [];
        let iterationBody = [], reflexBody = body.body.slice( 0 );
        // Counter?
        if ( !params.iterationId ) {
            params.iterationId = Node.identifier( iterationContext.getReflexIdentifier( '$counter', true ) );
            let counterInit = Node.varDeclarator( Node.clone( params.iterationId ), Node.literal( -1 ) );
            let counterIncr = Node.updateExpr( '++', Node.clone( params.iterationId ), false );
            preIterationDeclarations.push( counterInit );
            iterationBody.push( counterIncr );
            // On dispose
            disposeCallbacks.push( () => iterationBody.pop() /* counterIncr */ );
        }
        // The iterationDeclarations
        if ( iterationDeclarations.length ) {
            iterationBody.push( Node.varDeclaration( 'let', iterationDeclarations ) );
            disposeCallbacks.push( () => iterationBody.splice( -1 ) /* iterationDeclarations */ );
        }
        // Main
        iterationBody.push( ...iterationContext.generate( reflexBody, { args: [ params.iterationId ], disposeCallback } ) );
    
        // Convert to actual declaration
        if ( preIterationDeclarations.length ) {
            preIterationDeclarations = Node.varDeclaration( 'let', preIterationDeclarations );
        } else {
            preIterationDeclarations = null;
        }
    
        return [ preIterationDeclarations, iterationBody ];
    }
    
    /**
     * --------------
     * @ForOfStatement
     * @ForInStatement
     * --------------
     */
    generateForOfStatement( context, node ) { return this.generateLoopStmtB( Node.forOfStmt, ...arguments ); }
    generateForInStatement( context, node ) { return this.generateLoopStmtB( Node.forInStmt, ...arguments ); }
    generateLoopStmtB( generate, context, node ) {
        let def = { type: node.type };
        return context.defineReflex( { type: node.type }, iteratorReflex => {
            this.setLocation( iteratorReflex, node );
            iteratorReflex.defineReflexIdentifier( '$counter', [ node.type === 'ForInStatement' ? '$x_key' : '$x_index' ] );
            // A scope for variables declared in header
            return context.createScope( { type: 'Iteration' }, () => {
                
                let left, iterationId;
                if ( node.left.type === 'VariableDeclaration' ) {
                    [ left ] = this.generateNodes( context, [ node.left ] );
                    iterationId = left.declarations[ 0 ].id;
                } else {
                    [ left ] = iteratorReflex.affectedsReference( def, () => this.generateNodes( context, [ node.left ] ) );
                    iterationId = left;
                }
                let [ right ] = iteratorReflex.signalReference( def, () => this.generateNodes( context, [ node.right ] ) );
                
                return context.defineContext( { type: 'Iteration', isIteration: true }, iterationContext => {
                    this.setLocation( iterationContext, node.body );
                    let [ body ] = this.generateNodes( iterationContext, [ node.body ] );
                    let forStatement = generate.call( Node, left, right, body ),
                        preIterationDeclarations = [];
                    if ( body.body.length ) {
                        let composeIterationWith = params => this.composeLoopStmt( iterationContext, body, {
                            disposeCallback: () => { forStatement.left = left; },
                            ...params,
                        } )
                        let newLeft = left, newBody = body;
                        if ( node.type === 'ForOfStatement' ) {
                            [ preIterationDeclarations, newBody ] = composeIterationWith( {} );
                        } else if ( iterationId.type === 'Identifier' ) {
                            [ preIterationDeclarations, newBody ] = composeIterationWith( { iterationId } );
                        } else {
                            // Its a forIn statement with a destructuring left side
                            let iteration$counter = Node.identifier( context.getReflexIdentifier( '$counter' ) );
                            [ preIterationDeclarations, newBody ] = composeIterationWith( { iterationId: iteration$counter } );
                            // We'll use a plain Identifier as left
                            newLeft = Node.varDeclaration( 'let', [ Node.varDeclarator( Node.clone( iteration$counter ), null ) ] );
                            // While we replicate the original left and send it into the start of body
                            let leftReDeclaration;
                            if ( node.left.type === 'VariableDeclaration' ) {
                                leftReDeclaration = Node.varDeclaration( left.kind, [ Node.varDeclarator( iterationId, Node.clone( iteration$counter ) ) ] );
                            } else {
                                leftReDeclaration = Node.exprStmt( Node.sequenceExpr( [ Node.assignmentExpr( iterationId, Node.clone( iteration$counter ), '=' ) ] ) );
                            }
                            newBody = [ leftReDeclaration ].concat( newBody );
                        }
                        forStatement = generate.call( Node, newLeft, right, Node.blockStmt( newBody ) );
                    }

                    return iteratorReflex.generate( [].concat( preIterationDeclarations || [] ).concat( forStatement ) );
                } );

            } );
        } );
    }

    /**
     * ------------
     * @LabeledStatement
     * ------------
     */
    generateLabeledStatement( context, node ) {
        context.reflexIdentifiersNoConflict( node.label );
        let def = { type: node.type, label: node.label };
        if ( !node.body.type.endsWith( 'Statement' ) ) {
            return context.defineReflex( def, reflex => {
                this.setLocation( reflex, node.body );
                let [ body ] = this.generateNodes( context, [ node.body ] );
                return Node.labeledStmt( node.label, reflex.generate( body ) );
            } );
        }
        return context.createScope( { type: node.body.type, label: node.label }, scope => {
            if ( node.body.type === 'BlockStatement' ) {
                let body = this.generateNodes( context, node.body.body );
                return Node.labeledStmt( node.label, Node.blockStmt( body ) );
            }
            scope.singleStatementScope = true;
            let [ body ] = this.generateNodes( context, [ node.body ] );
            return Node.labeledStmt( node.label, body );
        } );
    }

    /**
     * ------------
     * @BreakStatement
     * @ContinueStatement
     * ------------
     */
    generateBreakStatement( context, node ) { return this.generateExitStmt( Node.breakStmt, ...arguments ); }
    generateContinueStatement( context, node ) { return this.generateExitStmt( Node.continueStmt, ...arguments ); }
    generateExitStmt( generate, context, node ) {
        let nearestExitTarget = context.currentReflex.closest( [ 'Iteration', 'SwitchStatement', 'LabeledStatement' ] );
        if ( nearestExitTarget && nearestExitTarget.type === 'SwitchStatement' && node.type === 'BreakStatement' && !node.label ) {
            return generate.call( Node, null );
        }
        let id$reflex = Node.identifier( context.getReflexIdentifier( '$reflex', true ) );
        let keyword = Node.literal( node.type === 'BreakStatement' ? 'break' : 'continue' );
        let label = node.label ? Node.literal( node.label.name ) : Node.identifier( 'null' );
        let exitCall = Node.exprStmt( 
            Node.callExpr( Node.memberExpr( id$reflex, Node.identifier( 'exit' ) ), [ keyword, label ] ),
        );
        // Break / continue statement hoisting
        context.currentReflex.hoistExitStatement( keyword, label );
        // reflex.reflexIdentifiersNoConflict() wont be necessary
        // as the label definition would have had the same earlier
        return [ exitCall, Node.returnStmt() ];
    }

    /**
     * ------------
     * @ReturnStatement
     * ------------
     */
    generateReturnStatement( context, node ) {
        let def = { type: node.type };
        return context.defineReflex( def, reflex => {
            let [ argument ] = reflex.signalReference( def, () => this.generateNodes( context, [ node.argument ] ) );
            let id$reflex = Node.identifier( context.getReflexIdentifier( '$reflex', true ) );
            let keyword = Node.literal( 'return' );
            let arg = argument || Node.identifier( 'undefined' );
            let exitCall = Node.exprStmt(
                Node.callExpr( Node.memberExpr( id$reflex, Node.identifier( 'exit' ) ), [ keyword, arg ] ),
            );
            // Return statement hoisting
            reflex.hoistExitStatement( keyword, Node.identifier( 'true' ) );
            return reflex.generate( [ exitCall, Node.returnStmt() ] );
        } );
    }

    /**
     * ------------
     * @BlockStatement
     * ------------
     */
    generateBlockStatement( context, node ) {
        // From a scope context
        return context.createScope( { type: node.type }, () => {
            let body = this.generateNodes( context, node.body );
            return Node.blockStmt( body );
        } );
    }

    /**
     * ------------
     * @ExpressionStatement
     * ------------
     */
    generateExpressionStatement( context, node ) {
        let def = { type: node.expression.type };
        return context.defineReflex( def, reflex => {
            this.setLocation( reflex, node.expression );
            let [ expression ] = reflex.signalReference( def, () => this.generateNodes( context, [ node.expression ] ) );
            return reflex.generate( Node.exprStmt( expression ) );
        } );
    }

    /* ------------------------------ */
    /* ------------------------------ */

    /**
     * ------------
     * @SequenceExpression
     * ------------
     */
    generateSequenceExpression( context, node ) {
        let expresions = node.expressions.map( ( expr, i ) => {
            let def = { type: expr.type, inSequence: true };
            if ( i === node.expressions.length - 1 ) {
                [ expr ] = context.currentReflex.chainableReference( def, () => this.generateNodes( context, [ expr ] ) );
                return expr;
            }
            return context.defineReflex( def, reflex => {
                this.setLocation( reflex, expr );
                [ expr ] = reflex.signalReference( def, () => this.generateNodes( context, [ expr ] ) );
                return expr.type === 'Identifier' ? expr : reflex.generate( expr );
            } );
        } );
        return Node.sequenceExpr( expresions );
    }

    /**
     * ------------
     * @AssignmentExpression
     * ------------
     */
    generateAssignmentExpression( context, node ) {
        let def = { type: node.type, kind: node.operator };
        let rightReference, [ right ] = context.currentReflex.signalReference( def, reference => ( rightReference = reference, this.generateNodes( context, [ node.right ] ) ) );
        let leftReference, [ left ] = context.currentReflex.embeddableEffectReference( def, reference => ( leftReference = reference, this.generateNodes( context, [ node.left ] ) ) );
        rightReference.setAssignee( leftReference );
        return Node.assignmentExpr( left, right, node.operator );
    }

    /**
     * ------------
     * @UpdateExpression
     * @UnaryExpression (delete)
     * ------------
     */
    generateUpdateExpression( context, node ) { return this.generateMutationExpr( Node.updateExpr, ...arguments ); }
    generateUnaryExpression( context, node ) {
        if ( node.operator === 'delete' ) return this.generateMutationExpr( Node.unaryExpr, ...arguments );
        let def = { type: node.type, kind: node.operator };
        let [ argument ] = context.currentReflex.signalReference( def, () => this.generateNodes( context, [ node.argument ] ) );
        return Node.unaryExpr( node.operator, argument, node.prefix );
    }
    generateMutationExpr( generate, context, node ) {
        let def = { type: node.type, kind: node.operator };
        let [ argument ] = context.currentReflex.effectReference( def, () => this.generateNodes( context, [ node.argument ] ) );
        return generate.call( Node, node.operator, argument, node.prefix );
    }

    /**
     * ------------
     * @BinaryExpression
     * ------------
     */
    generateBinaryExpression( context, node ) {
        let [ left ] = context.currentReflex.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.left ] ) );
        let [ right ] = context.currentReflex.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.right ] ) );
        return Node.binaryExpr( node.operator, left, right );
    }

    /**
     * ------------
     * @LogicalExpression
     * ------------
     */
    generateLogicalExpression( context, node ) {
        let def = { type: node.type, kind: node.operator };
        let [ left ] = context.currentReflex.chainableReference( def, () => this.generateNodes( context, [ node.left ] ) );
        let [ $left, memo ] = context.defineMemo( { expr: left } ).generate();
        let conditionAdjacent = node.operator === '||' ? { whenNot: memo } : { when: memo };
        let [ right ] = context.createCondition( conditionAdjacent, () => {
            return context.currentReflex.chainableReference( def, () => this.generateNodes( context, [ node.right ] ) )
        } );
        this.setLocation( memo, node.left );
        return Node.logicalExpr( node.operator, $left, right );
    }

    /**
     * ------------
     * @ConditionalExpression
     * ------------
     */
    generateConditionalExpression( context, node ) {
        let def = { type: node.type };
        let [ test ] = context.currentReflex.signalReference( def, () => this.generateNodes( context, [ node.test ] ) ),
            [ $test, memo ] = context.defineMemo( { expr: test } ).generate(),
            [ consequent ] = context.createCondition( { when: memo }, () => context.currentReflex.chainableReference( def, () => this.generateNodes( context, [ node.consequent ] ) ) ),
            [ alternate ] = context.createCondition( { whenNot: memo }, () => context.currentReflex.chainableReference( def, () => this.generateNodes( context, [ node.alternate ] ) ) );
        this.setLocation( memo, node.test );
        return Node.condExpr( $test, consequent, alternate );
    }

    /**
     * ------------
     * @ArrayPattern
     * ------------
     */
    generateArrayPattern( context, node ) {
        let elements = node.elements.map( ( element, i ) => {
            [ element ] = context.currentReflex.currentReference.withDestructure( { name: i }, () => this.generateNodes( context, [ element ] ) );
            return element;
        } );
        return Node.arrayPattern( elements );
    }

    /**
     * ------------
     * @ObjectPattern
     * ------------
     */
    generateObjectPattern( context, node ) {
        let properties = node.properties.map( property => {
            let { key, value } = property;
            if ( property.computed ) {
                [ key ] = context.currentReflex.signalReference( { type: key.type }, () => this.generateNodes( context, [ key ] ) );
            }
            let element = { name: property.key.name };
            if ( property.computed ) {
                if ( property.key.type === 'Literal' ) {
                    element = { name: property.key.value };
                } else {
                    [ key, element ] = context.defineMemo( { expr: key } ).generate();
                }
            }
            [ value ] = context.currentReflex.currentReference.withDestructure( element, () => this.generateNodes( context, [ value ] ) );
            this.setLocation( element, property.key );
            return Node.property( key, value, property.kind, property.shorthand, property.computed, property.method );
        } );
        return Node.objectPattern( properties );
    }

    /**
     * ------------
     * @MemberExpression
     * ------------
     */
    generateMemberExpression( context, node ) {
        let { property } = node;
        if ( node.computed ) {
            [ property ] = context.currentReflex.signalReference( { type: property.type }, () => this.generateNodes( context, [ property ] ) );
        }
        let element = { name: node.property.name };
        if ( node.computed ) {
            if ( node.property.type === 'Literal' ) {
                element = { name: node.property.value };
            } else {
                [ property, element ] = context.defineMemo( { expr: property } ).generate();
            }
        }
        let [ object ] = context.currentReflex.currentReference.withProperty( element, () => this.generateNodes( context, [ node.object ] ) );
        this.setLocation( element, node.property );
        return Node.memberExpr( object, property, node.computed, node.optional );
    }

    /**
     * ------------
     * @Identifier
     * @ThisExpression
     * ------------
     */
    generateThisExpression( context, node ) { return this.generateIdentifier( ...arguments ); }
    generateIdentifier( context, node ) {
        let $identifier = {
            name: node.type !== 'Identifier' ? 'this' : node.name,
        };
        this.setLocation( $identifier, node );
        const closestFunction = context.closestFunction();
        let reference = ( context.currentReflex || context ).currentReference;
        if ( reference ) {
            do {
                if ( !closestFunction || closestFunction.isReflexFunction || ( reference instanceof EffectReference ) ) {
                    reference.addRef().unshift( $identifier );
                }
            } while( reference = reference.contextReference );
        }
        if ( node.type !== 'Identifier' ) return Node.thisExpr();
        // How we'll know Identifiers within script
        context.reflexIdentifiersNoConflict( node );
        // Substituting the keyword: arguments
        const id$reflex = Node.identifier( context.getReflexIdentifier( '$reflex', true ) );
        return node.name === 'arguments'
            ? ( context.currentReflex.hoistArgumentsKeyword(), Node.memberExpr( id$reflex, Node.identifier( 'args' ) ) )
            : Node.identifier( node.name );
    }

    /**
     * ------------
     * @SpreadElement
     * @AwaitExpression
     * ------------
     */
    generateSpreadElement( context, node ) { return this.generateArgumentExpr( Node.spreadElement, ...arguments ); }
    generateAwaitExpression( context, node ) {
        context.currentReflex.hoistAwaitKeyword();
        return this.generateArgumentExpr( Node.awaitExpr, ...arguments );
    }
    generateArgumentExpr( generate, context, node ) {
        let [ argument ] = context.currentReflex.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.argument ] ) );
        return generate.call( Node, argument );
    }

    /**
     * ------------
     * @CallExpression
     * @NewExpression
     * ------------
     */
    generateCallExpression( context, node ) { return this.generateCallExpr( Node.callExpr, ...arguments ); }
    generateNewExpression( context, node ) { return this.generateCallExpr( Node.newExpr, ...arguments ); }
    generateCallExpr( generate, context, node ) {
        // The ongoing reference must be used for callee
        let [ callee ] = context.currentReflex.signalReference( { type: node.callee.type }, () => this.generateNodes( context, [ node.callee ] ) );
        let args = node.arguments.map( argument => context.currentReflex.signalReference( { type: argument.type }, () => this.generateNodes( context, [ argument ] )[ 0 ] ) );
        return generate.call( Node, callee, args, node.optional );
    }
    
    /**
     * ------------
     * @ParenthesizedExpressio
     * @ChainExpression
     * ------------
     */
    generateParenthesizedExpression( context, node ) { return this.generateExprExpr( Node.parensExpr, ...arguments ); }
    generateChainExpression( context, node ) { return this.generateExprExpr( Node.chainExpr, ...arguments ); }
    generateExprExpr( generate, context, node ) {
        // The ongoing reference must be used for these
        let [ expresion ] = this.generateNodes( context, [ node.expression ] );
        return generate.call( Node, expresion );
    }

    /**
     * ------------
     * @ArrayExpression
     * ------------
     */
    generateArrayExpression( context, node ) {
        let elements = node.elements.map( element => context.currentReflex.signalReference( { type: element.type }, () => this.generateNodes( context, [ element ] )[ 0 ] ) );
        return Node.arrayExpr( elements );
    }
    
    /**
     * ------------
     * @ObjectExpression
     * ------------
     */
    generateObjectExpression( context, node ) {
        let properties = this.generateNodes( context, node.properties );
        return Node.objectExpr( properties );
    }
    
    /**
     * ------------
     * @Property
     * ------------
     */
    generateProperty( context, node ) {
        let { key, value } = node;
        if ( node.computed ) {
            [ key ] = context.currentReflex.signalReference( { type: key.type }, () => this.generateNodes( context, [ key ] ) );
        }
        [ value ] = context.currentReflex.signalReference( { type: value.type }, () => this.generateNodes( context, [ value ] ) );
        return Node.property( key, value, node.kind, node.shorthand, node.computed, false/*node.method*/ );
    }
    
    /**
     * ------------
     * @TaggedTemplateExpression
     * ------------
     */
    generateTaggedTemplateExpression( context, node ) {
        let [ tag, quasi ] = context.currentReflex.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.tag, node.quasi ] ) );
        return Node.taggedTemplateExpr( tag, quasi );
    }
    
    /**
     * ------------
     * @TemplateLiteral
     * ------------
     */
    generateTemplateLiteral( context, node ) {
        let expressions = node.expressions.map( expression => context.currentReflex.signalReference( { type: node.type }, () => this.generateNodes( context, [ expression ] )[ 0 ] ) );
        return Node.templateLiteral( node.quasis, expressions );
    }

    /**
     * ------------
     * @TryStatement
     * ------------
     */
    generateTryStatement( context, node ) {
        let [ block, handler, finalizer ] = this.generateNodes( context, [ node.block, node.handler, node.finalizer ] );
        return Node.tryStmt( block, handler, finalizer );
    }

    /**
     * ------------
     * @CatchClause
     * ------------
     */
    generateCatchClause( context, node ) {
        let [ body ] = this.generateNodes( context, [ node.body ] );
        return Node.catchClause( node.param, body );
    }

    /**
     * ------------
     * @ThrowStatement
     * ------------
     */
    generateThrowStatement( context, node ) { return this.generateArgumentExpr( Node.throwStmt, ...arguments ); }

}
