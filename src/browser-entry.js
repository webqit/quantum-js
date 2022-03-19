
/**
 * @imports
 */
import SubscriptFunction from './SubscriptFunction.js';
import { Mixin as SubscriptClass } from './SubscriptClass.js';

// As globals
if (!window.WebQit) {
	window.WebQit = {};
}
window.WebQit.Subscript = { SubscriptFunction, SubscriptClass };
