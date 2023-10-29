
/**
 * @imports
 */
import { parse, compile, serialize } from './compiler/index.js';

// As globals
if ( !globalThis.webqit ) { globalThis.webqit = {}; }
globalThis.webqit.$fCompiler = { parse, compile, serialize };
