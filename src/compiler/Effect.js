
/**
 * @imports
 */
import Node from './Node.js';
import Scope from './Scope.js';
import Memo from './Memo.js';
import Condition from './Condition.js';
import CausesProduction from './CausesProduction.js';
import AffectedsProduction from './AffectedsProduction.js';
import { astNodes } from './Generators.js';

export default class Effect extends Node {

    constructor( ownerScope, id, def ) {
        super( id, def );
        this.ownerScope = ownerScope;
        // Scopes
        this.scopes = [];
        this.scopesStack = [];
        // Conditions
        this.conditions = [];
        this.conditionsStack = [];
        if ( this.parentEffect && this.parentEffect.currentCondition ) {
            let condition = new Condition( this, this.parentEffect.currentCondition, this.nextId, {} );
            this.conditions.unshift( condition );
            // Keep in stack while callback runs
            this.conditionsStack.unshift( condition );
        }
        // Causes and Affecteds
        this.causes = [];
        this.affecteds = [];
        this.productionsStack = [];
        // Memos
        this.memos = [];
        // Subscript identifers
        this.subscriptIdentifiers = {};
        // Hoisting
        this._hoistedExitStatements = new Map;
    }

    // ---------------

    get parentEffect() {
        return this.ownerScope && this.ownerScope.ownerEffect;
    }

    get $params() {
        return this.params || (
            this.ownerScope && this.ownerScope.$params
        );
    }

    get nextId() {
        if ( this.parentEffect ) {
            return this.parentEffect.nextId;
        }
        if ( typeof this._nextId === 'undefined' ) {
            this._nextId = 0;
        }
        return this._nextId ++;
    }

    get lineage() {
        if ( this.isIntermediateInstance ) return this.parentEffect.lineage;
        let lineage = this.parentEffect && this.parentEffect.lineage;
        return `${ lineage ? lineage + '/' : '' }${ this.id }`;
    }

    inContext( typeOrCallback, prevLevel = -1 ) {
        let currentLevel = prevLevel + 1;
        if ( typeof typeOrCallback === 'function' ) {
            return typeOrCallback( this, currentLevel ) || (
                this.parentEffect && this.parentEffect.inContext( typeOrCallback, currentLevel )
            );
        }
        return this.type === typeOrCallback ? currentLevel : (
            ( this.parentEffect && this.parentEffect.inContext( typeOrCallback, currentLevel ) ) || -1
        );
    }

    // -----------------

    createScope( def, callback ) {
        let scope = new Scope( this, this.scopes.length, def );
        this.scopes.unshift( scope );
        // Keep in stack while callback runs
        this.scopesStack.unshift( scope );
        let result = callback( scope );
        this.scopesStack.shift();
        // Return callback result
        return result;
    }

    get currentScope() {
        return this.scopesStack[ 0 ];
    }

    // ---------------

    createCondition( def, callback ) {
        let condition = new Condition( this, this.currentCondition, this.nextId, def );
        this.conditions.unshift( condition );
        // Keep in stack while callback runs
        this.conditionsStack.unshift( condition );
        let result = callback();
        this.conditionsStack.shift();
        // Return callback result
        return result;
    }

    get currentCondition() {
        return this.conditionsStack[ 0 ];
    }

    // ---------------

    hoistAwaitKeyword() {
        this._hoistedAwaitKeyword = true;
        // We're testing DIRECT scope
        if ( this.ownerScope && this.ownerScope.type === 'Function' ) return;
        this.parentEffect && this.parentEffect.hoistAwaitKeyword();
    }

    get hoistedAwaitKeyword() {
        return this._hoistedAwaitKeyword;
    }

    hoistExitStatement( keyword, arg ) {
        if ( [ 'break', 'continue' ].includes( keyword.value ) ) {
            let labelInfo = this.getLabelInfo();
            let isLast = labelInfo.type === 'Iteration'
                ? labelInfo.target !== 'BlockStatement' && ( arg.value === labelInfo.label || !arg.value )
                : arg.value && arg.value === labelInfo.label;
            if ( isLast ) {
                this._hoistedExitStatements.set( keyword, { ...labelInfo, arg } );
                return labelInfo;
            }
        }
        this._hoistedExitStatements.set( keyword, arg );
        if ( this.parentEffect ) {
            return this.parentEffect.hoistExitStatement( keyword, arg );
        }
    }

    get hoistedExitStatements() {
        return this._hoistedExitStatements;
    }

    getLabelInfo() {
        let type = this.type, label, target;
        if ( ( this.ownerScope || {} ).label ) {
            ( { label: { name: label }, type: target } = this.ownerScope );
        } else if ( type === 'Iteration' && this.parentEffect.ownerScope.label ) {
            ( { label: { name: label }, type: target } = this.parentEffect.ownerScope );
        };
        return { type, label, target, };
    }

