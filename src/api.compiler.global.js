
/**
 * @imports
 */
import { parse, compile, serialize } from './compiler/index.js';

// As globals
if ( !globalThis.webqit ) { globalThis.webqit = {}; }
globalThis.webqit.$qCompiler = { parse, compile, serialize };
