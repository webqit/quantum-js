
/**
 * @imports
 */
import { group, add } from './driver.js';

/**
 * The add() methods below decribe what the Subscript compiler would take and generate, respectively.
 * A quick way to see compiler results for an expression/statement is via ./_.js
 * @see ./_.js
 */

describe( `Variable declarations`, function() {

    group( `Form NO reactive units for non-reactive declarations.`, function() {

        add(
            `Uninitialized variables form NO reactive unit.`,
            `
            let a;
            `,
            `
            let a;
            `
        );

        add(
            `Variables initialized with a Literal form NO reactive unit.`,
            `
            let b = 2;
            `,
            `
            let b = 2;
            `
        );

        add(
            `Const variables form NO reactive unit.`,
            `
            const c = d;
            `,
            `
            const c = d;
            `
        );

    } );

    group( `Form reactive units for reactive declarations.`, function() {

        add(
            `Variables bound to references form a reactive unit.`,
            `
            let e = f;
            `,
            `
            let e;
            // #/2
            $x(2, $x => {
                e = f;
            });
            `
        );

        add(
            `Destructured variables bound to references form an equivalent reactive unit.`,
            `
            let { a, b, c: { d, e: [ f ] } } = g;
            `,
            `
            let a, b, d, f;
            // #/2
            $x(2, $x => {
                ({a, b, c: {d, e: [f]}} = g);
            });
            `
        );

        add(
            `Variables in a multi-var declaration are treated individually.`,
            `
            let a, b = 2, c = d, e = f;
            `,
            `
            let a, b = 2, c;
            // #/8
            $x(8, $x => {
                c = d;
            });
            let e;
            // #/12
            $x(12, $x => {
                e = f;
            });
            `
        );

    } );

} );

describe( `Assignment expressions`, function() {

    group( `Form reactive units for assignments (every assignment is reactive).`, function() {

        add(
            `Assignment of a Literal forms a reactive unit.`,
            `
            b = 2;
            `,
            `
            // #/2
            $x(2, $x => {
                b = 2;
            });
            `
        );

        add(
            `assignments bound to references forms a reactive unit.`,
            `
            e = f;
            `,
            `
            // #/2
            $x(2, $x => {
                e = f;
            });
            `
        );

        add(
            `Assignments in a sequence are treated individually.`,
            `
            (a, b = 2, c = d, e = f);
            `,
            `
            (a, $x(5, $x => b = 2), $x(9, $x => c = d), $x(14, $x => e = f));
            `
        );

    } );

} );

describe( `IF statements`, function() {

    group( `Form NO reactive units for non-reactive "test" expressions.`, function() {

        add(
            `Literals as "test" expressions are non-reactive. But "test" expression is memoized nontheless.`,
            // Memoized "test" expressions serve as signal-control mechanisms at runtime for descendant expressions.
            `
            if (2) {
            }
            `,
            `
            if ($x.memo[4] = 2) {
            }
            `
        );

        add(
            `Descendant expressions/statements may form their own units.`,
            `
            if ( 1 ) {
                call();
            }
            `,
            `
            if ($x.memo[4] = 1) {
                // #/7
                $x(7, $x => {
                  call();
                });
            }
            `
        );

        add(
            `Nested non-reactive IF statements work the same.`,
            `
            if ( 2 ) {
            } else if ( 3 ) {
            }
            `,
            `
            if ($x.memo[4] = 2) {
            } else if ($x.memo[10] = 3) {
            }
            `
        );

    } );

    group( `Form reactive units for reactive "test" expressions.`, function() {

        add(
            `"test" expressions with references are reactive. And they're always memoized.`,
            `
            if (a) {
            }
            `,
            `
            // #/2
            $x(2, $x => {
                if ($x.memo[5] = a) {
                }
            });
            `
        );

        add(
            `Nested reactive IF statements work the same.`,
            `
            if ( b ) {
            } else if ( c ) {
            }
            `,
            `
            // #/2
            $x(2, $x => {
                if ($x.memo[5] = b) {
                } else $x(9, $x => {
                    if ($x.memo[12] = c) {
                    }
                });
            });
            `
        );

        add(
            `Any of the branches may choose to be reactive or non-reactive.`,
            `
            if ( 1 ) {
            } else if ( c ) {
            }
            `,
            `
            if ($x.memo[4] = 1) {
            } else $x(8, $x => {
                if ($x.memo[11] = c) {
                }
            });
            `
        );

    } );
    
});