    // ---------------

    createMemo( def ) {
        let memo = new Memo( this, this.memos.length, def );
        this.memos.unshift( memo );
        return memo;
    }

    // -----------------

    defineSubscriptIdentifier( id, whitelist, blacklist = [] ) {
        this.subscriptIdentifiers[ id ] = {
            whitelist,
            blacklist,
            toString() { return this.whitelist[ 0 ] },
        };
    }

    getSubscriptIdentifier( id, globally = false ) {
        return this.subscriptIdentifiers[ id ] || (
            globally && this.parentEffect && this.parentEffect.getSubscriptIdentifier( id, globally )
        );
    }

    subscriptIdentifiersNoConflict( identifier ) {
        if ( identifier.type !== 'Identifier' ) {
            throw new Error(`An implied Identifier is of type ${ identifier.type }`);
        }
        for ( let id in this.subscriptIdentifiers ) {
            let subscriptIdentifier = this.subscriptIdentifiers[ id ];
            let i = subscriptIdentifier.whitelist.indexOf( identifier.name );
            if ( i === -1 ) continue;
            subscriptIdentifier.blacklist.push( subscriptIdentifier.whitelist.splice( i, 1 ) );
            if ( !subscriptIdentifier.whitelist.length ) {
                subscriptIdentifier.whitelist = subscriptIdentifier.blacklist.map( name => {
                    let newVar;
                    do {
                        let randChar = String.fromCharCode( 0 |Math.random() *26 +97 );
                        newVar = `${ name }${ randChar }`;
                    } while ( subscriptIdentifier.blacklist.includes( newVar ) );
                    return newVar;
                });
            }
        }
        this.parentEffect && this.parentEffect.subscriptIdentifiersNoConflict( identifier );
    }

    // ---------------

    causesProduction( def, callback, resolveInScope = true ) {
        let causesProduction = new CausesProduction( this, this.causes.length, def );
        this.causes.unshift( causesProduction );
        return this._runProduction( causesProduction, callback, resolveInScope );
    }

    affectedsProduction( def, callback, resolveInScope = true ) {
        let affectedsProduction = new AffectedsProduction( this, this.affecteds.length, def );
        this.affecteds.unshift( affectedsProduction );
        return this._runProduction( affectedsProduction, callback, resolveInScope );
    }

    chainableCausesProduction( def, callback ) {
        return this.currentProduction.refs.size && !this.currentProduction.propertyStack.length
            ? this.causesProduction( def, callback )
            : callback();
    }

    embeddableCausesProduction( def, callback ) {
        let result = this.causesProduction( def, ( production, currentProduction ) => {
            production.contextProduction = currentProduction;
            return callback( production, currentProduction );
        } );
        return result;
    }

    embeddableAffectedsProduction( def, callback ) {
        let result = this.affectedsProduction( def, ( production, currentProduction ) => {
            production.contextProduction = currentProduction;
            return callback( production, currentProduction );
        } );
        return result;
    }

    get currentProduction() {
        return this.productionsStack[ 0 ];
    }

    _runProduction( production, callback, resolveInScope ) {
        // IMPORTANT: save this before unshift();
        let currentProduction = this.currentProduction;

        // Keep in stack while callback runs
        this.productionsStack.unshift( production );
        let result = callback( production, currentProduction );
        let _production = this.productionsStack.shift();
        // Just to be sure
        if ( _production !== production ) {
            throw new Error( `Production stack corrupted.` );
        }
        if ( !resolveInScope || !this.ownerScope ) return result;

        if ( production instanceof AffectedsProduction ) {
            // Update refs in scope
            if ( !production.refs.size ) {
                this.affecteds = this.affecteds.filter( p => p !== production )
            } else if ( production.type !== 'VariableDeclaration' || production.kind === 'var' ) {
                this.ownerScope.doUpdate( production );
            }
        } else {
            // Observe refs in scope
            ( production.refs.size && this.ownerScope.doSubscribe( production ) ) 
            || ( this.causes = this.causes.filter( p => p !== production ) );
        }

        // Return callback result
        return result;
    }

    // ---------------

    compose( expr, disposeCallback = null ) {
        return this._createNode( expr, { disposeCallback, block: true } );
    }

    composeWith( expr, $args = [], disposeCallback = null ) {
        return this._createNode( expr, { block: true, $args, disposeCallback });
    }

