
/**
 * @imports
 */
import { parse, compile, serialize } from './compiler/index.js';

// As globals
if ( !self.wq ) { self.wq = {}; }
self.wq.SubscriptCompiler = { parse, compile, serialize };
