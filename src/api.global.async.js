
/**
 * @imports
 */
import * as StatefulJS from './index.async.js';

// As globals
if ( !globalThis.webqit ) { self.webqit = {}; }
Object.assign( globalThis.webqit, StatefulJS );
