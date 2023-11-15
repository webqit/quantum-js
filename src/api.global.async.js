
/**
 * @imports
 */
import * as QuantumJS from './index.async.js';

// As globals
if ( !globalThis.webqit ) { self.webqit = {}; }
Object.assign( globalThis.webqit, QuantumJS );
