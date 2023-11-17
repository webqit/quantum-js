
/**
 * @imports
 */
import * as QuantumJS from './index.lite.js';

// As globals
if ( !globalThis.webqit ) { self.webqit = {}; }
Object.assign( globalThis.webqit, QuantumJS );
