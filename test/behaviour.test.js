
/**
 * @imports
 */
import { expect } from 'chai';
import Parser from '../src/transformer/Parser.js';
import { parserParams } from '../src/params.js';
import { LiveFunction, AsyncLiveFunction, LiveScript, LiveModule, Observer } from '../src/index.js';

import { setMaxListeners } from 'events';
import { env as env1 } from '../src/util.js';
import { env as env2 } from '@webqit/observer/src/util.js';
env1.setMaxListeners = setMaxListeners;
env2.setMaxListeners = setMaxListeners;

const promise = (timeout, value) => new Promise(res => setTimeout(() => res(value), timeout));

const env = { log: [], iteratee: ['0', '1', '2', '3'], breakpoint: '2', br: 10 };

/*
const script = new LiveModule(`
    d = class {
        static dd = async function () {
            dddd(live function mmmm() {
                //console.log();
            });
            //console.log();
        };
        d = async function() {
            //console.log();
        }
    }
`, { env } );

const script = new LiveModule(`
    let kk, rest;
    console.log('In operator', 'length' in log);
    [ kk, , ...rest ] = iteratee;
    let Observer = await import('@webqit/observer');
    log.push( rest, typeof restkkkk, Observer );
`, { env } );

await script.execute();
Observer.proxy( env.iteratee ).push( 'four', 'five' );
console.log( '----------------', script.toString( true ) );
console.log( '----------------', env.log );





const t = AsyncLiveFunction(`
    for (let i in await iteratee) {
        console.log(await i);
        if (i === '3') iteratee.push( iteratee.length + '' );
        if (i === '4') iteratee.push( iteratee.length + '' );
        if (i === breakpoint) {
            console.log('breaking');
            break;
        }
    }
`, { env } );
console.log(t.toString(true));
await t();
await promise( 400 );
Observer.proxy( env.iteratee ).push( env.iteratee.length + '' );
Observer.proxy( env.iteratee ).push( env.iteratee.length + '' );
await promise( 400 );
Observer.set( env, 'breakpoint', '4' );
await promise( 400 );
Observer.set( env, 'breakpoint', '5' );
await promise( 400 );
Observer.set( env, 'breakpoint', '19' );
await promise( 400 );





const t = LiveFunction(`
    for (let i = 0; i < iteratee.length; i++) {
        console.log( i);
        if (i + '' === breakpoint) {
            console.log('breaking');
            break;
        }
    }
`, { env } );
console.log(t.toString(true));
await t();
await promise( 400 );
Observer.set( env, 'breakpoint', '4' );
await promise( 400 );





const t = LiveFunction(`
    let i = 0
    while(i++ < 100) {
        if (i===br) break;
        console.log(i);
    }
`, { env } );
console.log(t.toString(true));
await t();
Observer.set( env, 'br', 12 );
Observer.set( env, 'br', 30 );
await promise( 400 );
*/

//process.exit();

