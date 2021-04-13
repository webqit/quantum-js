/**
 * @imports
 */
import _isString from '@webqit/util/js/isString.js';
import CallInterface from './grammar/CallInterface.js';
import NumInterface from './grammar/NumInterface.js';
import StrInterface from './grammar/StrInterface.js';


/**
 * UTILS
 */
export function pathStartsWith(a, b) {
	return b.reduce((prev, value, i) => prev && value === a[i], true);
};
export function pathAfter(a, b) {
	return a.slice(b.length);
};
export function pathIsSame(a, b) {
	return a.length === b.length && a.reduce((prev, value, i) => prev && value === b[i], true);
};
export function referencesToPaths(references) {
    return references.map(expr => {
        var seg = expr, pathArray = [];
        do {
            if (seg instanceof CallInterface) {
                pathArray.splice(0);
                seg = seg.reference;
            }
            if (_isString(seg.name)) {
                pathArray.unshift(seg.name);
            } else if (seg.name instanceof NumInterface) {
                pathArray.unshift(seg.name.int);
            } else if (seg.name instanceof StrInterface) {
                pathArray.unshift(seg.name.expr);
            } else {
                pathArray.splice(0);
            }
        } while(seg = seg.context);
        return pathArray;
    });
};