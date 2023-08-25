
/**
 * @imports
 */
import { _parse, _generate, _serialize, ReflexFunction } from './driver.js';


const a = `
let profileProp = 'avatar';
let avatarUrl = candidate.profile[ profileProp ];
`;

const b = `// These will be re-computed from this.href always
let [ protocol, hostname, port, pathname, search, hash ] = parseUrl(this.href);

this.protocol = protocol;
this.hostname = hostname;
this.port = port;
this.pathname = pathname;
this.search = search;
this.hash = hash;
/**
*/

// These individual property assignments each depend on the previous 
this.host = this.hostname + (this.port ? ':' + this.port : '');
this.origin = this.protocol + '//' + this.host;
let href = this.origin + this.pathname + this.search + this.hash;
if (href !== this.href) { // Prevent unnecessary update
  this.href = href;
}`;

const c = `
//let thisd = jj;
thisd = eee;
thisd = ooo2;
let a = thisd;
`;

let source = c;

let ast = _parse( source );
let gen = _generate( ast );

console.log( '' );
console.log( '' );
console.log( '' );
console.log( '' );
console.log( '' );
console.log( '' );
console.log( '' );
console.log( '' );
console.log( '>> Reflex Source' );
console.log( gen.source );
console.log( '' );
console.log( '>> Dependency Graph' );
console.log( JSON.stringify( gen.graph, null, 4 ) );
console.log( '' );

/**
*/

let demo = ReflexFunction(source);

console.log(ReflexFunction.inspect(demo));