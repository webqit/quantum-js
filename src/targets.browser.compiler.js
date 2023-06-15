
/**
 * @imports
 */
import { parse, compile, serialize } from './compiler/index.js';

// As globals
if ( !self.webqit ) { self.webqit = {}; }
self.webqit.ContractCompiler = { parse, compile, serialize };