describe('Live "function" syntax using "live"', function () {

    it('Should detect a "live function" declaration.', function () {
        const { body: [functionAST] } = Parser.parse(`live function name() {}`, parserParams);
        expect(functionAST.type).to.equal('FunctionDeclaration');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect an "async live function" declaration.', function () {
        const { body: [functionAST] } = Parser.parse(`async live function name() {}`, parserParams);
        expect(functionAST.type).to.equal('FunctionDeclaration');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "x = live function" expression - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = live function name() {}`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = live function() {}`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "x = async live function" expression - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = async live function name() {}`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = async live function() {}`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect a "x = live () => {}" arrow expression.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = live () => {}`, parserParams);
        expect(functionAST1.type).to.equal('ArrowFunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = live arg => {}`, parserParams);
        expect(functionAST2.type).to.equal('ArrowFunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect a "x = async live () => {}" arrow expression.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = async live () => {}`, parserParams);
        expect(functionAST1.type).to.equal('ArrowFunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = async live arg => {}`, parserParams);
        expect(functionAST2.type).to.equal('ArrowFunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "object method" syntax using "live"', function () {

    it('Should detect a "live" method.', function () {
        const { body: [{ expression: { right: { properties: [{ value: functionAST }] } } }] } = Parser.parse(`o = { live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "async live" method.', function () {
        const { body: [{ expression: { right: { properties: [{ value: functionAST }] } } }] } = Parser.parse(`o = { async live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "prop: live function" property - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { properties: [{ value: functionAST1 }] } } }] } = Parser.parse(`o = { prop: live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { properties: [{ value: functionAST2 }] } } }] } = Parser.parse(`o = { prop: live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "prop: async live function" property - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { properties: [{ value: functionAST1 }] } } }] } = Parser.parse(`o = { prop: async live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { properties: [{ value: functionAST2 }] } } }] } = Parser.parse(`o = { prop: async live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "class method" syntax using "live"', function () {

    it('Should detect a "live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "async live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { async live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "prop = live function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { prop = live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { prop = live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "prop = async live function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { prop = async live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { prop = async live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "static class method" syntax using "live"', function () {

    it('Should detect a "static live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { static live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "static async live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { static async live name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "static prop = live function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { static prop = live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { static prop = live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "static prop = async live function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { static prop = async live function name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { static prop = async live function() {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});






describe('Live "function" syntax using "**"', function () {

    it('Should detect a "live function **" declaration.', function () {
        const { body: [functionAST] } = Parser.parse(`function ** name() {}`, parserParams);
        expect(functionAST.type).to.equal('FunctionDeclaration');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect an "async function **" declaration.', function () {
        const { body: [functionAST] } = Parser.parse(`async function ** name() {}`, parserParams);
        expect(functionAST.type).to.equal('FunctionDeclaration');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "x = function **" expression - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = function ** name() {}`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = function ** () {}`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "x = async function" expression - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: functionAST1 } }] } = Parser.parse(`x = async function ** name() {}`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: functionAST2 } }] } = Parser.parse(`x = async function ** () {}`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "object method" syntax using "**"', function () {

    it('Should detect a "live" method.', function () {
        const { body: [{ expression: { right: { properties: [{ value: functionAST }] } } }] } = Parser.parse(`o = { ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "async live" method.', function () {
        const { body: [{ expression: { right: { properties: [{ value: functionAST }] } } }] } = Parser.parse(`o = { async ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "prop: function **" property - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { properties: [{ value: functionAST1 }] } } }] } = Parser.parse(`o = { prop: function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { properties: [{ value: functionAST2 }] } } }] } = Parser.parse(`o = { prop: function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "prop: async function **" property - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { properties: [{ value: functionAST1 }] } } }] } = Parser.parse(`o = { prop: async function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { properties: [{ value: functionAST2 }] } } }] } = Parser.parse(`o = { prop: async function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "class method" syntax using "**"', function () {

    it('Should detect a "live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "async live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { async ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "prop = function **" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { prop = function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { prop = function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "prop = async function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { prop = async function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { prop = async function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});

describe('Live "static class method" syntax using "**"', function () {

    it('Should detect a "static live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { static ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "static async live" class method.', function () {
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST }] } } } }] } = Parser.parse(`o = class { static async ** name() {} }`, parserParams);
        expect(functionAST.type).to.equal('FunctionExpression');
        expect(functionAST.async).to.be.true;
        expect(functionAST.isLiveFunction).to.be.true;
    });

    it('Should detect a "static prop = function **" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { static prop = function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { static prop = function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.isLiveFunction).to.be.true;
    });

    it('Should detect an "static prop = async function" class member - named and unnamed.', function () {
        // Named
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST1 }] } } } }] } = Parser.parse(`o = class { static prop = async function ** name() {} }`, parserParams);
        expect(functionAST1.type).to.equal('FunctionExpression');
        expect(functionAST1.async).to.be.true;
        expect(functionAST1.isLiveFunction).to.be.true;
        // Annonymous
        const { body: [{ expression: { right: { body: { body: [{ value: functionAST2 }] } } } }] } = Parser.parse(`o = class { static prop = async function ** () {} }`, parserParams);
        expect(functionAST2.type).to.equal('FunctionExpression');
        expect(functionAST2.async).to.be.true;
        expect(functionAST2.isLiveFunction).to.be.true;
    });

});








