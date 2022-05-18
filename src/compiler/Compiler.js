
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
        if ( this.params.locations === false || !node ) /* such as case: null / default: */ return;
        let loc = [ node.start + this._locStart, node.end + this._locStart ];
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
        globalContext.defineSubscriptIdentifier( '$contract', [ '$x' ] );
        let [ ast ] = globalContext.createScope( def, () => this.generateNodes( globalContext, [ nodes ] ) );
        this.deferredTasks.forEach( task => task() );
        return {
            source: this.serialize( ast ),
            graph: globalContext.toJson( false ),
            identifier: globalContext.getSubscriptIdentifier( '$contract' ),
            locations: this.locations,
            ast,
        };
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
        const generateFunction = ( id, params, body ) => context.defineContext( { type: node.type, isSubscriptFunction: node.isSubscriptFunction }, functionContract => {
            return functionContract.createScope( { type: node.type }, () => {
                // FunctionExpressions have their IDs in function scope
                id = generateId( id, functionContract )[ 0 ];
                // Function params go into function scope
                params = params.map( param => {
                    if ( param.type === 'AssignmentPattern' ) {
                        let right = this.generateNode( functionContract, param.right );
                        let def = { type: param.left.type };
                        let [ left ] = functionContract.effectReference( def, () => this.generateNodes( functionContract, [ param.left ] ), false );
                        return Node.assignmentPattern( left, right );
                    }
                    let def = { type: param.type };
                    [ param ] = functionContract.effectReference( def, () => this.generateNodes( functionContract, [ param ] ), false );
                    return param;
                } );
                if ( node.type === 'ArrowFunctionExpression' && node.expression ) {
                    body = this.generateNode( functionContract, Node.blockStmt( [ Node.returnStmt( body ) ] ) );
                } else {
                    body = this.generateNode( functionContract, body );
                }
                return [ functionContract, id, params, body ];
            } );
        } );

        let subscript$contract = Node.identifier( context.getSubscriptIdentifier( '$contract', true ) );
        let contractCreate = ( generate, functionContract, funcName, params, body ) => functionContract.generate(
            generate.call( Node, funcName, [ subscript$contract ].concat( params ), body, node.async, node.expression, node.generator ), {
                args: [ Node.literal( node.type ), Node.identifier( node.isSubscriptFunction ? 'true' : 'false' ) ],
                isFunctionContract: true,
                generateForArgument: true
            }
        );

        let resultNode, functionContract, id, params, body;
        if ( node.type === 'FunctionDeclaration' ) {
            // FunctionDeclarations have their IDs in current scope
            [ id ] = generateId( node.id, context );
            [ functionContract, , params, body ] = generateFunction( null, node.params, node.body );
            resultNode = contractCreate( Node.funcExpr, functionContract, null, params, body );
            // We'll physically do hoisting
            let definitionRef = Node.memberExpr( subscript$contract, Node.identifier( 'functions' ) );
            let definitionCall = ( method, ...args ) => Node.callExpr( Node.memberExpr( definitionRef, Node.identifier( method ) ), [ id, ...args ] );
            // Generate now
            resultNode = [
                Node.exprStmt( definitionCall( 'define', resultNode ) ),
                generate.call( Node, id, params, Node.blockStmt( [
                    Node.returnStmt( Node.callExpr( Node.memberExpr( definitionCall( 'get' ), Node.identifier( 'call' ) ), [
                            Node.thisExpr(), Node.spreadElement( Node.identifier( 'arguments' ) )
                        ] ) ),
                ] ) )
            ];
        } else {
            // FunctionExpressions and ArrowFunctionExpressions are quite simpler
            [ functionContract, id, params, body ] = generateFunction( node.id, node.params, node.body );
            resultNode = contractCreate( generate, functionContract, id, params, body );
        }

        this.deferredTasks.unshift( () => {
            functionContract.sideEffects.forEach( sideEffect => {
                functionContract.ownerScope.doSideEffectUpdates( sideEffect.reference, sideEffect.remainderRefs );
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
        let exec = ( contract, declarator, isForLoopInit ) => {
            let initReference, [ init ] = contract.signalReference( def, reference => ( initReference = reference, this.generateNodes( context, [ declarator.init ] ) ) );
            let idReference, [ id ] = contract.effectReference( def, reference => ( idReference = reference, this.generateNodes( context, [ declarator.id ] ) ) );
            initReference.setAssignee( idReference );
            this.setLocation( contract, declarator );
            if ( isForLoopInit 
                || node.kind === 'const' 
                || !declarator.init 
                // note that we're not asking initReference.refs.size
                || ( !this.params.devMode && !contract.references.filter( reference => reference instanceof SignalReference ).length )
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
                assignmentRefactors.push( Node.varDeclaration( node.kind, declarations ), ...contract.generate( Node.exprStmt( assignmentExpr ) ) );
                return [];
            }
            assignmentRefactors.push( ...contract.generate( Node.exprStmt( assignmentExpr ) ) );
            return declarations;
        }
        let isForLoopInit = context.currentContract && [ 'ForStatement', 'ForOfStatement', 'ForInStatement' ].includes( context.currentContract.type );
        let declarations = node.declarations.reduce( ( declarators, declarator ) => {
            if ( isForLoopInit ) return declarators.concat( exec( context.currentContract, declarator, true ) );
            return context.defineContract( def, contract => declarators.concat( exec( contract, declarator ) ) );
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
        return context.defineContract( def, contract => {
            let { consequent, alternate } = node;
            let [ test ] = contract.signalReference( def, () => this.generateNodes( context, [ node.test ] ) ),
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
            this.setLocation( contract, node );
            this.setLocation( memo, node.test );
            return contract.generate(  Node.ifStmt( $test, consequent, alternate ) );
        } );
    }

    /**
     * ------------
     * @SwitchStatement
     * ------------
     */
    generateSwitchStatement( context, node ) {
        let def = { type: node.type };
        return context.defineContract( def, contract => {
            let [ discriminant ] = contract.signalReference( def, () => this.generateNodes( context, [ node.discriminant ] ) );
            let [ $discriminant, memo ] = context.defineMemo( { expr: discriminant } ).generate();
            
            let $cases = context.createScope( def, () => node.cases.reduce( ( casesDef, caseNode ) => {
                let prevCaseDef = casesDef.slice( -1 )[ 0 ];
                let hasBreak = caseNode.consequent.some( stmt => stmt.type === 'BreakStatement' );
                let [ test ] = contract.signalReference( { type: caseNode.type }, () => this.generateNodes( context, [ caseNode.test ] ) );
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

            this.setLocation( contract, node );
            this.setLocation( memo, node.discriminant );
            return contract.generate( Node.switchStmt( $discriminant, $cases ) );
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
        return context.defineContract( { type: node.type }, iteratorContract => {
            this.setLocation( iteratorContract, node );
            iteratorContract.defineSubscriptIdentifier( '$counter', [ '$x_index' ] );
            // A scope for variables declared in header
            return context.createScope( { type: 'Iteration' }, () => {
                let createNodeCallback, init, test, update;
                
                if ( node.type === 'ForStatement' ) {
                    [ init, test, update ] = iteratorContract.signalReference( def, () => this.generateNodes( context, [ node.init, node.test, node.update ] ) );
                    createNodeCallback = $body => generate.call( Node, init, test, update, $body );
                } else {
                    [ test ] = iteratorContract.signalReference( def, () => this.generateNodes( context, [ node.test ] ) );
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
                    return iteratorContract.generate( statements );
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
        let iterationBody = [], contractBody = body.body.slice( 0 );
        // Counter?
        if ( !params.iterationId ) {
            params.iterationId = Node.identifier( iterationContext.getSubscriptIdentifier( '$counter', true ) );
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
        iterationBody.push( ...iterationContext.generate( contractBody, { args: [ params.iterationId ], disposeCallback } ) );
    
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
        return context.defineContract( { type: node.type }, iteratorContract => {
            this.setLocation( iteratorContract, node );
            iteratorContract.defineSubscriptIdentifier( '$counter', [ node.type === 'ForInStatement' ? '$x_key' : '$x_index' ] );
            // A scope for variables declared in header
            return context.createScope( { type: 'Iteration' }, () => {
                
                let left, iterationId;
                if ( node.left.type === 'VariableDeclaration' ) {
                    [ left ] = this.generateNodes( context, [ node.left ] );
                    iterationId = left.declarations[ 0 ].id;
                } else {
                    [ left ] = iteratorContract.affectedsReference( def, () => this.generateNodes( context, [ node.left ] ) );
                    iterationId = left;
                }
                let [ right ] = iteratorContract.signalReference( def, () => this.generateNodes( context, [ node.right ] ) );
                
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
                            let iteration$counter = Node.identifier( context.getSubscriptIdentifier( '$counter' ) );
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

                    return iteratorContract.generate( [].concat( preIterationDeclarations || [] ).concat( forStatement ) );
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
        context.subscriptIdentifiersNoConflict( node.label );
        let def = { type: node.type, label: node.label };
        if ( !node.body.type.endsWith( 'Statement' ) ) {
            return context.defineContract( def, contract => {
                this.setLocation( contract, node.body );
                let [ body ] = this.generateNodes( context, [ node.body ] );
                return Node.labeledStmt( node.label, contract.generate( body ) );
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
        let nearestExitTarget = context.currentContract.closest( [ 'Iteration', 'SwitchStatement', 'LabeledStatement' ] );
        if ( nearestExitTarget && nearestExitTarget.type === 'SwitchStatement' && node.type === 'BreakStatement' && !node.label ) {
            return generate.call( Node, null );
        }
        let subscript$contract = Node.identifier( context.getSubscriptIdentifier( '$contract', true ) );
        let keyword = Node.literal( node.type === 'BreakStatement' ? 'break' : 'continue' );
        let label = node.label ? Node.literal( node.label.name ) : Node.identifier( 'null' );
        let exitCall = Node.exprStmt( 
            Node.callExpr( Node.memberExpr( subscript$contract, Node.identifier( 'exit' ) ), [ keyword, label ] ),
        );
        // Break / continue statement hoisting
        context.currentContract.hoistExitStatement( keyword, label );
        // contract.subscriptIdentifiersNoConflict() wont be necessary
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
        return context.defineContract( def, contract => {
            let [ argument ] = contract.signalReference( def, () => this.generateNodes( context, [ node.argument ] ) );
            let subscript$contract = Node.identifier( context.getSubscriptIdentifier( '$contract', true ) );
            let keyword = Node.literal( 'return' );
            let arg = argument || Node.identifier( 'undefined' );
            let exitCall = Node.exprStmt(
                Node.callExpr( Node.memberExpr( subscript$contract, Node.identifier( 'exit' ) ), [ keyword, arg ] ),
            );
            // Return statement hoisting
            contract.hoistExitStatement( keyword, Node.identifier( 'true' ) );
            return contract.generate( [ exitCall, Node.returnStmt() ] );
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
        let def = { type: node.type };
        return context.defineContract( def, contract => {
            this.setLocation( contract, node.expression );
            let [ expression ] = contract.signalReference( def, () => this.generateNodes( context, [ node.expression ] ) );
            return contract.generate( Node.exprStmt( expression ) );
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
                [ expr ] = context.currentContract.chainableReference( def, () => this.generateNodes( context, [ expr ] ) );
                return expr;
            }
            return context.defineContract( def, contract => {
                this.setLocation( contract, expr );
                [ expr ] = contract.signalReference( def, () => this.generateNodes( context, [ expr ] ) );
                return expr.type === 'Identifier' ? expr : contract.generate( expr );
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
        let rightReference, [ right ] = context.currentContract.signalReference( def, reference => ( rightReference = reference, this.generateNodes( context, [ node.right ] ) ) );
        let leftReference, [ left ] = context.currentContract.embeddableEffectReference( def, reference => ( leftReference = reference, this.generateNodes( context, [ node.left ] ) ) );
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
        let [ argument ] = context.currentContract.signalReference( def, () => this.generateNodes( context, [ node.argument ] ) );
        return Node.unaryExpr( node.operator, argument, node.prefix );
    }
    generateMutationExpr( generate, context, node ) {
        let def = { type: node.type, kind: node.operator };
        let [ argument ] = context.currentContract.effectReference( def, () => this.generateNodes( context, [ node.argument ] ) );
        return generate.call( Node, node.operator, argument, node.prefix );
    }

    /**
     * ------------
     * @BinaryExpression
     * ------------
     */
    generateBinaryExpression( context, node ) {
        let [ left ] = context.currentContract.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.left ] ) );
        let [ right ] = context.currentContract.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.right ] ) );
        return Node.binaryExpr( node.operator, left, right );
    }

    /**
     * ------------
     * @LogicalExpression
     * ------------
     */
    generateLogicalExpression( context, node ) {
        let def = { type: node.type, kind: node.operator };
        let [ left ] = context.currentContract.chainableReference( def, () => this.generateNodes( context, [ node.left ] ) );
        let [ $left, memo ] = context.defineMemo( { expr: left } ).generate();
        let conditionAdjacent = node.operator === '||' ? { whenNot: memo } : { when: memo };
        let [ right ] = context.createCondition( conditionAdjacent, () => {
            return context.currentContract.chainableReference( def, () => this.generateNodes( context, [ node.right ] ) )
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
        let [ test ] = context.currentContract.signalReference( def, () => this.generateNodes( context, [ node.test ] ) ),
            [ $test, memo ] = context.defineMemo( { expr: test } ).generate(),
            [ consequent ] = context.createCondition( { when: memo }, () => context.currentContract.chainableReference( def, () => this.generateNodes( context, [ node.consequent ] ) ) ),
            [ alternate ] = context.createCondition( { whenNot: memo }, () => context.currentContract.chainableReference( def, () => this.generateNodes( context, [ node.alternate ] ) ) );
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
            [ element ] = context.currentContract.currentReference.withDestructure( { name: i }, () => this.generateNodes( context, [ element ] ) );
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
                [ key ] = context.currentContract.signalReference( { type: key.type }, () => this.generateNodes( context, [ key ] ) );
            }
            let element = { name: property.key.name };
            if ( property.computed ) {
                if ( property.key.type === 'Literal' ) {
                    element = { name: property.key.value };
                } else {
                    [ key, element ] = context.defineMemo( { expr: key } ).generate();
                }
            }
            [ value ] = context.currentContract.currentReference.withDestructure( element, () => this.generateNodes( context, [ value ] ) );
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
            [ property ] = context.currentContract.signalReference( { type: property.type }, () => this.generateNodes( context, [ property ] ) );
        }
        let element = { name: node.property.name };
        if ( node.computed ) {
            if ( node.property.type === 'Literal' ) {
                element = { name: node.property.value };
            } else {
                [ property, element ] = context.defineMemo( { expr: property } ).generate();
            }
        }
        let [ object ] = context.currentContract.currentReference.withProperty( element, () => this.generateNodes( context, [ node.object ] ) );
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
        let createNode = () => node.type === 'Identifier' ? Node.identifier( node.name ) : Node.thisExpr();
        // How we'll know Identifiers within script
        if ( node.type === 'Identifier' ) {
            context.subscriptIdentifiersNoConflict( node );
        }
        let $identifier = {
            name: node.type === 'Identifier' ? node.name : 'this',
        };
        this.setLocation( $identifier, node );
        const closestFunction = context.closestFunction();
        let reference = ( context.currentContract || context ).currentReference;
        if ( reference ) {
            do {
                if ( !closestFunction || closestFunction.isSubscriptFunction || ( reference instanceof EffectReference ) ) {
                    reference.addRef().unshift( $identifier );
                }
            } while( reference = reference.contextReference );
        }
        return createNode();
    }

    /**
     * ------------
     * @SpreadElement
     * @AwaitExpression
     * ------------
     */
    generateSpreadElement( context, node ) { return this.generateArgumentExpr( Node.spreadElement, ...arguments ); }
    generateAwaitExpression( context, node ) {
        context.currentContract.hoistAwaitKeyword();
        return this.generateArgumentExpr( Node.awaitExpr, ...arguments );
    }
    generateArgumentExpr( generate, context, node ) {
        let [ argument ] = context.currentContract.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.argument ] ) );
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
        let [ callee ] = context.currentContract.signalReference( { type: node.callee.type }, () => this.generateNodes( context, [ node.callee ] ) );
        let args = node.arguments.map( argument => context.currentContract.signalReference( { type: argument.type }, () => this.generateNodes( context, [ argument ] )[ 0 ] ) );
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
        let elements = node.elements.map( element => context.currentContract.signalReference( { type: element.type }, () => this.generateNodes( context, [ element ] )[ 0 ] ) );
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
            [ key ] = context.currentContract.signalReference( { type: key.type }, () => this.generateNodes( context, [ key ] ) );
        }
        [ value ] = context.currentContract.signalReference( { type: value.type }, () => this.generateNodes( context, [ value ] ) );
        return Node.property( key, value, node.kind, node.shorthand, node.computed, false/*node.method*/ );
    }
    
    /**
     * ------------
     * @TaggedTemplateExpression
     * ------------
     */
    generateTaggedTemplateExpression( context, node ) {
        let [ tag, quasi ] = context.currentContract.signalReference( { type: node.type }, () => this.generateNodes( context, [ node.tag, node.quasi ] ) );
        return Node.taggedTemplateExpr( tag, quasi );
    }
    
    /**
     * ------------
     * @TemplateLiteral
     * ------------
     */
    generateTemplateLiteral( context, node ) {
        let expressions = node.expressions.map( expression => context.currentContract.signalReference( { type: node.type }, () => this.generateNodes( context, [ expression ] )[ 0 ] ) );
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
