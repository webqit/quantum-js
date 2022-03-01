
/**
 * @imports
 */
import { group, add } from './driver.js';

/**
 * Note that the format of the code block in the "expected" argument
 * is: 4 spaces as indentation. The AST compiler has been configured for same 4 spaces as indentation.
 * But "startingIndentLevel" can be anything as this is automatically detected and applied accordingly
 * on the AST compiler. Also, both strings are ".trim()" before comparison.
 * @see ./driver.js
 */

describe(`Variable declarations`, function() {

    group(`Maintain the declaration of variables that have "unobservable" initializers.`, function() {

        add(
            `Ordinary "Identifier" initializers (e.g var a = b;) are not "observable".`,
            `
            var a = b;
            `,
            `
            var a = b;
            `
        );

        add(
            `"const" kind of declarations (e.g const a = b.c;) are not "observable".`,
            `
            const a = b.c;
            `,
            `
            const a = b.c;
            `
        );

    });

    group(`Refactor and observe around the declaration of variables that have "observable" initializers.`, function() {

        add(
            `"MemberExpression" initializers (e.g var a = b.c;) are "observable".`,
            `
            var a = b.c;
            `,
            `
            var a;
            $("var#1", [["b", "c"]], () => {
                a = b.c;
            });
            `
        );

        add(
            `In a multi-var declaration (e.g let a = b, c = d.e, f = g;), observable declarations are singled out into a new line for observability.`,
            `
            let a = b, c = d.e, f = g;
            `,
            `
            let a = b, c, f = g;
            $("let#1", [["d", "e"]], () => {
                c = d.e;
            });
            `
        );

    });

});

describe(`Assignment expressions`, function() {

    group(`Maintain assignment expressions that have "unobservable" right-hand side.`, function() {

        add(
            `Ordinary "Identifier" right-hand sides (e.g a = b;) are not "observable".`,
            `
            a = b;
            `,
            `
            a = b;
            `
        );

    });

    group(`Refactor and observe around assignment expressions that have "observable" right-hand side.`, function() {

        add(
            `"MemberExpression" right-hand sides (e.g a = b.c;) are "observable".`,
            `
            a = b.c;
            `,
            `
            $("assign-global#1", [["b", "c"]], () => {
                a = b.c;
            });
            `
        );

        add(
            `In a sequence expression (e.g a = b, c = d.e, f = g;), assignment expressions with observable right-hand side are singled out into a new line for observability.`,
            `
            a = b, c = d.e, f = g;
            `,
            `
            (a = b, $("assign-global#1", [["d", "e"]], () => c = d.e), f = g);
            `
        );

    });

});