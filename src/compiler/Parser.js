
/**
 * @import
 */
import { Parser } from 'acorn';

export default Parser.extend( function( Parser ) {
    return class extends Parser {

        parseFunction( node, statement, allowExpressionBody, isAsync, forInit ) {
            if ( this.type.label === '**' ) {
                node.isSubscriptFunction = true;
                this.next();
            }
            return super.parseFunction( node, statement, allowExpressionBody, isAsync, forInit );
        }

    }
} );
