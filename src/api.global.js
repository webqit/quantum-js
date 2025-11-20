import * as UseLive from './index.js';

// As globals
if ( !globalThis.webqit ) { globalThis.webqit = {}; }
Object.assign( globalThis.webqit, UseLive );
