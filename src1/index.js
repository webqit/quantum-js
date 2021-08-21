
/**
 * @imports
 */
import Parser from './Parser.js';
import grammar from './grammar.js';
import Runtime from './Runtime.js';
import Scope from './Scope.js';

/**
 * @var object
 */
Parser.grammar = grammar;

/**
 * @exports
 */
export {
	Parser,
	Runtime,
	Scope,
}
