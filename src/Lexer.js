
/**
 * @imports
 */
import _isString from '@web-native-js/commons/js/isString.js';
import _isUndefined from '@web-native-js/commons/js/isUndefined.js';
import _isFunction from '@web-native-js/commons/js/isFunction.js';
import _arrFrom from '@web-native-js/commons/arr/from.js';
import _flatten from '@web-native-js/commons/arr/flatten.js';
import _first from '@web-native-js/commons/arr/first.js';
import _last from '@web-native-js/commons/arr/last.js';
import _merge from '@web-native-js/commons/obj/merge.js';
import _even from '@web-native-js/commons/obj/even.js';
import _copyPlain from '@web-native-js/commons/obj/copyPlain.js';

/**
 * --------------------------
 * TOKENIZER
 * --------------------------
 */

const Lexer = class {

	/**
	 * Factory method.
	 *
	 * Handles caching.
	 *
	 * @see constructor()
	 */
	static lex(str, delims, options) {
		if (!_isString(str)) {
			throw new Error('Argument1 must be a string!');
		}
		// CREATE NEW -----------------------------
		var instance = new Lexer(str, options);
		// GIVE CACHE -----------------------------
		Lexer.$cache[str] = Lexer.$cache[str] || [];
		Lexer.$cache[str].push(instance);
		// RETURN NEW -----------------------------
		return instance.lex(delims);
	}

	/**
	 * Factory method for .split().
	 *
	 * Handles caching.
	 *
	 * @see constructor()
	 */
	static split(str, delims, options) {
		return Lexer.lex(str, delims, options).tokens;
	}

	/**
	 * Factory method for .match().
	 *
	 * Handles caching.
	 *
	 * @see constructor()
	 */
	static match(str, delims, options) {
		return Lexer.lex(str, delims, options).matches;
	}

	/**
	 * Creates a lexer instance on a string with the given options.
	 *
	 * @param string 	str
	 * @param object	options:
	 * @param string 		blocks				The strings that begin and end a nested structure
	 * @param number 		limit				Max results to return
	 * @param string 		backreference		A character like (\) that prefixes non-delim characters
	 *
	 * @return array
	 */
	constructor(str, options) {
		if (!_isString(str)) {
			throw new Error('Lexer requires the first argument to be a string.');
		}
		this.$str = str;
		this.$options = options || {};
		if (!this.$options.blocks) {
			this.$options.blocks = Lexer.$blocks;
		}
		if (!this.$options.quotes) {
			this.$options.quotes = Lexer.$quotes;
		}
		if (!this.$options.comments) {
			this.$options.comments = Lexer.$comments;
		}
		this.$cache = [];
	}

	/**
	 * Parses the instance string on the given delimeters.
	 *
	 * This method supports static calling,
	 * in which case a string is required as the first argument.
	 *
	 * @param string 	str
	 * @param object	options
	 *
	 * @return object
	 */
	lex(delims, options) {
		var runtime = {
			delims: _arrFrom(delims),
			options: _merge(true, {}, this.$options, options || {}),
			nesting: [],
			maxDepth: 0,
			comments: [],
			tokens: [],
			matches: [],
			matchesi: {},
		};
		// ASK INSTANCE CACHE ---------------------------
		if (runtime.options.cache !== false) {
			for (var i = 0; i < this.$cache.length; i ++) {
				if (_even(this.$cache[i].delims, runtime.delims) && _even(this.$cache[i].options, runtime.options)) {
					return _copyPlain(this.$cache[i]);
				}
			}
		}
		// EVALUATE NEW --------------------------------
		// Iterate over each character, keep track of current row and column (of the returned array)
		this._evalCharsAt(runtime, 0);
		if (runtime.nesting.length) {
			throw new Error('Error parsing the string: ' + this.$str + '. Unterminated blocks: ' + _flatten(runtime.nesting).join(', ') + '');
		}
		// GIVE CACHE ----------------------------------
		if (runtime.options.cache !== false) {
			this.$cache.push(runtime);
		}
		// RETURN NEW ----------------------------------
		return runtime;
	}

	/**
	 * Expr helper: evaluates and handles the character on the current cursor.
	 * Advances the cursor.
	 *
	 * @param object 	runtime
	 * @param int		i
	 *
	 * @return void
	 */
	_evalCharsAt(runtime, i) {
		if (i >= this.$str.length) {
			return;
		}
		var charWidth = 1;
		var commentTest = {}, quoteTest = {}, nestingTest = {};
		// Quotes inside comments must be ignored
		if (!runtime.openComment) {
			quoteTest = this._testQuotes(runtime, i);
		}
		// Comments inside quotes must be ignored
		if (!runtime.openQuote) {
			commentTest = this._testComments(runtime, i);
		}
		// Save comments
		if (runtime.openComment || commentTest.ending) {
			// Save only outer comments
			if (!runtime.nesting.length && !nestingTest.ending) {
				var chars = commentTest.starting || commentTest.ending || this.$str[i];
				charWidth = chars.length;
				this._push(runtime, chars, 'comments', commentTest.starting);
			} else {
				this._push(runtime, this.$str[i]);
			}
		} else if (runtime.openQuote || quoteTest.ending) {
			// Yes add quotes
			this._push(runtime, this.$str[i]);
		} else if (runtime.options.limit && runtime.matches.length === runtime.options.limit) {
			this._push(runtime, this.$str[i]);
			return this._evalCharsAt(runtime, i + 1);
		} else {
			// Nesting tags inside comments and quotes have been ignored
			nestingTest = this._testNesting(runtime, i);
			// ---------------------
			// STOP ON THIS CHARACTER...?
			// ---------------------
			var nestingTest = this._testNesting(runtime, i);
			// STOP CHAR(S)? at top level?
			var stopChar = this._testChars(runtime.options.stopChars || [], runtime, i);
			if (!runtime.nesting.length && stopChar !== false) {
				runtime.options.stopChar = stopChar;
				runtime.options.stopCharForward = this.$str.substr(i);
				return;
			}
			// ---------------------
			// Match and split now...
			// ---------------------
			if (!runtime.delims.length) {
				// BLOCK-BASED SPLITTING...
				if (runtime.nesting.length === 2 && nestingTest.starting) {
					runtime.matches.push(null);
					this._push(runtime, nestingTest.starting);
					charWidth = nestingTest.starting.length;
				} else if (!runtime.nesting.length && nestingTest.ending) {
					this._push(runtime, nestingTest.ending);
					charWidth = nestingTest.ending.length;
					runtime.matches.push(null);
				} else/*no-nesting flag*/ {
					this._push(runtime, this.$str[i]);
				}
			} else {
				// ---------------------
				// DELIMS-BASED SPLITTING
				// ---------------------
				if (!runtime.nesting.length && !nestingTest.ending) {
					// In case the chars at index 0 is a delim,
					// the resulting split should first have an empty string, instead of undefined
					this._push(runtime, '');
					var matchedDelim = this._testChars(runtime.delims, runtime, i);
					if (matchedDelim !== false) {
						runtime.matches.push(matchedDelim);
						runtime.matchesi[i] = matchedDelim;
						charWidth = matchedDelim.length || 1;
						if (!runtime.options.preserveDelims) {
							// The current character is a delimiter...
							// and should not get to appending to the split series down the line
							return this._evalCharsAt(runtime, i + (matchedDelim.length || 1));
						}
					}
					this._push(runtime, matchedDelim || this.$str[i]);
				} else {
					var chars = nestingTest.starting || nestingTest.ending || this.$str[i];
					charWidth = chars.length;
					this._push(runtime, chars);
				}
			}
		}
		return this._evalCharsAt(runtime, i + charWidth);
	}

	/**
	 * Expr helper: tests for a quote start/end character on the current cursor.
	 *
	 * @param object	runtime
	 * @param int		i
	 *
	 * @return object
	 */
	_testQuotes(runtime, i) {
		var result = {};
		(runtime.options.quotes || []).forEach(quote => {
			if (this.$str.substr(i, 1) === quote) {
				if (!runtime.openQuote) {
					runtime.openQuote = quote;
					result.starting = quote;
				} else if (quote === runtime.openQuote) {
					runtime.openQuote = false;
					result.ending = quote;
				}
			}
		});
		return result;
	}

	/**
	 * Expr helper: tests for a comment start/end character on the current cursor.
	 *
	 * @param object	runtime
	 * @param int		i
	 *
	 * @return object
	 */
	_testComments(runtime, i) {
		var result = {};
		(runtime.options.comments || []).forEach(block => {
			if (!runtime.openComment) {
				var m = this.$str.substr(i).match(new RegExp('^' + _first(block)));
				if (m) {
					runtime.openComment = block;
					result.starting = m[0];
				}
			} else if (_last(block) === _last(runtime.openComment)) {
				var m = this.$str.substr(i).match(new RegExp('^' + _last(block)));
				if (m) {
					runtime.openComment = false;
					result.ending = m[0];
				}
			}
		});
		return result;
	}

	/**
	 * Expr helper: tests for a nesting start/end character on the current cursor.
	 *
	 * @param object	runtime
	 * @param int		i
	 *
	 * @return object
	 */
	_testNesting(runtime, i) {
		var result = {};
		(runtime.options.blocks || []).forEach(block => {
			var starting = this.$str.substr(i).match(new RegExp('^' + _first(block)));
			if (starting) {
				runtime.nesting = runtime.nesting.concat([block]);
				result.starting = starting[0];
			} else if (runtime.nesting.length && _last(block) === _last(_last(runtime.nesting))) {
				var ending = this.$str.substr(i).match(new RegExp('^' + _last(block)));
				if (ending) {
					runtime.nesting = runtime.nesting.slice(0, -1);
					result.ending = ending[0];
				}
			}
		});
		runtime.maxDepth = Math.max(runtime.maxDepth, runtime.nesting.length);
		return result;
	}

	/**
	 * Expr helper: tests for a delimiter or stop character on the current cursor.
	 *
	 * @param array		testList
	 * @param object 	runtime
	 * @param int		i
	 *
	 * @return mixed
	 */
	_testChars(testList, runtime, i) {
		for (var k = 0; k < testList.length; k ++) {
			var test = testList[k];
			if (_isFunction(test)) {
				var ret = test(this.$str.substr(0, i), this.$str.substr(i));
				if (ret !== false) {
					return ret;
				}
			}
			if (runtime.options.useRegex) {
				var m = this.$str.substr(i).match(new RegExp('^' + test, runtime.options.useRegex !== true ? runtime.options.useRegex : ''));
				if (m) {
					return m[0];
				}
			}
			if ((!runtime.options.ci && this.$str.substr(i, test.length) === test)
			|| (runtime.options.ci && this.$str.substr(i, test.length).toLowerCase() === test.toLowerCase())) {
				return test;
			}
		}
		return false;
	}
	
	/**
	 * Expr helper: pushes a character or set of characters into the current split series.
	 *
	 * @param object 	runtime
	 * @param string	chars
	 * @param string	target
	 * @param bool		isNewSeries
	 *
	 * @return void
	 */
	_push(runtime, chars, target = 'tokens', isNewSeries = false) {
		var splitSeries = runtime.matches.length;
		if (_isUndefined(runtime.tokens[splitSeries])) {
			runtime.tokens[splitSeries] = '';
		}

		if (target === 'comments') {
			if (!runtime.tokens[splitSeries].comments) {
				runtime.tokens[splitSeries] = new String(runtime.tokens[splitSeries]);
				runtime.tokens[splitSeries].comments = [];
			}
			var splitSeries2 = runtime.tokens[splitSeries].comments.length - (!runtime.tokens[splitSeries].comments.length || isNewSeries ? 0 : 1);
			runtime.tokens[splitSeries].comments[splitSeries2] = (runtime.tokens[splitSeries].comments[splitSeries2] || '') + chars;
		} else {
			var comments = runtime.tokens[splitSeries].comments;
			runtime.tokens[splitSeries] = new String(runtime.tokens[splitSeries] + chars);
			runtime.tokens[splitSeries].comments = comments;
		}
	}

	/**
	 * Splits the instance string on the given delimeters and returns the tokens.
	 *
	 * @param string 	str
	 * @param object	options
	 *
	 * @return array
	 */
	split(str, delims, options) {
		return this.lex(delims, options).tokens;
	}
	
	/**
	 * Splits the instance string on the given delimeters and returns the matches.
	 *
	 * @param string 	str
	 * @param object	options:
	 *
	 * @return array
	 */
	match(str, delims, options) {
		return this.lex(delims, options).matches;
	}
	
	/**
	 * Parses the instance string on the given delimeters using regex.
	 *
	 * @param string 	str
	 * @param object	options
	 *
	 * @return object
	 */
	regParse(delims, options) {
		return this.lex(delims, _merge({useRegex: true}, options || {}));
	}
	
	/**
	 * Splits the instance string on the given delimeters using regex; returns the tokens.
	 *
	 * @param string 	str
	 * @param object	options
	 *
	 * @return array
	 */
	regSplit(delims, options) {
		return this.regParse(delims, options).tokens;
	}
	
	/**
	 * Matches the instance string on the given delimeters using regex; returns the matches.
	 *
	 * @param string 	str
	 * @param object	options
	 *
	 * @return array
	 */
	regMatch(delims, options) {
		return this.regParse(delims, options).matches;
	}
};

/**
 * @var array
 */
Lexer.$blocks = [['\\(', '\\)'], ['\\[', '\\]'], ['\\{', '\\}'],];

/**
 * @var array
 */
Lexer.$quotes = ['"', "'", '`',];

/**
 * @var array
 */
Lexer.$comments = [['\\/\\*', '\\*\\/'], ['\\/\\/', '(\\r)?\\n'],];

/**
 * @var object
 */
Lexer.$cache = {};

/**
 * @export
 */
export default Lexer;