    _createNode( expr, params ) {
        if ( !expr ) return expr;

        // ---------------
        this.originalExpr = expr;
        this.nodeParams = params;
        // ---------------

        let body;
        if ( Array.isArray( expr ) ) {
            body = astNodes.blockStmt( expr );
        } else {
            body = astNodes.blockStmt( [ expr ] );
        }

        let subscript$construct = astNodes.identifier( this.getSubscriptIdentifier( '$construct', true ) );
        
        // Create the effect node
        let callee = astNodes.arrowFuncExpr( [ subscript$construct ], body, this.hoistedAwaitKeyword );
        let constructArgs = [ astNodes.literal( this.id ), ...( params.$args || [] ), callee ];
        let construct = astNodes.callExpr( subscript$construct, constructArgs );
        if ( this.hoistedAwaitKeyword ) {
            construct = astNodes.awaitExpr( construct );
        }
        construct = astNodes.exprStmt( construct );
        construct.comments = [ {
            type: 'Line',
            value: `${ this.lineage }`,
        } ];
        // The list of returned statements
        let statements = [ construct ];
        this.hookExpr = statements;

        // Complete exits handling
        let $label = ( this.getLabelInfo() || {} ).name;
        if ( !( this.ownerScope || {} ).singleStatementScope ) {
            let hoistedExits, seen = [], prevIf, pushIf = ( test, consequent ) => {
                let ifStmt = astNodes.ifStmt( test, consequent );
                if ( prevIf ) {
                    prevIf.alternate = ifStmt;
                } else {
                    prevIf = ifStmt;
                    statements.push( ifStmt );
                }
            };
            this.hoistedExitStatements.forEach( ( arg, keyword ) => {
                if ( [ 'break', 'continue' ].includes( keyword.value ) && !seen.includes( keyword.value ) && arg.arg ) {
                    let label = arg.arg;
                    // This keyword meets its target
                    let exitCheck = astNodes.callExpr(
                        astNodes.memberExpr( subscript$construct, astNodes.identifier( 'exiting' ) ),
                        [ keyword, label ]
                    );
                    let exitAction = astNodes.exprStmt(
                        astNodes.identifier( arg.type === 'Iteration' || !label.value ? keyword.value : keyword.value + ' ' + label.value )
                    );
                    pushIf( exitCheck, exitAction );
                    seen.push( keyword.value );
                } else {
                    hoistedExits = true;
                }
            } );
            if ( hoistedExits ) {
                // But not inside
                let exitCheck = astNodes.callExpr(
                    astNodes.memberExpr( subscript$construct, astNodes.identifier( 'exiting' ) )
                );
                let exitAction = astNodes.exprStmt( astNodes.identifier( 'return' ) );
                pushIf( exitCheck, exitAction );
            }
        }

        return statements;
    }

    // ---------------

    dispose() {
        if ( !this.hookExpr ) return;
        if ( this.nodeParams && this.nodeParams.disposeCallback ) {
            return this.nodeParams.disposeCallback();
        }
        Object.keys( this.hookExpr ).forEach( k => {
            delete this.hookExpr[ k ];
        } );
        Object.keys( this.originalExpr ).forEach( k => {
            this.hookExpr[ k ] = this.originalExpr[ k ];
        } );
        this.hookExpr = null;
    }

    toJson( filter = false ) {
        return {
            id: this.id,
            type: this.type,
            causes: this.causes.reduce( ( causes, cause ) => {
                causes[ cause.id ] = cause.toJson( filter );
                return causes;
             }, {} ),
            affecteds: this.affecteds.reduce( ( affecteds, affected ) => {
                if ( filter && !affected.inUse() ) return affecteds;
                affecteds[ affected.id ] = affected.toJson( filter );
                return affecteds;
            }, {} ),
            conditions: this.conditions.reduce( ( conditions, condition ) => {
                if ( filter && !condition.inUse() ) return conditions;
                conditions[ condition.id ] = condition.toJson( filter );
                return conditions;
            }, {} ),
            hoistedAwaitKeyword: this.hoistedAwaitKeyword,
            lineage: this.lineage,
            childEffects: this.scopes.reduce( ( childEffects, scope ) => {
                return scope.effects.reduce( ( _childEffects, effect ) => {
                    if ( filter && !effect.inUse() ) return _childEffects;
                    let childJson = effect.toJson( filter );
                    if ( effect.isIntermediateInstance ) {
                        _childEffects = { ..._childEffects, ...childJson.childEffects };
                    } else {
                        _childEffects[ effect.id ] = childJson;
                    }
                    return _childEffects;
                }, childEffects );
            }, {} ),
            loc: this.loc,
        }
    }

    get isIntermediateInstance() {
        return this.type === 'BlockStatement' 
        || ( this.type === 'LabeledStatement' && this.scopes.length );
    }

}