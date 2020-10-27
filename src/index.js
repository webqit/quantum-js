
/**
 * @imports
 */
import Parser from './Parser.js';
import grammar from './grammar.js';
import Scope from './Scope.js';

/**
 * @var object
 */
Parser.grammar = grammar;

/**
 * @exports
 */
export default Parser;
export {
	Scope,
}
