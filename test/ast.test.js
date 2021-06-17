  
/**
 * @imports
 */
import { expect } from 'chai';

describe(`SELECT QUERIES`, function() {

    before('Import into DB', async function() {
        await Client.import('db1', {schema: SCHEMA, data: DATA}, 'drop'/* onExists */);
    });

    var ast1, expr1 = `SELECT aaaa, bbbbb FROM (SELECT age as aaaa, time2 as bbbbb FROM table2 as t2) ta`;
    describe(`${expr1}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast1 = Parser.parse(expr1, null, {DB_FACTORY: Client, explain: false});
            expect(ast1.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr1.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be: 3`, async function() {
            var result = await ast1.eval(Client);
            expect(result).to.be.an('array').that.have.lengthOf(3);
            expect(result[0]).to.be.an('object').that.have.keys('aaaa', 'bbbbb');
        });

    });

    var ast2, expr2 = `SELECT COUNT(*) FROM db1.table2`;
    describe(`${expr2}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast2 = Parser.parse(expr2, null, {DB_FACTORY: Client, explain: false});
            expect(ast2.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr2.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 3: [ { 'COUNT(*)': 3 } ]`, async function() {
            var result = await ast2.eval(Client);
            expect(result).to.be.an('array').that.eql([ { 'COUNT(*)': 3 } ]);
        });

    });

    var ast3, expr3 = `SELECT COUNT(parent) FROM db1.table2`;
    describe(`${expr3}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast3 = Parser.parse(expr3, null, {DB_FACTORY: Client, explain: false});
            expect(ast3.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr3.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be ONLY 2: [ { 'COUNT(parent)': 2 } ]`, async function() {
            var result = await ast3.eval(Client);
            expect(result).to.be.an('array').that.eql([ { 'COUNT(parent)': 2 } ]);
        });

    });

    var ast4, expr4 = `SELECT t2.age, ANY_VALUE(t2.age), SUM(t2.age) total, IF (GROUPING(t2.age), "Grand Total", t1.age) age FROM table1 t1, table2 t2 GROUP BY t2.age WITH ROLLUP`;
    describe(`${expr4}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast4 = Parser.parse(expr4, null, {DB_FACTORY: Client, explain: false});
            expect(ast4.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr4.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 3 + 1 (with the ROLLUP row having: { age: 'Grand Total', total: 216 })`, async function() {
            var result = await ast4.eval(Client);
            expect(result).to.be.an('array').with.lengthOf(4);
            expect(result[3]).to.have.property('age', 'Grand Total');
            expect(result[3]).to.have.property('total', 216);
        });

    });

    var ast5, expr5 = `SELECT ALL t1.age, t1.fname, t1.lname, CONCAT_WS(" ", t1.fname, t1.lname) as fullname, t2.lname lname2 FROM table1 t1, table2 t2 WHERE t1.age > 1 ORDER BY lname DESC, lname2 DESC`;
    describe(`${expr5}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast5 = Parser.parse(expr5, null, {DB_FACTORY: Client, explain: false});
            expect(ast5.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr5.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 9 and in the correct order`, async function() {
            var result = await ast5.eval(Client);
            expect(result).to.be.an('array').with.lengthOf(9);
            result.reduce((prev, current) => {
                if (prev) {
                    expect((prev.lname > current.lname) || (prev.lname === current.lname && prev.lname2 >= current.lname2)).to.be.true;
                }
                return current;
            }, null);
        });

    });

    var ast6, expr6 = `SELECT t1.age, SUM(DISTINCT t1.age) OVER (PARTITION BY t2.tablename ORDER BY t2.tablename) totalAge, t1.fname, t2.lname FROM table1 t1, table2 t2`;
    describe(`${expr6}`, function() {

        it(`"parse()" the expression and stringify to compare with original`, function() {
            ast6 = Parser.parse(expr6, null, {DB_FACTORY: Client, explain: false});
            expect(ast6.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr6.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 6 and in the correct order`, async function() {
            var result = await ast6.eval(Client);
            expect(result).to.be.an('array').with.lengthOf(9);
            expect(result.reduce((prev, current) => prev.totalAge === current.totalAge ? current : 0, {totalAge: 133})).to.have.property('totalAge', 133);
        });

    });

    var ast7, expr7 = `SELECT t2.id, t2.age, \`parent~>id\` FROM table2 t2 WHERE parent~>id = 1 or parent~>id = 2`,
        expr7b = `SELECT t2.id, t2.age, \`parent~>id\` FROM table2 t2 WHERE \`parent~>id\` = 1 or \`parent~>id\` = 2`;
    describe(`${expr7}`, function() {

        it(`"parse()" the expression and stringify to compare with original but with missing backticks added`, function() {
            ast7 = Parser.parse(expr7, null, {DB_FACTORY: Client, explain: false});
            expect(ast7.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr7b.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 2 and the "parent~>id" field to be 1 and 2 respectively`, async function() {
            var result = await ast7.eval(Client);
            expect(result).to.be.an('array').with.lengthOf(2);
            expect(result[0]).to.have.property('parent~>id', 1);
            expect(result[1]).to.have.property('parent~>id', 2);
        });

    });

    var ast8, expr8 = `SELECT t2.id, parent~>id, parent~>parent~>id, parent<~table2~>id, parent<~parent<~table2~>id FROM table2 t2`,
        expr8b = `SELECT t2.id, \`parent~>id\`, \`parent~>parent~>id\`, \`parent<~table2~>id\`, \`parent<~parent<~table2~>id\` FROM table2 t2`;
    describe(`${expr8}`, function() {

        it(`"parse()" the expression and stringify to compare with original but with missing backticks added`, function() {
            ast8 = Parser.parse(expr8, null, {DB_FACTORY: Client, explain: false});
            expect(ast8.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr8b.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 3 and the "parent~>id" field of each to equal the "id" field of the previous`, async function() {
            var result = await ast8.eval(Client);
            expect(result).to.be.an('array').with.lengthOf(3);
            result.reduce((prev, current) => {
                if (prev) {
                    expect(current['parent~>id']).to.equal(prev.id);
                }
                return current;
            });
        });

    });

    var ast9, expr9 = `SELECT t2.id, t2.parent~>id, age FROM table2 t2 where t2.age = :age`,
        expr9b = `SELECT t2.id, t2.\`parent~>id\`, age FROM table2 t2 where t2.age = :age`;
    describe(`${expr9}`, function() {

        it(`"parse()" the expression and stringify to compare with original but with missing backticks added`, function() {
            ast9 = Parser.parse(expr9, null, {DB_FACTORY: Client, explain: false});
            expect(ast9.stringify({interpreted:false}).toLowerCase()).to.be.equal(expr9b.toLowerCase());
        });

        it(`"eval()" the expression and expect number of rows to be 1: { id: 3, 'parent~>id': 2, age: 30 }`, async function() {
            var result = await ast9.eval(Client, {vars:{age:30}});
            expect(result).to.be.an('array').with.lengthOf(1);
            expect(result[0]).to.eql({ id: 3, 'parent~>id': 2, age: 30 });
        });

    });

});