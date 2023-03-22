
/**
 * @imports
 */
import { parse, compile, serialize } from './compiler/index.js';

// As globals
if ( !self.webqit ) { self.webqit = {}; }
self.webqit.SubscriptCompiler = { parse, compile, serialize };
