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
export function referencesToPaths(references) {
    return references.map(expr => {
        var seg = expr, pathArray = [];
        pathArray.dotSafe = true;
        do {
            if (seg instanceof CallInterface) {
                pathArray.splice(0);
                seg = seg.reference;
            }
            if (_isString(seg.name)) {
                pathArray.unshift(seg.name);
                pathArray.dotSafe = pathArray.dotSafe && !seg.name.includes('.');
            } else if (seg.name instanceof NumInterface) {
                pathArray.unshift(seg.name.int);
                pathArray.dotSafe = pathArray.dotSafe && !(seg.name.int + '').includes('.');
            } else if (seg.name instanceof StrInterface) {
                pathArray.unshift(seg.name.expr);
                pathArray.dotSafe = pathArray.dotSafe && !seg.name.expr.includes('.');
            } else {
                pathArray.splice(0);
            }
        } while(seg = seg.context);
        if (pathArray.dotSafe) {
            return (new DotSafePath).concat(pathArray);
        }
        return pathArray;
    });
}
export class DotSafePath extends Array {
	static resolve(path) {
		// Note the concat() below...
		// the spread operator: new DotSafePath(...path) doesn't work when path is [0].
		return path.every(v => !(v + '').includes('.')) ? (new DotSafePath).concat(path) : path;
	}
	get dotSafe() { return true }
}