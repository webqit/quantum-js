
/**
 * @import
 */
import { Parser } from 'acorn';

export default Parser.extend( function( Parser ) {
    let isSubscriptFunction = false;
    let parsingClassElement = false;
    let parsingProperty = false;
    return class extends Parser {

        parseFunction( node, statement, allowExpressionBody, isAsync, forInit ) {
            if ( this.type.label === '**' ) {
                node.isSubscriptFunction = true;
                this.next();
            }
            return super.parseFunction( node, statement, allowExpressionBody, isAsync, forInit );
        }

        isClassElementNameStart() {
            if ( this.type.label === '**' ) {
                isSubscriptFunction = true;
                this.next();
            }
            return super.isClassElementNameStart();
        }

        isAsyncProp( prop ) {
            if ( this.type.label === '**' ) {
                isSubscriptFunction = true;
                this.next();
            }
            return super.isAsyncProp( prop );
        }

        eat( token ) {
            if ( (
                ( parsingProperty && token.label === ':' ) 
                || ( ( parsingProperty || parsingClassElement ) && token.label === '*' ) 
            ) && this.type.label === '**' ) {
                isSubscriptFunction = true;
                this.next();
                return false;
            }
            return super.eat( token );
        }

        parseProperty( isPattern, refDestructuringErrors ) {
            parsingProperty = true;
            let node = super.parseProperty( isPattern, refDestructuringErrors );
            parsingProperty = false;
            if ( isSubscriptFunction ) {
                node.value.isSubscriptFunction = true;
                isSubscriptFunction = false;
            }
            return node;
        }

        parseClassElement( constructorAllowsSuper ) {
            parsingClassElement = true;
            let node = super.parseClassElement( constructorAllowsSuper );
            parsingClassElement = false;
            if ( isSubscriptFunction ) {
                node.value.isSubscriptFunction = true;
                isSubscriptFunction = false;
            }
            return node;
        }

    }
} );
