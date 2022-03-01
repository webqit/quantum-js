
/**
 * @imports
 */
import { generate as astringGenerate } from 'astring';
import { astNodes } from './Generators.js';
import Effect from './Effect.js';
import Scope from './Scope.js';

export default class Compiler {

    constructor( params = {} ) {
        this.params = params;
        this.locations = [];
        this._locStart = this.params.locStart || 0;
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

    generate( nodes ) {
        let globalEffect = new Effect( null, 'Program', { type: 'Program', params: this.params, } );
        globalEffect.defineSubscriptIdentifier( '$construct', [ '$x' ] );
        let [ ast ] = this._transform( [ nodes ], globalEffect );
        return {
            source: this.serialize( ast ),
            graph: globalEffect.toJson( false ),
            identifier: globalEffect.getSubscriptIdentifier( '$construct' ),
            locations: this.locations,
            ast,
        };
    }

    serialize(ast, params = {}) {
        return astringGenerate( ast, { comments: true, ...params } );
    }

    _transform( nodes, effect, scope ) {

        return nodes.reduce( ( _nodes, node ) => {

            // Helpers
            const _transform = ( _nodes, _effect = effect, _scope = scope ) => this._transform( _nodes, _effect, _scope );
            const _returns = ( ...__nodes ) => _nodes.concat( __nodes );
            if ( !node ) return _returns( node );

            /**
             * ------------
             * #Program
             * ------------
             */
            if ( node.type === 'Program' ) {
                let def = { type: 'Program' };
                return effect/* global effect instance */.createScope( def, programScope => {
                    let body = _transform( node.body, null, programScope );
                    return _returns( { ...node, body } );
                } );
            }

            /**
             * ------------
             * #VariableDeclaration
             * ------------
             */
            if ( node.type === 'VariableDeclaration' ) {
                let def = { type: node.type, kind: node.kind };
                let assignmentRefactors = [];
                let isForLoopInit = effect && [ 'ForStatement', 'ForInStatement', 'ForOfStatement' ].includes( effect.type );
                let exec = ( effect, declarator ) => {
                    let initProduction, [ init ] = effect.causesProduction( def, production => ( initProduction = production, _transform( [ declarator.init ], effect ) ) );
                    let idProduction, [ id ] = effect.affectedsProduction( def, production => ( idProduction = production, _transform( [ declarator.id ], effect ) ) );
                    initProduction.setAssignee( idProduction );
                    this.setLocation( effect, declarator );
                    if ( !isForLoopInit && node.kind !== 'const' && declarator.init && initProduction.refs.size ) {
                        // Strip out the init, and re-declare only the local identifiers
                        // ID might be Array or Object pattern, so we're better off taking the resolved bare identifiers
                        let isPattern = [ 'ObjectPattern', 'ArrayPattern' ].includes( declarator.id.type );
                        declarator = Array.from( idProduction.refs ).map( ref => astNodes.varDeclarator( astNodes.identifier( ref.path[ 0 ].name ), null ) );
                        // Now, covert the init part to an assignment expression
                        let assignmentExpr = astNodes.assignmentExpr( id, init );
                        if ( isPattern ) {
                            assignmentExpr = astNodes.sequenceExpr( [ assignmentExpr ] );
                        }
                        assignmentRefactors.push( ...effect.compose( astNodes.exprStmt( assignmentExpr ) ) );
                    } else {
                        // init might still have effects
                        declarator = astNodes.varDeclarator( id, init );
                    }
                    return declarator;
                }
                let declarations = node.declarations.reduce( ( declarators, declarator ) => {
                    if ( isForLoopInit ) return declarators.concat( exec( effect, declarator ) );
                    return declarators.concat( scope.createEffect( def, effect => exec( effect, declarator ) ) );
                }, [] );
                return _returns(
                    astNodes.varDeclaration( node.kind, declarations ), ...assignmentRefactors
                );
            }

            /**
             * ------------
             * #IfStatement
             * ------------
             */
            if ( node.type === 'IfStatement' ) {
                let def = { type: node.type };
                return scope.createEffect( def, effect => {
                    let { consequent, alternate } = node;
                    let [ test ] = effect.causesProduction( def, () => _transform( [ node.test ], effect ) ),
                        [ $test, memo ] = effect.createMemo( { expr: test } ).compose();
                    consequent = effect.createCondition( { when: memo }, () => _transform( [ node.consequent ], effect ) );
                    if ( consequent[ 0 ].type !== 'BlockStatement' && consequent.length > 1 ) {
                        consequent = astNodes.blockStmt( consequent );
                    } else {
                        consequent = consequent[ 0 ];
                    }
                    if ( node.alternate ) {
                        alternate = effect.createCondition( { whenNot: memo }, () => _transform( [ node.alternate ], effect ) );
                        if ( alternate[ 0 ] && alternate[ 0 ].type !== 'BlockStatement' && alternate.length > 1 ) {
                            alternate = astNodes.blockStmt( alternate );
                        } else {
                            alternate = alternate[ 0 ];
                        }
                    }
                    this.setLocation( effect, node );
                    this.setLocation( memo, node.test );
                    return _returns(
                        ...effect.compose( astNodes.ifStmt( $test, consequent, alternate ) )
                    );
                } );
            }

            /**
             * ------------
             * #SwitchStatement
             * ------------
             */
            if ( node.type === 'SwitchStatement' ) {
                let def = { type: node.type };
                return scope.createEffect( def, effect => {
                    let [ discriminant ] = effect.causesProduction( def, () => _transform( [ node.discriminant ], effect ) );
                    let [ $discriminant, memo ] = effect.createMemo( { expr: discriminant } ).compose();
                    
                    let $cases = effect.createScope( def, casesScope => node.cases.reduce( ( casesDef, caseNode ) => {
                        let prevCaseDef = casesDef.slice( -1 )[ 0 ];
                        let hasBreak = caseNode.consequent.some( stmt => stmt.type === 'BreakStatement' );
                        let [ test ] = effect.causesProduction( { type: caseNode.type }, () => _transform( [ caseNode.test ], effect ) );
                        let [ $test, _memo ] = effect.createMemo( { expr: test } ).compose();
                        let condition = { switch: memo, cases: [ _memo ] };
                        if ( prevCaseDef && !prevCaseDef.hasBreak ) {
                            condition.cases.push( ...prevCaseDef.condition.cases );
                        }
                        this.setLocation( _memo, caseNode.test );
                        return casesDef.concat( { caseNode, $test, condition, hasBreak } );
                    }, [] ).map( ( { caseNode, $test, condition } ) => {
                        let consequent = effect.createCondition( condition, () => _transform( caseNode.consequent, null, casesScope ) );
                        return astNodes.switchCase( $test, consequent );
                    } ) );

                    this.setLocation( effect, node );
                    this.setLocation( memo, node.discriminant );
                    return _returns(
                        ...effect.compose( astNodes.switchStmt( $discriminant, $cases ) )
                    );
                } );
            }

            /**
             * ------------
             * #ForStatement
             * #WhileStatement
             * #DoWhileStatement
             * ------------
             */
            if ( node.type === 'ForStatement' || node.type === 'WhileStatement' || node.type === 'DoWhileStatement' ) {
                let def = { type: node.type };
                let createNode = astNodes[ node.type === 'ForStatement' ? 'forStmt' : ( node.type === 'WhileStatement' ? 'whileStmt' : 'doWhileStmt' ) ].bind( astNodes );
                return initializeIteration( node, scope, ( declarationScope, iteratorEffect, iterationInstanceEffect ) => {
                    this.setLocation( iteratorEffect, node );
                    this.setLocation( iterationInstanceEffect, node.body );
                    let createNodeCallback, init, test, update, body, preIterationDeclarations;
                    
                    if ( node.type === 'ForStatement' ) {
                        [ init, test, update ] = iteratorEffect.causesProduction( def, () => _transform( [ node.init, node.test, node.update ], iteratorEffect, declarationScope ) );
                        [ body ] = _transform( [ node.body ], iterationInstanceEffect );
                        createNodeCallback = $body => createNode( init, test, update, $body );
                    } else {
                        [ test ] = iteratorEffect.causesProduction( def, () => _transform( [ node.test ], $effect, declarationScope ) );
                        [ body ] = _transform( [ node.body ], iterationInstanceEffect );
                        createNodeCallback = $body => createNode( test, $body );
                    }

                    if ( body.body.length ) {
                        [ preIterationDeclarations, body ] = composeIteration( iterationInstanceEffect, body );
                    }

                    let statements = [].concat( preIterationDeclarations || [] ).concat( createNodeCallback( astNodes.blockStmt( body ) ) );
                    return _returns(
                        ...iteratorEffect.composeWith( statements, [], () => iterationInstanceEffect.dispose() )
                    );
                } );
            }

            /**
             * --------------
             * #ForInStatement
             * #ForOfStatement
             * --------------
             */
            if ( node.type === 'ForInStatement' || node.type === 'ForOfStatement' ) {
                let def = { type: node.type };
                let createNode = astNodes[ node.type === 'ForInStatement' ? 'forInStmt' : 'forOfStmt'].bind( astNodes );
                return initializeIteration( node, scope, ( declarationScope, iteratorEffect, iterationInstanceEffect ) => {
                    this.setLocation( iteratorEffect, node );
                    this.setLocation( iterationInstanceEffect, node.body );

                    let left, iterationId;
                    if ( node.left.type === 'VariableDeclaration' ) {
                        [ left ] = _transform( [ node.left ], iteratorEffect, declarationScope );
                        iterationId = left.declarations[ 0 ].id;
                    } else {
                        [ left ] = iteratorEffect.affectedsProduction( def, () => _transform( [ node.left ], iteratorEffect, declarationScope ) );
                        iterationId = left;
                    }
                    let [ right ] = iteratorEffect.causesProduction( def, () => _transform( [ node.right ], iteratorEffect, declarationScope ) );
                    let [ body ] = _transform( [ node.body ], iterationInstanceEffect );
                    let forStatement = createNode( left, right, body ),
                        preIterationDeclarations = [];

                    if ( body.body.length ) {
                        let composeIterationWith = params => composeIteration( iterationInstanceEffect, body, {
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
                            let iteration$counter = astNodes.identifier( declarationScope.getSubscriptIdentifier( '$counter' ) );
                            [ preIterationDeclarations, newBody ] = composeIterationWith( { iterationId: iteration$counter } );
                            // We'll use a plain Identifier as left
                            newLeft = astNodes.varDeclaration( 'let', [ astNodes.varDeclarator( astNodes.clone( iteration$counter ), null ) ] );
                            // While we replicate the original left and send it into the start of body
                            let leftReDeclaration;
                            if ( node.left.type === 'VariableDeclaration' ) {
                                leftReDeclaration = astNodes.varDeclaration( left.kind, [ astNodes.varDeclarator( iterationId, astNodes.clone( iteration$counter ) ) ] );
                            } else {
                                leftReDeclaration = astNodes.exprStmt( astNodes.sequenceExpr( [ astNodes.assignmentExpr( iterationId, astNodes.clone( iteration$counter ), '=' ) ] ) );
                            }
                            newBody = [ leftReDeclaration ].concat( newBody );
                        }
                        forStatement = createNode( newLeft, right, astNodes.blockStmt( newBody ) );
                    }

                    return _returns(
                        ...iteratorEffect.composeWith( [].concat( preIterationDeclarations || [] ).concat( forStatement ), [], () => iterationInstanceEffect.dispose() )
                    );
                } );
            }

            /**
             * ------------
             * #LabeledStatement
             * ------------
             */
            if ( node.type === 'LabeledStatement' ) {
                let def = { type: node.type, label: node.label };
                return scope.createEffect( def, effect => {
                    effect.subscriptIdentifiersNoConflict( node.label );
                    if ( !node.body.type.endsWith( 'Statement' ) ) {
                        this.setLocation( effect, node.body );
                        let [ body ] = _transform( [ node.body ], effect );
                        return _returns( astNodes.labeledStmt( node.label, effect.compose( body ) ) );
                    }
                    return effect.createScope( { type: node.body.type, label: node.label }, scope => {
                        if ( node.body.type === 'BlockStatement' ) {
                            let body = _transform( node.body.body, null, scope );
                            return _returns( astNodes.labeledStmt( node.label, astNodes.blockStmt( body ) ) );
                        }
                        let [ body ] = _transform( [ node.body ], null, scope );
                        return _returns( astNodes.labeledStmt( node.label, body ) );
                    } );
                } );
            }

            /**
             * ------------
             * #BreakStatement
             * #ContinueStatement
             * ------------
             */
            if ( node.type === 'BreakStatement' || node.type === 'ContinueStatement' ) {
                let createNode = astNodes[ node.type === 'BreakStatement' ? 'breakStmt' : 'continueStmt'].bind( astNodes );
                let [ nearestExitTarget, tt ] = [ 'Iteration', 'SwitchStatement', 'LabeledStatement' ].reduce( ( [ prevType, prevLevel ], type ) => {
                    let level = scope.currentEffect.inContext( type );
                    if ( !prevType || ( level > -1 && level < prevLevel ) ) return [ type, level ];
                    return [ prevType, prevLevel ];
                }, [] );
                if ( nearestExitTarget === 'SwitchStatement' && node.type === 'BreakStatement' && !node.label ) {
                    return _returns( createNode( null ) );
                }
                let subscript$construct = astNodes.identifier( scope.currentEffect.getSubscriptIdentifier( '$construct', true ) );
                let keyword = astNodes.literal( node.type === 'BreakStatement' ? 'break' : 'continue' );
                let label = node.label ? astNodes.literal( node.label.name ) : astNodes.identifier( 'null' );
                let exitCall = astNodes.exprStmt( 
                    astNodes.callExpr( astNodes.memberExpr( subscript$construct, astNodes.identifier( 'exit' ) ), [ keyword, label ] ),
                );
                // Break / continue statement hoisting
                scope.currentEffect.hoistExitStatement( keyword, label );
                // effect.subscriptIdentifiersNoConflict() wont be necessary
                // as the label definition would have had the same earlier
                return _returns( exitCall, astNodes.returnStmt() );
            }

            /**
             * ------------
             * #ReturnStatement
             * ------------
             */
            if ( node.type === 'ReturnStatement' ) {
                let [ argument ] = _transform( [ node.argument ], scope.currentEffect || scope.ownerEffect /* This is a statement that could have had its own effect */ );
                if ( scope.static() || !scope.currentEffect ) {
                    return _returns( astNodes.returnStmt( argument ) );
                }
                let subscript$construct = astNodes.identifier( scope.currentEffect.getSubscriptIdentifier( '$construct', true ) );
                let keyword = astNodes.literal( 'return' );
                let arg = argument || astNodes.identifier( 'undefined' );
                let exitCall = astNodes.exprStmt(
                    astNodes.callExpr( astNodes.memberExpr( subscript$construct, astNodes.identifier( 'exit' ) ), [ keyword, arg ] ),
                );
                // Return statement hoisting
                scope.currentEffect.hoistExitStatement( keyword, astNodes.identifier( 'true' ) );
                return _returns( exitCall, astNodes.returnStmt() );
            }

            /**
             * ------------
             * #BlockStatement
             * ------------
             */
            if ( node.type === 'BlockStatement' ) {
                let __transform = scope => {
                    let body = _transform( node.body, null, scope );
                    return _returns( astNodes.blockStmt( body ) );
                };
                if ( effect ) {
                    // This block statement is from an effect
                    // context, such as an IfStatement
                    let def = { type: node.type };
                    return effect.createScope( def, __transform );
                }
                // From a scope context
                return scope.createBlock( blockScope => __transform( blockScope ) );
            }

            /**
             * ------------
             * #ExpressionStatement
             * ------------
             */
            if (node.type === 'ExpressionStatement') {
                let def = { type: node.type };
                return scope.createEffect( def, effect => {
                    let [ expression ] = effect.causesProduction( def, () => _transform( [ node.expression ], effect ) );
                    this.setLocation( effect, node.expression );
                    return _returns(
                        ...effect.compose( astNodes.exprStmt( expression ) )
                    );
                } );
            }

            /**
             * ------------
             * #AssignmentExpression
             * ------------
             */
            if ( node.type === 'AssignmentExpression' ) {
                let def = { type: node.type, kind: node.operator };
                let rightProduction, [ right ] = effect.causesProduction( def, production => ( rightProduction = production, _transform( [ node.right ] ) ) );
                let leftProduction, [ left ] = effect.embeddableAffectedsProduction( def, production => ( leftProduction = production, _transform( [ node.left ] ) ) );
                rightProduction.setAssignee( leftProduction );
                return _returns(
                    astNodes.assignmentExpr( left, right, node.operator )
                );
            }

            /**
             * ------------
             * #UpdateExpression
             * #UnaryExpression (delete)
             * ------------
             */
            if ( node.type === 'UpdateExpression' || ( node.type === 'UnaryExpression' && node.operator === 'delete' ) ) {
                let def = { type: node.type, kind: node.operator };
                let createNode = astNodes[ node.type === 'UpdateExpression' ? 'updateExpr' : 'unaryExpr'].bind( astNodes );
                let [ argument ] = effect.affectedsProduction( def, () => _transform( [ node.argument ] ) );
                return _returns(
                    createNode( node.operator, argument, node.prefix )
                );
            }

            /**
             * ------------
             * #LogicalExpression
             * ------------
             */
            if ( node.type === 'LogicalExpression' ) {
                let def = { type: node.type, kind: node.operator };
                let [ left ] = effect.chainableCausesProduction( def, () => _transform( [ node.left ] ) );
                let [ $left, memo ] = effect.createMemo( { expr: left } ).compose();
                let conditionAdjacent = node.operator === '||' ? { whenNot: memo } : { when: memo };
                let [ right ] = effect.createCondition( conditionAdjacent, () => {
                    return effect.chainableCausesProduction( def, () => _transform( [ node.right ] ) );
                } );
                this.setLocation( memo, node.left );
                return _returns(
                    astNodes.logicalExpr( node.operator, $left, right )
                );
            }

            /**
             * ------------
             * #ConditionalExpression
             * ------------
             */
            if ( node.type === 'ConditionalExpression' ) {
                let def = { type: node.type };
                let [ test ] = effect.causesProduction( def, () => _transform( [ node.test ] ) ),
                    [ $test, memo ] = effect.createMemo( { expr: test } ).compose(),
                    [ consequent ] = effect.createCondition( { when: memo }, () => effect.chainableCausesProduction( def, () => _transform( [ node.consequent ] ) ) ),
                    [ alternate ] = effect.createCondition( { whenNot: memo }, () => effect.chainableCausesProduction( def, () => _transform( [ node.alternate ] ) ) );
                this.setLocation( memo, node.test );
                return _returns(
                    astNodes.condExpr( $test, consequent, alternate )
                );
            }

            /**
             * ------------
             * #SequenceExpression
             * ------------
             */
            if ( node.type === 'SequenceExpression' ) {
                let expresions = node.expressions.map( ( expr, i ) => {
                    let def = { type: expr.type };
                    if ( i === node.expressions.length - 1 ) {
                        [ expr ] = effect.chainableCausesProduction( def, () => _transform( [ expr ] ) );
                    } else {
                        [ expr ] = effect.causesProduction( def, () => _transform( [ expr ] ) );
                    }
                    return expr;
                } );
                return _returns(
                    astNodes.sequenceExpr( expresions )
                );
            }

            /**
             * ------------
             * #ArrayPattern
             * ------------
             */
            if ( node.type === 'ArrayPattern' ) {
                let elements = node.elements.map( ( element, i ) => {
                    [ element ] = effect.currentProduction.withDestructure( { name: i }, () => _transform( [ element ] ) );
                    return element;
                } );
                return _returns(
                    astNodes.arrayPattern( elements )
                );
            }

            /**
             * ------------
             * #ObjectPattern
             * ------------
             */
            if ( node.type === 'ObjectPattern' ) {
                let properties = node.properties.map( property => {
                    let { key, value } = property;
                    if ( property.computed ) {
                        [ key ] = effect.causesProduction( { type: key.type }, () => _transform( [ key ] ) );
                    }
                    let element = { name: property.key.name };
                    if ( property.computed ) {
                        if ( property.key.type === 'Literal' ) {
                            element = { name: property.key.value };
                        } else {
                            [ key, element ] = effect.createMemo( { expr: key } ).compose();
                        }
                    }
                    [ value ] = effect.currentProduction.withDestructure( element, () => _transform( [ value ] ) );
                    this.setLocation( element, property.key );
                    return astNodes.property( key, value, property.kind, property.shorthand, property.computed, property.method );
                } );
                return _returns(
                    astNodes.objectPattern( properties )
                );
            }

            /**
             * ------------
             * #MemberExpression
             * ------------
             */
            if ( node.type === 'MemberExpression' ) {
                let { property } = node;
                if ( node.computed ) {
                    [ property ] = effect.causesProduction( { type: property.type }, () => _transform( [ property ] ) );
                }
                let element = { name: node.property.name };
                if ( node.computed ) {
                    if ( node.property.type === 'Literal' ) {
                        element = { name: node.property.value };
                    } else {
                        [ property, element ] = effect.createMemo( { expr: property } ).compose();
                    }
                }
                let [ object ] = effect.currentProduction.withProperty( element, () => _transform( [ node.object ] ) );
                this.setLocation( element, node.property );
                return _returns(
                    astNodes.memberExpr( object, property, node.computed, node.optional )
                );
            }

            /**
             * ------------
             * #Identifier
             * #ThisExpression
             * ------------
             */
            if ( node.type === 'Identifier' || node.type === 'ThisExpression' ) {
                let createNode = () => node.type === 'Identifier' ? astNodes.identifier( node.name ) : astNodes.thisExpr();
                // How we'll know Identifiers within script
                if ( node.type === 'Identifier' ) {
                    effect.subscriptIdentifiersNoConflict( node );
                }
                let $identifier = {
                    name: node.type === 'Identifier' ? node.name : 'this',
                };
                this.setLocation( $identifier, node );
                if ( effect ) {
                    let production = effect.currentProduction;
                    do {
                        production.addRef().unshift( $identifier );
                    } while( production = production.contextProduction );
                }
                return _returns( createNode() );
            }

            /**
             * ------------
             * #ArrowFunctionExpression
             * #FunctionExpression
             * #FunctionDeclaration
             * ------------
             */
            if ( node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' ) {
                let createNode = astNodes[ node.type === 'ArrowFunctionExpression' ? 'arrowFuncExpr' : (
                    node.type === 'FunctionExpression' ? 'funcExpr' : 'funcDeclaration'
                ) ].bind( astNodes );
                let [ id ] = node.type === 'FunctionDeclaration' 
                    ? effect.noSelect( () => _transform( [ node.id ] ) )
                    : [ node.id ];
                let params = node.params.map( param => {
                    if ( param.type !== 'AssignmentExpression' ) return param;
                    let [ right ] = effect.noSelect( () => _transform( [ param.right ] ) );
                    return astNodes.assignmentExpr( param.left, right, param.operator );
                } );
                let body, functionScope = ( new Scope( null, { type: 'Function' } ) ).static( true );
                if ( node.body.type === 'BlockStatement' ) {
                    let statements = _transform( node.body.body, null, functionScope );
                    body = astNodes.blockStmt( statements );
                } else {
                    [ body ] = _transform( [ node.body ], null, functionScope );
                }
                return _returns(
                    createNode( params, body, node.async, id, node.expression, node.generator )
                );
            }

            /**
             * ------------
             * #Other
             * ------------
             */
            let _node = node;
            if ( node.type === 'TryStatement' ) {
                let [ block, handler, finalizer ] = _transform( [ node.block, node.handler, node.finalizer ], scope.currentEffect /* This is a statement that could have had its own effect */ );
                _node = astNodes.tryStmt( block, handler, finalizer );
            } else if ( node.type === 'CatchClause' ) {
                let [ body ] = _transform( [ node.body ], scope.currentEffect /* This is a statement that could have had its own effect */ );
                _node = astNodes.catchClause( node.param, body );
            } else if ( [ 'ThrowStatement', 'AwaitExpression', 'SpreadElement', 'UnaryExpression' ].includes( node.type ) ) {
                let [ argument ] = effect.causesProduction( { type: node.type }, () => _transform( [ node.argument ], scope.currentEffect || scope.ownerEffect /* This is a statement that could have had its own effect */ ) );
                if ( node.type === 'ThrowStatement' ) {
                    _node = astNodes.throwStmt( argument );
                } else if ( node.type === 'AwaitExpression' ) {
                    _node = astNodes.awaitExpr( argument );
                    // AsyncAwait hoisting
                    effect.hoistAwaitKeyword();
                } else if ( node.type === 'SpreadElement' ) {
                    _node = astNodes.spreadElem( argument );
                } else {
                    _node = astNodes.unaryExpr( node.operator, argument, node.prefix );
                }
            } else if ( node.type === 'BinaryExpression' ) {
                let [ left ] = effect.causesProduction( { type: node.type }, () => _transform( [ node.left ] ) );
                let [ right ] = effect.causesProduction( { type: node.type }, () => _transform( [ node.right ] ) );
                _node = astNodes.binaryExpr( node.operator, left, right );
            } else if ( [ 'CallExpression', 'NewExpression' ].includes( node.type ) ) {
                // The ongoing production must be used for callee
                let [ callee ] = effect.currentProduction.with( { isCallee: true, callType: node.type }, () => _transform( [ node.callee ] ) );
                let args = node.arguments.map( argument => effect.causesProduction( { type: argument.type }, () => _transform( [ argument ] )[ 0 ] ) );
                if ( node.type === 'CallExpression' ) {
                    _node = astNodes.callExpr( callee, args, node.optional );
                } else {
                    _node = astNodes.newExpr( callee, args );
                }
            } else if ( [ 'ParenthesizedExpression', 'ChainExpression' ].includes( node.type ) ) {
                // The ongoing production must be used for these
                let [ expresion ] = _transform( [ node.expression ] );
                if ( node.type === 'ParenthesizedExpression' ) {
                    _node = astNodes.parensExpr( expresion );
                } else {
                    _node = astNodes.chainExpr( expresion );
                }
            } else if ( node.type === 'ArrayExpression' ) {
                let elements = node.elements.map( element => effect.causesProduction( { type: element.type }, () => _transform( [ element ] )[ 0 ] ) );
                _node = astNodes.arrayExpr( elements );
            } else if ( node.type === 'ObjectExpression' ) {
                let properties = _transform( node.properties );
                _node = astNodes.objectExpr( properties );
            } else if ( node.type === 'Property' ) {
                let { key, value } = node;
                if ( node.computed ) {
                    [ key ] = effect.causesProduction( { type: key.type }, () => _transform( [ key ] ) );
                }
                [ value ] = effect.causesProduction( { type: value.type }, () => _transform( [ value ] ) );
                _node = astNodes.property( key, value, node.kind, node.shorthand, node.computed, node.method );
            } else if ( node.type === 'TaggedTemplateExpression' ) {
                let [ tag, quasi ] = effect.causesProduction( { type: node.type }, () => _transform( [ node.tag, node.quasi ] ) );
                _node = astNodes.taggedTemplateExpr( tag, quasi );
            } else if ( node.type === 'TemplateLiteral' ) {
                let expressions = node.expressions.map( expression => effect.causesProduction( { type: node.type }, () => _transform( [ expression ] )[ 0 ] ) );
                _node = astNodes.templateLiteral( node.quasis, expressions );
            } else if ( node.type === 'Literal' ) {
                _node = astNodes.clone( node );
            }

            return _returns( _node );

        }, [] );
    }

}

export function initializeIteration( node, scope, callback ) {
    return scope.createEffect( { type: node.type }, iteratorEffect => {
        iteratorEffect.defineSubscriptIdentifier( '$counter', [ node.type === 'ForInStatement' ? '$x_key' : '$x_index' ] );
        // A scope for variables declared in header
        return iteratorEffect.createScope( { type: 'Iteration' }, declarationScope => {
            // The iteration instance closure
            return declarationScope.createEffect( { type: 'Iteration' }, iterationInstanceEffect => {
                iterationInstanceEffect.inUse( true );
                return callback( declarationScope, iteratorEffect, iterationInstanceEffect );
            } );
        } );
    } );
}

export function composeIteration( iterationInstanceEffect, body, params = {} ) {
    let disposeCallbacks = [ params.disposeCallback ], disposeCallback = () => disposeCallbacks.forEach( callback => callback && callback() );
    let preIterationDeclarations = [], iterationDeclarations = [];
    let iterationBody = [], effectBody = body.body.slice( 0 );
    // Counter?
    if ( !params.iterationId ) {
        params.iterationId = astNodes.identifier( iterationInstanceEffect.getSubscriptIdentifier( '$counter', true ) );
        let counterInit = astNodes.varDeclarator( astNodes.clone( params.iterationId ), astNodes.literal( -1 ) );
        let counterIncr = astNodes.updateExpr( '++', astNodes.clone( params.iterationId ), false );
        preIterationDeclarations.push( counterInit );
        iterationBody.push( counterIncr );
        // On dispose
        disposeCallbacks.push( () => iterationBody.pop() /* counterIncr */ );
    }
    // The iterationDeclarations
    if ( iterationDeclarations.length ) {
        iterationBody.push( astNodes.varDeclaration( 'let', iterationDeclarations ) );
        disposeCallbacks.push( () => iterationBody.splice( -1 ) /* iterationDeclarations */ );
    }
    // Main
    iterationBody.push( ...iterationInstanceEffect.composeWith( effectBody, [ params.iterationId ], disposeCallback ) );

    // Convert to actual declaration
    if ( preIterationDeclarations.length ) {
        preIterationDeclarations = astNodes.varDeclaration( 'let', preIterationDeclarations );
    } else {
        preIterationDeclarations = null;
    }

    return [ preIterationDeclarations, iterationBody ];
}
