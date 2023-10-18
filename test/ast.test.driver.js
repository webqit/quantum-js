
/**
 * @imports
 */
import { expect } from 'chai';
import Compiler from '../src/compiler/Compiler.js';
import Parser from '../src/compiler/Parser.js';

export const _jsonfy = ast => JSON.parse( JSON.stringify( ast ) );
export const _parse = source => Parser.parse( source, {
    ecmaVersion: 'latest',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowSuperOutsideMethod: true,
    preserveParens: false,
} );

let compiler;
export const _generate = ast => ( compiler = new Compiler ).generate( ast );
export const _serialize = ast => compiler.serialize( ast );
export const _noLocs = ast => {
    Object.keys( ast ).forEach( key => {
        if ( [ 'start', 'end', 'comments', 'raw' ].includes( key ) ) {
            delete ast[ key ];
        } else if ( Array.isArray( ast[ key ] ) ) {
            ast[ key ].filter( node => node ).forEach( _noLocs );
        } else if ( typeof ast[ key ] === 'object' && ast[ key ] ) {
            if ( ast[ key ].whitelist && ast[ key ].blacklist ) {
                ast[ key ] = ast[ key ].toString();
            } else {
                _noLocs( ast[ key ] );
            }
        }
    } );
};

const tests = [];
export function empty() { tests.splice(0); }

export function run() {
    for ( const test of tests ) {
        it( test.desc, function() {
            // Test
            let sourceAst = _generate( _parse( test.source ) ).ast;
            // Expected
            let expectedAst = test.expected;
            if ( typeof expectedAst === 'string' ) {
                expectedAst = _parse( expectedAst );
            }
            _noLocs( sourceAst );
            _noLocs( expectedAst );
            expect( sourceAst ).to.deep.eql( expectedAst );
        } );
    }
}

export function add( desc, source, expected, options = {} ) {
    tests.push( { desc, source, expected, options } );
}

export function group( desc, callback ) {
    describe( desc, function() {
        empty();
        callback();
        run();
    } );
}

export const lookup = (v) => {
    return eval(v);
}
