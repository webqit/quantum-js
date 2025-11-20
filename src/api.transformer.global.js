import { parse, transform, serialize } from './transformer/index.js';

// As globals
if ( !globalThis.webqit ) { globalThis.webqit = {}; }
globalThis.webqit.$useLiveT = { parse, transform, serialize };
