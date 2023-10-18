
/**
 * @import
 */
import { Parser } from 'acorn';

export default Parser.extend( function( Parser ) {
    let isStatefulFunction = false;
    let parsingClassElement = false;
    let parsingProperty = false;
    return class extends Parser {

        parseFunction( node, statement, allowExpressionBody, isAsync, forInit ) {
            if ( this.type.label === '**' ) {
                node.isStatefulFunction = true;
                this.next();
            }
            return super.parseFunction( node, statement, allowExpressionBody, isAsync, forInit );
        }

        isClassElementNameStart() {
            if ( this.type.label === '**' ) {
                isStatefulFunction = true;
                this.next();
            }
            return super.isClassElementNameStart();
        }

        isAsyncProp( prop ) {
            if ( this.type.label === '**' ) {
                isStatefulFunction = true;
                this.next();
            }
            return super.isAsyncProp( prop );
        }

        eat( token ) {
            if ( (
                ( parsingProperty && token.label === ':' ) 
                || ( ( parsingProperty || parsingClassElement ) && token.label === '*' ) 
            ) && this.type.label === '**' ) {
                isStatefulFunction = true;
                this.next();
                return false;
            }
            return super.eat( token );
        }

        parseProperty( isPattern, refDestructuringErrors ) {
            parsingProperty = true;
            let node = super.parseProperty( isPattern, refDestructuringErrors );
            parsingProperty = false;
            if ( isStatefulFunction ) {
                node.value.isStatefulFunction = true;
                isStatefulFunction = false;
            }
            return node;
        }

        parseClassElement( constructorAllowsSuper ) {
            parsingClassElement = true;
            let node = super.parseClassElement( constructorAllowsSuper );
            parsingClassElement = false;
            if ( isStatefulFunction ) {
                node.value.isStatefulFunction = true;
                isStatefulFunction = false;
            }
            return node;
        }

    }
} );
