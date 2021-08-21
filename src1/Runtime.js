
/**
 * ---------------------------
 * Parser class
 * ---------------------------
 */				
export default class Runtime {
	 
	/**
	 * @inheritdoc
	 */
	static eval(ast, ...args) {
		return ast.eval(...args);
	}
};