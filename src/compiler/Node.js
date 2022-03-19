
export default {

    // Statements & Clauses
    tryStmt( block, handler, finalizer, guardedHandlers ) { return { type: 'TryStatement', block, handler, finalizer, guardedHandlers }; },
    catchClause( param, body ) { return { type: 'CatchClause', param, body }; },
    throwStmt( argument ) { return { type: 'ThrowStatement', argument }; },
    returnStmt( argument ) { return { type: 'ReturnStatement', argument }; },
    exprStmt( expression ) { return { type: 'ExpressionStatement', expression, }; },
    blockStmt( body ) { return { type: 'BlockStatement', body }; },
    labeledStmt( label, body ) { return { type: 'LabeledStatement', label, body }; },
    withStmt( object, body ) { return { type: 'WithStatement', object, body }; },
    ifStmt( test, consequent, alternate ) { return this.condExpr(test, consequent, alternate, 'IfStatement'); },
    switchStmt( discriminant, cases, lexical = false ) { return { type: 'SwitchStatement', discriminant, cases, /*lexical*/ /* Failing tests and seems to be SpiderMonkey-specific*/ }; },
    switchCase( test, consequent ) { return { type: 'SwitchCase', test, consequent }; },
    whileStmt( test, body ) { return { type: 'WhileStatement', test, body }; },
    doWhileStmt( test, body ) { return { type: 'DoWhileStatement', test, body }; },
    forStmt( init, test, update, body ) { return { type: 'ForStatement', init, test, update, body }; },
    forInStmt( left, right, body ) { return { type: 'ForInStatement', left, right, body }; },
    forOfStmt( left, right, body ) { return { type: 'ForOfStatement', left, right, body }; },
    breakStmt( label = null ) { return { type: 'BreakStatement', label }; },
    continueStmt( label = null ) { return { type: 'ContinueStatement', label }; },

    // Declarations
    varDeclaration( kind, declarations ) { return { type: 'VariableDeclaration', kind, declarations } },
    varDeclarator( id, init = null ) { return { type: 'VariableDeclarator', id, init } },
    funcDeclaration( id, params, body, async = false, expression = false, generator = false ) {
        return this.func( 'FunctionDeclaration', ...arguments );
    },

    // Expressions
    sequenceExpr( expressions ) { return { type: 'SequenceExpression', expressions }; },
    parensExpr( expression ) { return { type: 'ParenthesizedExpression', expression }; },
    logicalExpr( operator, left, right ) { return { type: 'LogicalExpression', operator, left, right, }; },
    binaryExpr( operator, left, right ) { return { type: 'BinaryExpression', operator, left, right, }; },
    unaryExpr( operator, argument, prefix = true ) { return { type: 'UnaryExpression', operator, argument, prefix }; },
    updateExpr( operator, argument, prefix = false ) { return { type: 'UpdateExpression', operator, argument, prefix }; },
    assignmentExpr( left, right, operator = '=' ) { return { type: 'AssignmentExpression', operator, left, right }; },
    assignmentPattern( left, right ) { return { type: 'AssignmentPattern', left, right }; },
    thisExpr() { return { type: 'ThisExpression' }; },
    condExpr( test, consequent, alternate, type = 'ConditionalExpression' ) { return { type, test, consequent, alternate }; },
    arrayExpr( elements ) { return { type: 'ArrayExpression', elements }; },
    arrayPattern( elements ) { return { type: 'ArrayPattern', elements }; },
    objectExpr( properties ) { return { type: 'ObjectExpression', properties }; },
    objectPattern( properties ) { return { type: 'ObjectPattern', properties }; },
    chainExpr( expression ) { return { type: 'ChainExpression', expression }; },
    callExpr( callee, args, optional = false ) { return { type: 'CallExpression', callee, arguments: args, optional }; },
    newExpr( callee, args ) { return { type: 'NewExpression', callee, arguments: args }; },
    awaitExpr( argument ) { return { type: 'AwaitExpression', argument }; },
    taggedTemplateExpr( tag, quasi ) { return { type: 'TaggedTemplateExpression', tag, quasi }; },
    memberExpr( object, property, computed = false, optional = false ) {
        return { type: 'MemberExpression', object, property, computed, optional };
    },
    funcExpr( id, params, body, async = false, expression = false, generator = false ) {
        return this.func( 'FunctionExpression', ...arguments );
    },
    arrowFuncExpr( id, params, body, async = false, expression = false, generator = false ) {
        return this.func( 'ArrowFunctionExpression', ...arguments );
    },
    
    // Other
    func( type, id, params, body, async = false, expression = false, generator = false ) {
        return { type, id, params, body, async, expression, generator, };
    },
    identifier( name ) { return { type: 'Identifier', name }; },
    property( key, value, kind = 'init', shorthand = false, computed = false, method = false ) { return { type: 'Property', key, value, kind, shorthand, computed, method }; },
    methodDefinition( key, value, kind = 'method', $static = false, computed = false ) { return { type: 'MethodDefinition', key, value, kind, static: $static, computed }; },
    spreadElement( argument ) { return { type: 'SpreadElement', argument }; },
    literal( value ) { return { type: 'Literal', value }; },
    templateLiteral( quasis, expressions ) { return { type: 'TemplateLiteral', quasis, expressions }; },

    // Util
    invert( expr ) { return this.unaryExpr( '!', expr ); },
    clone( expr ) {
        expr = { ...expr };
        delete expr.start;
        delete expr.end;
        return expr;
    },

}