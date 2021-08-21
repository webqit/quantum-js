  
/**
 * @imports
 */
import { expect } from 'chai';
import { Parser } from '../src/index.js';
import { Block } from '../src/grammar.js';

describe(`Test: AST`, function() {

    describe(`Object syntax`, function() {

        it(`Should parse simple object expression: { prop1: value1, prop2: "String value2", prop3: 3 }`, function() {
            var expr = `{ prop1: value1, prop2: "String value2", prop3: 3 }`;
            var AST = Parser.parse(expr);
            var VAL = AST.eval();
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eql({ prop1: undefined, prop2: 'String value2', prop3: 3 });
        });

        it(`Should parse dynamic object expression: { [prop1]: value1, "prop 2": "String value2", prop3, [prop4], 'ddd': 'ddd' }`, function() {
            var expr = `{ [prop1]: value1, "prop 2": "String value2", prop3, [prop4], 'ddd': 'ddd' }`;
            var AST = Parser.parse(expr);
            var VAL = AST.eval({ prop4: 'dynamicProp' });
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eql({ undefined: undefined, 'prop 2': 'String value2', prop3: undefined, dynamicProp: 'dynamicProp', ddd: 'ddd' });
        });

    });

    describe(`Abstraction () syntax`, function() {

        it(`Should parse simple abstraction expression: (4 + 10)`, function() {
            var expr = `(4 + 10)`;
            var AST = Parser.parse(expr);
            var VAL = AST.eval();
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eql(14);
        });

        it(`Should parse multiple statement abstraction expression: (4 + 10, 555 + 1)`, function() {
            var expr = `(4 + 10, 555 + 1)`;
            var AST = Parser.parse(expr);
            var VAL = AST.eval();
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eql(556);
        });
    });

    describe(`Assignment syntax`, function() {

        it(`Should parse simple assignment expression: aa = 4 + 10`, function() {
            var expr = `aa = 4 + 10`;
            var AST = Parser.parse(expr);
            var CONTEXT = { aa: 0 };
            var VAL = AST.eval(CONTEXT, {strictMode: false});
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eq(14);
            expect(CONTEXT).to.eql({ aa: 14 });
        });

        it(`Should parse path assignment expression: bb.rr = 4 + 10`, function() {
            var expr = `bb.rr = 4 + 10`;
            var AST = Parser.parse(expr);
            var CONTEXT = { bb: {} };
            var VAL = AST.eval(CONTEXT);
            expect(AST + '').to.eq(expr);
            expect(VAL).to.eq(14);
            expect(CONTEXT).to.eql({ bb: { rr: 14 } });
        });

    });

    describe(`Variable decalarations syntax`, function() {

        it(`Should parse simple variable decalaration: var aa = 4 + 10`, function() {
            var expr = `var aa = 4 + 10`;
            var AST = Parser.parse(expr);
            var SCOPEOBJ = {};
            var CONTEXT = {};
            var VAL = AST.eval(CONTEXT, { scopeObj: SCOPEOBJ });
            expect(SCOPEOBJ.local).to.eql({ aa: 14 });
        });

        it(`Should parse multiple variable decalarations: var aa = 4 + 10, bb = 2, cc, dd = 3, ee`, function() {
            var expr = `var aa = 4 + 10, bb = 2, cc, dd = 3, ee`;
            var AST = Parser.parse(expr);
            var SCOPEOBJ = {};
            var CONTEXT = {};
            var VAL = AST.eval(CONTEXT, { scopeObj: SCOPEOBJ });
            expect(SCOPEOBJ.local).to.eql({ aa: 14, bb: 2, cc: undefined, dd: 3, ee: undefined });
        });
    });

    describe(`Statement block syntax`, function() {

        it(`Should parse simple statement block: var aa = 4 + 10; console.log(aa);`, function() {
            var expr = `var aa = 4 + 10; console.log(aa);`;
            var AST = Parser.parse(expr, [ Block ]);
            var SCOPEOBJ = {};
            var CONTEXT = {};
            var VAL = AST.eval(CONTEXT, { scopeObj: SCOPEOBJ });
            expect(SCOPEOBJ.local).to.eql({ aa: 14 });
        });

        it(`Should parse complex statement block: var aa = 4 + 10, bb = 2, cc, dd = 3, ee = (b, 20); if (w) {} console.log(aa), console.log(bb);`, function() {
            var expr = `var aa = 4 + 10, bb = 2, cc, dd = 3, ee = (b, 20); if (w) {} console.log(aa)\r\n console.log(bb);`;
            var AST = Parser.parse(expr, [ Block ]);
            var SCOPEOBJ = {};
            var CONTEXT = {};
            var VAL = AST.eval(CONTEXT, { scopeObj: SCOPEOBJ });
            expect(SCOPEOBJ.local).to.eql({ aa: 14, bb: 2, cc: undefined, dd: 3, ee: 20 });
        });
    });

});