describe('Basic execution', function () {

    it('Should take simple parameters and return the sum.', async function () {
        // LiveFunction
        const exec = AsyncLiveFunction(`a`, `b`, `
            return a + b;
        `);

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        const state = await exec(10, 5);
        expect(state.value).to.equal(15);
    });

    it('Should handle batched mutations in one event loop.', async function () {
        // Environment
        const env = { log: [], vars: { c: 'c', d: 'd' } };

        // LiveFunction
        const exec = LiveFunction(`
            let { c, d } = vars;
            log.push( 'Value of "c": ' + c );
            log.push( 'Value of "d": ' + d );
            log.push( 'Value of both "c" and "d": ' + c + ' ' + d );
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        exec();
        expect(env.log.length).to.equal(3);

        env.log.splice(0); // Clear
        Observer.set(env.vars, {
            c: 'new "c"',
            d: 'new "d"',
        });
        expect(env.log.length).to.equal(3);
        expect(env.log[2]).to.equal('Value of both "c" and "d": new "c" new "d"');
    });

});

describe('Internal autoruns and nesting', function () {

    it('Should execute nested "autorun" only once when both nested and parent depend on the same update.', function () {
        // Environment
        const env = { log: [], state: 'initial value' };

        // LiveFunction
        const exec = LiveFunction(`
            if ( state ) /* Outer; depends on state */ {
                log.unshift( state ); // Inner; depends on state
            }
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        exec();
        expect(env.log.length).to.equal(1);
        expect(env.log[0]).to.equal('initial value');

        // Change state for both inner and outer
        Observer.set(env, 'state', 'new value');
        expect(env.log.length).to.equal(2);
        expect(env.log[0]).to.equal('new value');
    });

    it('Should execute nested "function" only once when both nested and parent depend on the same update.', function () {
        // Environment
        const env = { log: [], state: 'initial value' };

        // LiveFunction
        const exec = LiveFunction(`
            function ** nested() {
                log.unshift( state ); // Inner; depends on state
            }
            nested( state ); // Outer; depends on state
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        exec();
        expect(env.log.length).to.equal(1);
        expect(env.log[0]).to.equal('initial value');

        // Change state for both nested and outer
        env.log.splice(0);
        Observer.set(env, 'state', 'new value');
        expect(env.log.length).to.equal(1);
        expect(env.log[0]).to.equal('new value');
    });

});

describe('Classes', function () {

    it('Should handle classes.', async function () {
        // Environment
        const env = { log: [], globalVar: 'some value' };

        // LiveFunction
        const script = new LiveScript(`
            let a = class {};
            class b extends a {
                prop = 10;
                static async ** method() {}
                **['method']( param ) {
                    //console.log( '-------------', b.method.toString() );
                    log.push( 'Inner statement; ' + globalVar + '; ' + this.prop + '; ' + param );
                }
            }

            let bInstance = new b;
            bInstance.method( globalVar ? 100 : 100 );
            log.push( 'Outer statement; ' + globalVar );
            bInstance.method( 10 );
        
            setTimeout( function() {
                globalVar = 'New globalVar';
            }, 0);
        `, { env });

        //console.log( '----------------', script.toString( true ) );
        // Initial execution
        script.execute();
        expect(env.log).to.eql([
            'Inner statement; some value; 10; 100',
            'Outer statement; some value',
            'Inner statement; some value; 10; 10'
        ]);

        env.log.splice(0);
        await promise(10);
        expect(env.log).to.eql([
            'Inner statement; New globalVar; 10; 100',
            'Outer statement; New globalVar',
            'Inner statement; New globalVar; 10; 10'
        ]);
    });

});

describe('Examples', function () {

    it('[URL Object] Should satisfy the interdependent states in a custom URL implementation.', function () {
        // A Custom URL class
        const URL2 = class {

            constructor(href) {
                this.href = href;
                this.state = this.render();
            }

            render = LiveFunction(`
                // Properties from direct parsing...
                let { protocol, hostname, port, pathname, search, hash } = new URL(this.href);
                
                this.protocol = protocol;
                this.hostname = hostname;
                this.port = port;
                this.pathname = pathname;
                this.search = search;
                this.hash = hash;
                
                // Properties from computations... 
                this.host = this.hostname + (this.port ? ':' + this.port : '');
                this.origin = this.protocol + '//' + this.host;
                let href = this.origin + this.pathname + this.search + this.hash;
            
                if ( href !== this.href ) {
                    // New href assignment, but fortunately, which doesn't trigger the first line
                    // TIP: effects don't flow up the scope, but down the scope
                    this.href = href;
                }
            `);
        };

        // Initial execution
        const url = new URL2('http://example.com');
        //console.log( '----------------', url.render.toString( true ) );
        expect(url.href).to.equal('http://example.com/');

        // Change property and therefore the href
        Observer.set(url, 'pathname', '/eg/path');
        expect(url.href).to.equal('http://example.com/eg/path');

        // Change property and therefore the href
        Observer.set(url, 'protocol', 'https:');
        expect(url.href).to.equal('https://example.com/eg/path');

        // Change href and therefore other properties
        Observer.set(url, 'href', 'http://google.com/apps/meta');
        expect(url.protocol).to.equal('http:');
    });

});

describe('Early returns', function () {

    it('Should execute rest code when the conditions for a return change.', function () {
        // Environment
        const env = { log: [], condition: true };

        // LiveFunction
        const exec = LiveFunction(`
            let counter = 0;
            if ( condition ) {
                log.unshift( 'inner code' );
                return counter ++;
            }
            log.unshift( 'rest code' );
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        const state = exec();
        expect(env.log.length).to.equal(1);
        expect(env.log[0]).to.equal('inner code');
        expect(state.value).to.equal(0);

        // Change condition and therefore run rest code
        Observer.set(env, 'condition', false);
        expect(env.log.length).to.equal(2);
        expect(env.log[0]).to.equal('rest code');

        // Change condition and therefore run inner code
        Observer.set(env, 'condition', true);
        expect(env.log.length).to.equal(3);
        expect(env.log[0]).to.equal('inner code');
        expect(state.value).to.equal(1);

        // Change condition and therefore run rest code
        Observer.set(env, 'condition', false);
        expect(env.log.length).to.equal(4);
        expect(env.log[0]).to.equal('rest code');
    });

});

describe('Loop flow control', function () {

    it('Should observe "break", "continue" directives.', function () {
        // Environment
        const env = { log: [], breakpoint: 'two', loops: { inner: ['one', 'two', (3000, 'three'), 'four'] } };

        // LiveFunction
        const exec = LiveFunction(`
        for ( let value of loops.inner ) {
            if ( typeof value === 'undefined' ) {
                log.push( 'deleted: ' + value );
                continue;
            }
            log.push( 'current: ' + value );
            if ( value === breakpoint ) {
                log.push( 'breaking at: ' + value );
                break;
            }
            log.push( 'end of: ' + value );
        }
        log.push( 'end of loop!');
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        exec();
        expect(env.log).to.eql([
            'current: one',
            'end of: one',
            'current: two',
            'breaking at: two',
            'end of loop!'
        ]);

        // Move breakpoint forward
        env.log.splice(0);
        Observer.set(env, 'breakpoint', 'three');
        expect(env.log).to.eql([
            'end of: two',
            'current: three',
            'breaking at: three'
        ]);

        // Move breakpoint forward
        env.log.splice(0);
        Observer.set(env, 'breakpoint', 'four');
        expect(env.log).to.eql([
            'end of: three',
            'current: four',
            'breaking at: four'
        ]);

        // Move breakpoint backward
        env.log.splice(0);
        Observer.set(env, 'breakpoint', 'two');
        expect(env.log).to.eql([
            'breaking at: two'
        ]);

        const items1 = env.loops.inner;

        // Change item 1
        env.log.splice(0);
        Observer.set(items1, 0, 'new one');
        expect(env.log).to.eql([
            'current: new one',
            'end of: new one'
        ]);

        // Add fifth item
        env.log.splice(0);
        Observer.proxy(items1).push('five');
        expect(env.log).to.eql([]); // Being that loop had broken at "two"

        // Add sixth item
        env.log.splice(0);
        Observer.proxy(items1).push('six');
        expect(env.log).to.eql([]); // Being that loop had broken at "two"

        // Add seventh item
        env.log.splice(0);
        Observer.proxy(items1).push('seven');
        expect(env.log).to.eql([]); // Being that loop had broken at "two"

        // Move breakpoint forward
        env.log.splice(0);
        Observer.set(env, 'breakpoint', 'seven');
        expect(env.log).to.eql([
            'end of: two', // Resuming from where it broke
            'current: three',
            'end of: three',
            'current: four',
            'end of: four',
            'current: five',
            'end of: five',
            'current: six',
            'end of: six',
            'current: seven',
            'breaking at: seven'
        ]);

        const items2 = ['new one', 'new two', 'new three'];

        // Render new items altogether
        env.log.splice(0);
        Observer.set(env.loops, 'inner', items2);
        expect(env.log).to.eql([
            'current: new one',
            'end of: new one',
            'current: new two',
            'end of: new two',
            'current: new three',
            'end of: new three'
        ]);

        // Ensure loop isn't anymore bound to previous items
        env.log.splice(0);
        Observer.set(items1, 5, 'new six');
        expect(env.log).to.eql([]);

        // Test deletion
        env.log.splice(0);
        Observer.deleteProperty(items2, 1);
        expect(env.log).to.eql([
            'deleted: undefined'
        ]);

        // Restore deleted
        env.log.splice(0);
        Observer.set(items2, 1, 'brand new two');
        expect(env.log).to.eql([
            'current: brand new two',
            'end of: brand new two'
        ]);
    });

    it('Should observe "break", "continue" with "unkeyed" loops.', function () {
        // Environment
        const env = { log: [], breakpoint: 'two', loops: { inner: ['one', 'two', (3000, 'three'), 'four'] } };

        // LiveFunction
        const exec = LiveFunction(`
        for ( let i = 0; i < loops.inner.length; i ++ ) {
            log.push( 'current value: ' + i + '--' + loops.inner[ i ] );
            continue;
        }
        log.push( 'end of loop!');
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
    });

});

describe('Early returns and Loop flow control', function () {

    it('Should observe "break", "continue", and "return" directives.', function () {
        // Environment
        const env = { log: [], condition1: true, condition2: true, factor: 4, loops: { outer: { one: 1, two: 2, three: 3 }, inner: ['one', 'two', 'three'] } };

        // LiveFunction
        const exec = LiveFunction('a', 'b', `
            if ( !condition1 ) {
                log.push( '"condition1" isnt true anymore. exiting.' );
                return 'First return';
            }
            
            log.push( 'First "return" point fails through.' );
            
            if ( true ) {
                if ( true ) {
                if ( !condition2 ) {
                    log.push( '"condition2" isnt true anymore. exiting.' );
                    return 'Second return';
                }
                }
            }
            
            log.push( 'Second "return" point fails through.' );
            
            outer: for ( let key in loops.outer ) {
                for ( let val of loops.inner ) {
                    log.push( 'Outer: ' + key + '; Inner: ' + val );
                    if ( val === 'two' ) {
                        log.push( 'Breaking inner' );
                        break;
                    }
                    if ( key === 'two' ) {
                        log.push( 'Breaking outer' );
                        break outer;
                    }
                    continue;
                    doMore(); // Expected to be ognored
                }
            }
            
            log.push( 'Third "return" point fails through.' );
            
            log.push('Total: ' + ( a + b + factor ) );
            return a + b + factor;
        `, { env });

        //console.log( '----------------', exec.toString( true ) );
        // Initial execution
        const state = exec(4, 5);
        expect(state.value).to.eq(13);
        expect(env.log).to.eql([
            'First "return" point fails through.',
            'Second "return" point fails through.',
            'Outer: one; Inner: one',
            'Outer: one; Inner: two',
            'Breaking inner',
            'Outer: two; Inner: one',
            'Breaking outer',
            'Third "return" point fails through.',
            'Total: 13'
        ]);

        // Change conditions
        env.log.splice(0);
        Observer.set(env, 'condition1', false);
        Observer.set(env, 'condition2', false);
        Observer.set(env, 'factor', 10);
        expect(env.log).to.eql(['"condition1" isnt true anymore. exiting.']);

        // Change conditions
        env.log.splice(0);
        Observer.set(env, 'condition1', true);
        expect(env.log).to.eql([
            'First "return" point fails through.',
            '"condition2" isnt true anymore. exiting.'
        ]);

        // Change conditions
        env.log.splice(0);
        Observer.set(env, 'condition2', true);
        expect(state.value).to.eq(19);
        expect(env.log).to.eql([
            'Second "return" point fails through.',
            'Outer: one; Inner: one',
            'Outer: one; Inner: two',
            'Breaking inner',
            'Outer: two; Inner: one',
            'Breaking outer',
            'Third "return" point fails through.',
            'Total: 19'
        ]);

        // Change conditions
        env.log.splice(0);
        Observer.set(env, 'condition2', false);
        Observer.set(env, 'factor', 20);
        expect(env.log).to.eql(['"condition2" isnt true anymore. exiting.']);

        // Change conditions
        env.log.splice(0);
        Observer.set(env, 'condition2', true);
        expect(state.value).to.eq(29);
        expect(env.log).to.eql([
            'Second "return" point fails through.',
            'Outer: one; Inner: one',
            'Outer: one; Inner: two',
            'Breaking inner',
            'Outer: two; Inner: one',
            'Breaking outer',
            'Third "return" point fails through.',
            'Total: 29'
        ]);

        // Change a round
        env.log.splice(0);
        Observer.set(env.loops.inner, 0, 'new "one"');
        expect(state.value).to.eq(29);
        expect(env.log).to.eql([
            'Outer: one; Inner: new "one"',
            'Outer: two; Inner: new "one"'
        ]);
    });

});

describe('Module imports/exports', function () {

    it('Should handle exports.', async function () {
        // Environment
        const env = { log: [] };

        // LiveFunction
        const script = new LiveModule(`
            export const { p__p, oo_oo, ll: { t_ } = {} } = { p__p: 'p__p value', oo_oo: 'oo_oo value', ll: { t_: 't_ value' } };
            export let { dd, www } = 3;
            let wwwww;
            export { wwwww, www as yyyyyy };
            //export default eeeeel;
            export default function tttttt() {};
            export function ttfffftttt() {};

            log.push( 'Imports/Exports done!' );
        `, { env });

        console.log('----------------', script.toString(true));
        // Initial execution
        const state = await script.execute();
        expect(env.log).to.eql([
            'Imports/Exports done!'
        ]);
        expect(state.exports).to.eql({
            p__p: 'p__p value',
            oo_oo: 'oo_oo value',
            t_: 't_ value',
            dd: undefined,
            www: undefined,
            wwwww: undefined,
            yyyyyy: undefined,
            default: state.exports.default,
            ttfffftttt: state.exports.ttfffftttt
        });
    });

    it('Should handle local (hot) imports.', async function () {
        // Environment
        const env = { log: [] };

        // LiveFunction
        const script1 = new LiveModule(`
            let counter1 = 0;
            export default counter1;
            export let counter2 = 0;
            setInterval( () => {
                counter1 ++;
                counter2 += 2;
            }, 500 );
        `, { exportNamespace: '#counter', env });

        //console.log( '----------------', script1.toString( true ) );
        // Initial execution1
        const state1 = await script1.execute();
        expect(state1.exports).to.eql({
            default: 0,
            counter2: 0
        });

        // LiveFunction
        const script2 = new LiveModule(`
            import counter1, { counter2 } from '#counter';
            export { counter2, default as counter1 } from '#counter';
            export * as counter from '#counter';
            log.push( 'Counter1: ' + counter1 );
            log.push( 'Counter2: ' + counter2 );
        `, { env });

        //console.log( '----------------', script2.toString( true ) );
        // Initial execution2
        const state2 = await script2.execute();
        expect(state2.exports).to.eql({
            counter2: 0,
            counter1: 0,
            counter: {
                default: 0,
                counter2: 0
            }
        });

        // Show countings
        await promise(1010);
        expect(env.log).to.eql([
            'Counter1: 0',
            'Counter2: 0',
            'Counter1: 1',
            'Counter2: 2',
            'Counter1: 2',
            'Counter2: 4'
        ]);
    });

    it('Should handle external imports.', async function () {
        // Environment
        const env = { log: [] };

        // LiveFunction
        const script = new LiveModule(`
            import Observer from '@webqit/observer';
            log.push( Observer );
        `, { env });

        //console.log( '----------------', script.toString( true ) );
        // Initial execution
        const state = await script.execute();
        //console.log( env.log );
        //expect( env.log ).to.eql( [] );
    });

});