describe( `SWITCH statements`, function() {

    group( `Form NO reactive units for non-reactive "discriminant" expressions.`, function() {

        add(
            `Literals as "discriminant" expressions are non-reactive. But "discriminant" expression is memoized nontheless.`,
            // Memoized "discriminant" expressions serve as signal-control mechanisms at runtime for descendant expressions.
            `
            switch (2) {
            }
            `,
            `
            switch ($x.memo[4] = 2) {
            }
            `
        );

        add(
            `Literals as "test" expressions in cases are non-reactive. But "test" expression is memoized nontheless.`,
            `
            switch ( 1 ) {
                case 2:
                    break;
            }
            `,
            `
            switch ($x.memo[4] = 1) {
                case $x.memo[7] = 2:
                    break;
            }
            `
        );

        add(
            `Descendant expressions/statements may form their own units.`,
            `
            switch ( 1 ) {
                case 2:
                    call();
                    break;
            }
            `,
            `
            switch ($x.memo[4] = 1) {
                case $x.memo[7] = 2:
                    // #/9
                    $x(9, $x => {
                        call();
                    });
                    break;
            }
            `
        );

    } );

    group( `Form reactive units for reactive "discriminant" expressions.`, function() {

        add(
            `"discriminant" expressions with references are reactive. And they're always memoized.`,
            `
            switch (a) {
            }
            `,
            `
            // #/2
            $x(2, $x => {
                switch ($x.memo[5] = a) {
                }
            });
            `
        );

        add(
            `"test" expressions with references are reactive. And they're always memoized.`,
            `
            switch ( b ) {
                case c:
                    break;
            }
            `,
            `
            // #/2
            $x(2, $x => {
                switch ($x.memo[5] = b) {
                    case $x.memo[9] = c:
                        break;
                }
            });
            `
        );

        add(
            `Any of "discriminant" and "test" may choose to be reactive or non-reactive.`,
            `
            switch ( b ) {
                case 0:
                    break;
            }
            `,
            `
            // #/2
            $x(2, $x => {
                switch ($x.memo[5] = b) {
                    case $x.memo[8] = 0:
                        break;
                }
            });
            `
        );

    } );

} );

describe( `Conditional and logical expressions`, function() {

    group( `Conditional expressions.`, function() {

        add(
            `Memoize "test" expressions.`,
            // Memoized "test" expressions serve as signal-control mechanisms at runtime for "consequent" and "alternate" expressions.
            `
            2 ? 0 : 1;
            `,
            `
            ($x.memo[5] = 2) ? 0 : 1;
            `
        );

        add(
            `Do smae for nested Conditionals.`,
            `
            2 ? 0 : ( 3 ? 0 : 1 );
            `,
            `
            ($x.memo[5] = 2) ? 0 : ($x.memo[9] = 3) ? 0 : 1;
            `
        );

        add(
            `Form a reactive unit where contains references.`,
            `
            a ? 0 : 1;
            `,
            `
            // #/2
            $x(2, $x => {
                ($x.memo[6] = a) ? 0 : 1;
            });
            `
        );

        add(
            `Reactive units are formed at statement level.`,
            `
            let b = a ? 0 : 1;
            `,
            `
            let b;
            // #/2
            $x(2, $x => {
                b = ($x.memo[6] = a) ? 0 : 1;
            });
            `
        );

    } );

    group( `Logical expressions.`, function() {

        add(
            `Memoize "left" expressions.`,
            // Memoized "left" expressions serve as signal-control mechanisms at runtime for "right" expressions.
            `
            2 && 1;
            `,
            `
            ($x.memo[4] = 2) && 1;
            `
        );

        add(
            `Do smae for nested Logic.`,
            `
            2 && 1 || 0;
            `,
            `
            ($x.memo[6] = ($x.memo[4] = 2) && 1) || 0;
            `
        );

        add(
            `Form a reactive unit where contains references.`,
            `
            a && 1;
            `,
            `
            // #/2
            $x(2, $x => {
                ($x.memo[4] = a) && 1;
            });
            `
        );

        add(
            `Reactive units are formed at statement level.`,
            `
            let b = a && 1;
            `,
            `
            let b;
            // #/2
            $x(2, $x => {
                b = ($x.memo[4] = a) && 1;
            });
            `
        );

    } );

} );

describe( `WHILE and DO ... WHILE loops`, function() {
    // Coming soon
} );

describe( `For loops`, function() {
    // Coming soon
} );

describe( `FOR ... OF loops`, function() {
    // Coming soon
} );

describe( `FOR ... IN loops`, function() {
    // Coming soon
} );

describe( `Break and continue statements`, function() {
    // Coming soon
} );

describe( `Return statements`, function() {
    // Coming soon
} );

describe( `Functions`, function() {
    // Coming soon
} );

describe( `Subscript Functions`, function() {
    // Coming soon
} );

describe( `AWAIT expressions`, function() {
    // Coming soon
} );
