!function(t){var e={};function r(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=t,r.c=e,r.d=function(t,e,s){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)r.d(s,n,function(e){return t[e]}.bind(null,n));return s},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=1)}([,function(t,e,r){"use strict";r.r(e);var s=function(t){return Array.isArray(t)},n=function(t){return"function"==typeof t},i=function(t){return n(t)||t&&"[object function]"==={}.toString.call(t)},o=function(t){return!Array.isArray(t)&&"object"==typeof t&&t},a=function(t){return Array.isArray(t)||"object"==typeof t&&t||n(t)},c=function(t){return t instanceof Number||"number"==typeof t},h=function(t){return c(t)||!0!==t&&!1!==t&&null!==t&&""!==t&&!isNaN(1*t)},l=function(t,e){var r=[];return function(t,e){e=(e=e||Object.prototype)&&!s(e)?[e]:e;var r=[];for(t=t;t&&(!e||e.indexOf(t)<0)&&"default"!==t.name;)r.push(t),t=t?Object.getPrototypeOf(t):null;return r}(t,e).forEach(t=>{!function(t,...e){e.forEach(e=>{t.indexOf(e)<0&&t.push(e)})}(r,...Object.getOwnPropertyNames(t))}),r};function u(t,e,r=!1,n=!1,c=!1){var p=0,f=t.shift();if((h(f)||!0===f||!1===f)&&(p=f,f=t.shift()),!t.length)throw new Error("_merge() requires two or more array/objects.");return t.forEach((t,g)=>{(a(t)||i(t))&&(r?l(t):Object.getOwnPropertyNames(t)).forEach(i=>{if(e(i,f,t,g)){var a=f[i],l=t[i];if((s(a)&&s(l)||o(a)&&o(l))&&(!0===p||p>0))f[i]=s(a)&&s(l)?[]:{},u([h(p)?p-1:p,f[i],a,l],e,r,n,c);else if(s(f)&&s(t))n?f[i]=l:f.push(l);else try{c?Object.defineProperty(f,i,Object.getOwnPropertyDescriptor(t,i)):f[i]=t[i]}catch(t){}}})}),f}var p=function(...t){return u(t,(t,e,r)=>!0,!1,!1,!1)},f=function(t){return null===t||""===t},g=function(t){return arguments.length&&(void 0===t||void 0===t)},m=function(t){return o(t)&&Object.getPrototypeOf(t)===Object.prototype},d=function(t){return!0===t||!1===t},v=function(t,e){var r=void 0;return a(t)&&Object.keys(t).forEach((s,n)=>{!1!==r&&(r=e(h(s)?parseFloat(s):s,t[s],n))}),r};const y=function(t,e,r=!0,n=1){if(s(t)&&s(e)&&t.length!==e.length)return!r;if(o(t)&&o(e)){var h=Object.keys(t),l=Object.keys(e);if(!h.length&&!l.length)return m(t)&&m(e)?r:t===e===r;if(!y(h,l))return!r}if(n>0&&(s(t)&&s(e)||o(t)&&o(e))){var u=function(t,e,r=!0,n=!0,i=!1,c=!1){if(s(t)&&s(e)){var h=[],l=!0;return t.forEach(t=>{if(l){var u=!1;v(e,(e,i)=>{(!u||n&&a(t))&&(u=r(t,i),(s(u)&&!u.length||o(u)&&!Object.keys(u).length)&&(u=!1),a(u)&&n&&(t=u))}),a(u)?h.push(n?u:t):d(u)?i&&!u||!i&&u?h.push(t):c&&(l=!1):h.push(u)}}),h}if(o(t)&&o(e)){h={},l=!0;return Object.keys(t).forEach(u=>{if(l){var p=r(t[u],e[u]);(s(p)&&!p.length||o(p)&&!Object.keys(p).length)&&(p=!1),a(p)?h[u]=n?p:t[u]:d(p)?i&&!p||!i&&p?h[u]=t[u]:c&&(l=!1):h[u]=p}}),h}}(t,e,(t,e)=>y(t,e,r,n-1),!1,!1,!0);return s(u)?u.length===t.length&&u.length===e.length:o(u)&&o(t)?Object.keys(u).length===Object.keys(t).length&&Object.keys(u).length===Object.keys(e).length:u}return i(r)?r(t,e):c(t)&&c(e)&&isNaN(t)&&isNaN(e)?r:t===e===r};var b=y,w=class{even(t){return!(!o(t)||t.jsenType!==this.jsenType)&&b(t,this)}inherit(t){return this}withComments(t){return this.meta||(this.meta={}),this.meta.comments=t,this}withVars(t){return this.meta||(this.meta={}),this.meta.vars=t,this}};const x=class extends w{};Object.defineProperty(x.prototype,"jsenType",{get:()=>"Reference"});var j=x;const k=class extends w{};Object.defineProperty(k.prototype,"jsenType",{get:()=>"CallExpression"});var O=k,E=class extends w{};const T=class extends w{};Object.defineProperty(T.prototype,"jsenType",{get:()=>"IfConstruct"});var $=T,P=class extends Error{constructor(...t){super(...t),this.name="Syntax Error"}};var C=function(t,e,r){return t.startsWith(e)&&t.endsWith(r)},S=function(t,e,r=!1){if(""==e)return t;var s=r?t.lastIndexOf(e):t.indexOf(e);return-1===s?"":t.substr(s+e.length)},_=function(t,e,r=!1){if(""==e)return t;var s=r?t.lastIndexOf(e):t.indexOf(e);return-1===s?t:t.substr(0,s)},W=function(t,e,r){return function(t,e){return _(t,e,!0)}(S(t,e),r)},F=function(t){return t instanceof String||"string"==typeof t&&null!==t},N=function(t,e=!0){return s(t)?t:!e&&o(t)?[t]:!1!==t&&0!==t&&function(t){return f(t)||g(t)||!1===t||0===t||a(t)&&!Object.keys(t).length}(t)?[]:function(t){return!F(t)&&!g(t.length)}(t)?Array.prototype.slice.call(t):o(t)?Object.values(t):[t]};const A=function(t,e=1,r=!0){return!h(e)||e<=0?t:(!s(t)&&o(t)&&r&&(t=Object.values(t)),s(t)?t.reduce((t,n)=>s(n)||o(n)&&r?t.concat(A(s(n)?n:Object.values(n),e-1,r)):t.concat(n),[]):t)};var D=A,q=function(t,e=1){var r=0;t.forEach(t=>{r++});var s=t.slice(t.length-r,e);return arguments.length>1?s:s[0]},I=function(t,e=1){return arguments.length>1?q(t.slice().reverse(),e).reverse():q(t.slice().reverse())},L=function(t,e=[]){return u([{},t],(t,r,n)=>{if(!i(n[t]))return i(e)?e(t):!s(e)||!e.length||e.indexOf(t)>-1},!1,!1,!1)};class M{static lex(t,e,r={}){if(!F(t+=""))throw new Error("Argument1 must be a string!");var s=t=>({delims:t.delims.slice(),options:L(t.options),nesting:t.nesting.slice(),maxDepth:t.maxDepth,comments:t.comments.slice(),tokens:t.tokens.slice(),matches:t.matches.slice(),matchesi:L(t.matchesi)});if(M.$cache[t]&&!1!==r.cache)for(var n=0;n<M.$cache[t].length;n++){var i=M.$cache[t][n];if(b(i.delims,e))return s(i)}var o=new M(t,r).lex(e);return!1!==r.cache&&(M.$cache[t]=M.$cache[t]||[],M.$cache[t].push(o)),s(o)}static split(t,e,r){return M.lex(t,e,r).tokens}static match(t,e,r){return M.lex(t,e,r).matches}constructor(t,e){if(!F(t))throw new Error("Lexer requires the first argument to be a string.");this.$str=t,this.$options=e||{},this.$options.blocks||(this.$options.blocks=M.$blocks),this.$options.quotes||(this.$options.quotes=M.$quotes),this.$options.comments||(this.$options.comments=M.$comments)}lex(t,e){for(var r={delims:N(t),options:p(!0,{},this.$options,e||{}),nesting:[],maxDepth:0,comments:[],tokens:[],matches:[],matchesi:{}},s=0;"number"==typeof s;)s=this._evalCharsAt(r,s);if(r.nesting.length)throw new Error("Error parsing the string: "+this.$str+". Unterminated blocks: "+D(r.nesting).join(", "));return r}_evalCharsAt(t,e){if(!(e>=this.$str.length)){var r=1,s={},n={},i={};if(t.openComment||(n=this._testQuotes(t,e)),t.openQuote||(s=this._testComments(t,e)),t.openComment||s.ending)if(t.nesting.length||i.ending)this._push(t,this.$str[e]);else r=(a=s.starting||s.ending||this.$str[e]).length,this._push(t,a,"comments",s.starting);else if(t.openQuote||n.ending)this._push(t,this.$str[e]);else{if(t.options.limit&&t.matches.length===t.options.limit)return this._push(t,this.$str[e]),e+1;i=this._testNesting(t,e);i=this._testNesting(t,e);var o=this._testChars(t.options.stopChars||[],t,e);if(!t.nesting.length&&!1!==o)return t.options.stopChar=o,void(t.options.stopCharForward=this.$str.substr(e));if(t.delims.length)if(t.nesting.length||i.ending){var a;r=(a=i.starting||i.ending||this.$str[e]).length,this._push(t,a)}else{this._push(t,"");var c=this._testChars(t.delims,t,e);if(!1!==c&&(t.matches.push(c),t.matchesi[e]=c,r=c.length||1,!t.options.preserveDelims)){var h=e+(c.length||1);return h===this.$str.length&&this._push(t,""),h}this._push(t,c||this.$str[e])}else 2===t.nesting.length&&i.starting?(t.matches.push(null),this._push(t,i.starting),r=i.starting.length):!t.nesting.length&&i.ending?(this._push(t,i.ending),r=i.ending.length,t.matches.push(null)):this._push(t,this.$str[e])}return e+r}}_testQuotes(t,e){var r={};return(t.options.quotes||[]).forEach(s=>{this.$str.substr(e,1)===s&&(t.openQuote?s===t.openQuote&&(t.openQuote=!1,r.ending=s):(t.openQuote=s,r.starting=s))}),r}_testComments(t,e){var r={};return(t.options.comments||[]).forEach(s=>{if(t.openComment){if(I(s)===I(t.openComment)){var n=I(s);this.$str.substr(e).startsWith(n)&&(t.openComment=!1,r.ending=n)}}else{var i=q(s);this.$str.substr(e).startsWith(i)&&(t.openComment=s,r.starting=i)}}),r}_testNesting(t,e){var r={};return(t.options.blocks||[]).forEach(s=>{var n=q(s);if(this.$str.substr(e).startsWith(n))t.nesting=t.nesting.concat([s]),r.starting=n;else if(t.nesting.length&&I(s)===I(I(t.nesting))){var i=I(s);this.$str.substr(e).startsWith(i)&&(t.nesting=t.nesting.slice(0,-1),r.ending=i)}}),t.maxDepth=Math.max(t.maxDepth,t.nesting.length),r}_testChars(t,e,r){for(var s=0;s<t.length;s++){var n=t[s];if(i(n)){var o=n(this.$str.substr(0,r),this.$str.substr(r));if(!1!==o)return o}if(e.options.useRegex){var a=this.$str.substr(r).match(new RegExp("^"+n,!0!==e.options.useRegex?e.options.useRegex:""));if(a)return a[0]}if(!e.options.ci&&this.$str.substr(r,n.length)===n||e.options.ci&&this.$str.substr(r,n.length).toLowerCase()===n.toLowerCase())return n}return!1}_push(t,e,r="tokens",s=!1){var n=t.matches.length;if(g(t.tokens[n])&&(t.tokens[n]=""),"comments"===r){t.tokens[n].comments||(t.tokens[n]=new String(t.tokens[n]),t.tokens[n].comments=[]);var i=t.tokens[n].comments.length-(!t.tokens[n].comments.length||s?0:1);t.tokens[n].comments[i]=(t.tokens[n].comments[i]||"")+e}else{t.tokens[n].comments;t.tokens[n]=t.tokens[n]+e}}split(t,e,r){return this.lex(e,r).tokens}match(t,e,r){return this.lex(e,r).matches}regParse(t,e){return this.lex(t,p({useRegex:!0},e||{}))}regSplit(t,e){return this.regParse(t,e).tokens}regMatch(t,e){return this.regParse(t,e).matches}}M.$blocks=[["(",")"],["[","]"],["{","}"]],M.$quotes=['"',"'","`"],M.$comments=[["/*","*/"],["//","\n"]],M.$cache={};const R=class extends w{};Object.defineProperty(R.prototype,"jsenType",{get:()=>"Abstraction"});const Q=class extends w{};Object.defineProperty(Q.prototype,"jsenType",{get:()=>"ArrayType"});var U=function(t){return t.filter((t,e,r)=>r.indexOf(t)===e)};const B=class extends w{};Object.defineProperty(B.prototype,"jsenType",{get:()=>"AssertionExpression"});var K=B;const V=class extends K{constructor(t,e){super(),this.exprs=t,this.logic=e}eval(t=null,e={}){var r=this.constructor;if(this.logic.toLowerCase()===r.negation.toLowerCase())return!q(this.exprs).eval(t,e);D(r.operators);for(var s=(this.logic||"").trim().toUpperCase(),n=s===(r.operators.or||"").trim().toUpperCase(),i=s===(r.operators.nor||"").trim().toUpperCase(),o=s===(r.operators.and||"").trim().toUpperCase(),a=s===(r.operators.nand||"").trim().toUpperCase(),c=!0,h=0,l=0;l<this.exprs.length;l++){if(c=this.exprs[l].eval(t,e),o&&!c)return!1;if(a&&!c)return!0;if(n&&c)return c;h+=c?1:0}return n?c:o||a?o:i&&0===h}toString(){return this.stringify()}stringify(t={}){var e=this.constructor;return this.logic.toLowerCase()===e.negation.toLowerCase()?this.logic+q(this.exprs).stringify(t):this.exprs.map(e=>e.stringify(t)).join(" "+this.logic.trim()+" ")}static parse(t,e,r={}){if(t.toUpperCase().startsWith(this.negation.toUpperCase()))return new this([e(t.substr(this.negation.length))],this.negation);var s=M.lex(t,D(this.operators));if(s.tokens.length>1){var n=U(s.matches);if(n.length>1)throw new Error('"AND" and "OR" logic cannot be asserted in the same expression: '+t+"!");return new this(s.tokens.map(t=>e(t.trim())),q(n))}}};V.negation="!",V.operators={and:"&&",or:"||"};const z=class extends w{};Object.defineProperty(z.prototype,"jsenType",{get:()=>"AssignmentExpression"});var G=z,X=class extends Error{constructor(...t){super(...t),this.name="Reference Error"}};const H=class extends G{constructor(t,e,r,s="=",n=!1){super(),this.initKeyword=t,this.reference=e,this.val=r,this.operator=s,this.postIncrDecr=n}eval(t=null,e={}){var r,n,i=this.reference.getEval(t,e);if(["++","--"].includes(this.operator)){if(n=this.reference.eval(t,e),!c(n))throw new Error(this.reference+" must be a number!");r="++"===this.operator?n+1:n-1}else if(["+=","-=","*=","/="].includes(this.operator)){var o=i.get(),a=this.val.eval(t,e);if(!("+="===this.operator||c(o)&&c(a)))throw new Error(this+" - operands must each be a number!");r="*="===this.operator?o*a:"/="===this.operator?o/a:"-="===this.operator?o-a:o+a}else r=this.val.eval(t,e);try{return i.set(r,this.initKeyword),e&&s(e.references)&&_pushUnique(e.references,this.reference.toString()),this.postIncrDecr?n:r}catch(t){throw t instanceof X?new X("["+this+"]: "+t.message):t}}toString(){return this.stringify()}stringify(t={}){return["++","--"].includes(this.operator)?this.postIncrDecr?this.reference.stringify(t)+this.operator:this.operator+this.reference.stringify(t):(this.initKeyword?this.initKeyword+" ":"")+[this.reference.stringify(t),this.operator.trim(),this.val.stringify(t)].join(" ")}static parse(t,e,r={}){var s=M.lex(t,this.operators.concat([J]));if(s.matches.length){var n,i,o,a,c=s.matches[0].trim(),h=["++","--"].includes(c);if(h?(a=t.trim().endsWith("++")||t.trim().endsWith("--"),i=s.tokens[a?"shift":"pop"]().trim()):(i=s.tokens.shift().trim(),o=s.tokens.shift().trim()),["var","let","const"].includes(_(i," "))){if("="!==c)throw new P("Invalid declaration: "+t);n=_(i," "),i=S(i," ").trim()}if(!((i=e(i,null,{role:"ASSIGNMENT_SPECIFIER"}))instanceof j)||!h&&!(o=e(o)))throw new P(t);return new this(n,i,o,c,a)}}};H.operators=["+=","-=","*=","/=","++","--"];const J=(t,e)=>!(t.endsWith("=")||!e.startsWith("=")||e.startsWith("=>")||e.startsWith("==")||e.startsWith("==="))&&"=";const Y=class extends w{};Object.defineProperty(Y.prototype,"jsenType",{get:()=>"BooleanType"});const Z=class extends w{};Object.defineProperty(Z.prototype,"jsenType",{get:()=>"Arguments"});const tt=class extends w{};Object.defineProperty(tt.prototype,"jsenType",{get:()=>"ComparisonExpression"});var et=tt;class rt extends et{constructor(t,e,r){super(),this.operand1=t,this.operand2=e,this.operator=r}eval(t=null,e={}){return this.constructor.compare(this.operand1.eval(t,e),this.operand2.eval(t,e),this.operator)}toString(){return this.stringify()}stringify(t={}){return[this.operand1.stringify(t),this.operator,this.operand2.stringify(t)].join(" ")}static parse(t,e,r={}){var s=D(this.operators).map(t=>" "+t+" "),n=M.lex(t,s);if(n.tokens.length>1){if(n.tokens.length>2)throw new Error('Malformed "Comparison" expression: '+t+"!");return new this(e(q(n.tokens).trim()),e(I(n.tokens).trim()),n.matches[0].trim())}}static compare(t,e,r="=="){if(-1===D(this.operators).indexOf(r))throw new Error('The operator "'+r+'" is not recognized.');switch(r){case"===":return t===e;case"==":case"=":return t==e;case">":return t>e;case"<":return t<e;case">=":return t>=e;case"<=":return t<=e;case"!=":return t!=e;case"<>":case"!==":return t!==e;case"^=":return F(t)&&t.startsWith(e);case"$=":return F(t)&&t.endsWith(e);case"*=":return!(!s(e)&&!F(e))&&t.indexOf(e)>-1;case"~=":return F(t)&&F(e)&&(" "+t+" ").indexOf(" "+e+" ")>-1;case">=<":if(!s(e)||2!==e.length)throw new Error("A 'Between' comparison requires argument 2 to be an array of exactly 2 values.");return t>=e[0]&&t<=e[1];case"/**/":return e.match(new RegExp(t));default:return!1}}static diff(t,e,r){return!this.compare(t,e,r?"===":"==")}}rt.operators={exact:{is:"===",isNull:"===",equalsTo:"==",strictlyNotEqualsTo:"!==",notEqualsTo:"!="},relative:{lesserThan:"<",greaterThan:">",lesserThanOrEqualsTo:"<=",greaterThanOrEqualsTo:">=",between:">=<"},partial:{startsWith:"^=",endsWith:"$=",contains:"*=",any:"~=",in:"~=",matches:"/**/"}};const st=class extends w{};Object.defineProperty(st.prototype,"jsenType",{get:()=>"TernaryConditional"});var nt=st;class it extends nt{constructor(t,e,r){super(),this.assertion=t,this.onTrue=e,this.onFalse=r}eval(t=null,e={}){return this.assertion.eval(t,e)?this.onTrue.eval(t,e):this.onFalse.eval(t,e)}toString(){return this.stringify()}stringify(t={}){return[this.assertion.stringify(t),this.constructor.operators[0],this.onTrue.stringify(t),this.constructor.operators[1],this.onFalse.stringify(t)].join(" ")}static parse(t,e,r={}){var s=M.split(t,this.operators);if(s.length>1){if(2===s.length)throw new Error("Malformed ternary expression: "+t+"!");return new this(e(s[0].trim()),e(s[1].trim()),e(s[2].trim()))}}}it.operators=["?",":"];const ot=class extends w{};Object.defineProperty(ot.prototype,"jsenType",{get:()=>"DeleteExpression"});var at=ot;const ct=class extends at{constructor(t,e="delete"){super(),this.reference=t,this.operator=e}eval(t=null,e={}){try{return this.reference.getEval(t,e).del()}catch(t){throw t instanceof X?new X("["+this+"]: "+t.message):t}}toString(){return this.stringify()}stringify(t={}){return this.operator+" "+this.reference.stringify(t)}static parse(t,e,r={}){var s=M.lex(t,Object.values(this.operators));if(1===s.matches.length&&t.startsWith(s.matches[0]+" ")){var n;if(!((n=e(s.tokens.pop().trim(),null,{role:"DELETION_SPECIFIER"}))instanceof j))throw new P(t);return new this(n,s.matches[0].trim())}}};ct.operators={red:"reduce",del:"delete"};const ht=class extends E{};Object.defineProperty(ht.prototype,"jsenType",{get:()=>"FunctionType"});var lt=ht;const ut=class extends w{};Object.defineProperty(ut.prototype,"jsenType",{get:()=>"Block"});var pt=ut;const ft=class extends w{};Object.defineProperty(ft.prototype,"jsenType",{get:()=>"ReturnDirective"});var gt=ft;const mt=class extends w{};Object.defineProperty(mt.prototype,"jsenType",{get:()=>"NumberType"});var dt=mt;const vt=class extends w{};Object.defineProperty(vt.prototype,"jsenType",{get:()=>"StringType"});var yt=vt;function bt(t,e){return e.reduce((e,r,s)=>e&&r===t[s],!0)}function wt(t){return t.map(t=>{var e=t,r=[];do{e instanceof O&&(r.splice(0),e=e.reference),F(e.name)?r.unshift(e.name):e.name instanceof dt?r.unshift(e.name.int):e.name instanceof yt?r.unshift(e.name.expr):r.splice(0)}while(e=e.context);return r})}class xt{constructor(t,e={}){if(!("main"in t))throw new Error('A "main" context must be provided!');Object.defineProperty(this,"stack",{value:t||{},enumerable:!1}),Object.defineProperty(this,"params",{value:e||{},enumerable:!1}),t.super&&Object.defineProperty(this.stack,"super",{value:xt.create(t.super,{errorLevel:e.errorLevel}),enumerable:!1}),Object.defineProperty(this.stack,"local",{value:t.local||{},enumerable:!1}),Object.defineProperty(this.stack,"$local",{value:t.$local||{},enumerable:!1})}observe(t,e,r={}){this.stack.super&&this.stack.super.observe(t,r=>{if(r.props.filter(e=>!kt(this.stack.local,e,t)&&!kt(this.stack.main,e,t)).length)return r.scope="super",e(r)},r);var s={...r};s.subtree="auto",s.tags=(s.tags||[]).slice(0),s.tags.push(this,"jsen-context"),s.diff=!0,t.observe(this.stack,r=>{var s=[];if(r.forEach(t=>{if("main"===t.name)if(t.path.length>1)s.push(t.path.slice(1));else{var e=U((a(t.value)?Object.keys(t.value):[]).concat(t.oldValue&&a(t.oldValue)?Object.keys(t.oldValue):[]));s.push(...e.map(t=>[t]))}}),(s=s.filter(e=>!kt(this.stack.local,e[0],t))).length){var n=s.map(t=>t[0]);return e({props:n,references:s,scope:"local"})}},s)}unobserve(t,e={}){this.stack.super&&this.stack.super.unobserve(t,e);var r={...e};r.tags=(r.tags||[]).slice(0),r.tags.push(this,"jsen-context"),t.unobserve(this.stack,null,null,r)}handle(t,e,r,s=0){var n=()=>e(this.stack.main,null,()=>this.stack.super?this.stack.super.handle(t,e,r,s+1):r?r():void 0,s);return"toString"===t&&this.stack.local.toString===Object.prototype.toString?n():e(this.stack.local,this.stack.$local,n,s)}get(t,e={},r=!0){return t instanceof String&&(t+=""),this.handle(t,(s,o,a,c)=>{var h=jt(s,t,e);return!g(h)||kt(s,t,e)?i(h)&&!function(t){return n(t)&&/^class\s?/.test(Function.prototype.toString.call(t))}(h)&&r?h.bind(s):h:a()})}set(t,e,r={},s=!1,n=!0){if(2===this.params.type&&"var"===s&&this.stack.super)return this.stack.super.set(t,e,r,s);t instanceof String&&(t+="");const i=(t,e,r,s)=>s.set?s.set(t,e,r):(t[e]=r,!0);return this.handle(!!s||t,(n,o,a,c)=>{if(o&&"const"===o[t])throw new LogicalError("CONST "+t+" cannot be modified!");if(s)return o[t]=s,i(n,t,e,r);if(kt(n,t,r))return i(n,t,e,r);try{return a()}catch(s){if(s instanceof X&&n&&!o&&0===c&&!1===this.params.strictMode)return i(n,t,e,r);throw s}},()=>{throw new X('"'+t+'" does not exist in scope!')})}del(t,e={}){return t instanceof String&&(t+=""),this.handle(t,(r,s,n)=>kt(r,t,e)?(s&&delete s[t],e.deleteProperty||e.del?(e.deleteProperty||e.del)(r,t):(delete r[t],!0)):n())}has(t,e,r={}){return t instanceof String&&(t+=""),e instanceof String&&(e+=""),this.handle(t,(s,n,i)=>{if(kt(s,t,r)){var o=jt(s,t,r);return kt(o,e,r)}return i()},()=>{throw new X('"'+t+'" is undefined!')})}exec(t,e,r={}){return t instanceof String&&(t+=""),this.handle(t,(s,n,o)=>{var a=jt(s,t,r);if(!g(a)||kt(s,t,r)){if(!i(a)){if(r.exec)return r.exec(s,t,e);throw new X('"'+t+'" is not a function! (Called on type: '+typeof s+".)")}return r.apply?r.apply(a,s,e):a.apply(s,e)}return o()},()=>{if(r.execUnknown)return r.execUnknown(this,t,e);throw new X('"'+t+'()" is undefined!')})}static create(t,e={},r={}){if(t instanceof xt)return t;var s={};return r.set?r.set(s,"main",t):s.main=t,new xt(s,e)}static createStack(t,e={},r={}){return t.reverse().reduce((t,s,n)=>{if(s instanceof xt){if(0===n)return s;throw new Error("Only the top-most context is allowed to be an instance of Scope.")}var i={};return r.set?r.set(i,"main",s):i.main=s,i.super=t,new xt(i,e)},null)}}const jt=(t,e,r)=>{if(!f(t)&&!g(t))return r.get&&a(t)?r.get(t,e):t[e]},kt=(t,e,r)=>!f(t)&&!g(t)&&(r.has&&a(t)?r.has(t,e):a(t)?e in t:!g(t[e]));class Ot extends pt{constructor(t,e){super(),this.stmts=t||[],this.delim=e}eval(t=null,e={}){var r,s=(e={...e}).returnCallback;e.returnCallback=t=>{r=t},t=xt.create(t);for(var n=(t,e,r)=>{try{return t.eval(e,r)}catch(t){r.catch&&r.catch(t)}},i=[],o=0;o<this.stmts.length;o++){var a=this.stmts[o],c=wt(a.meta.reads),h=wt(a.meta.deep.reads||[]),l=(e.references||[]).filter(t=>c.filter(e=>bt(e,t)).length),u=(e.references||[]).filter(t=>h.filter(e=>bt(e,t)).length),p=!e.references||!e.references.length||(l=l.length)||(u=u.length);e.references&&2===t.params.type&&a instanceof G&&a.initKeyword;if(p){var f=e;if(l&&delete(f={...e}).references,i[o]=n(a,t,f),a instanceof gt||r)return s&&s(!0),i[o];(a instanceof $&&a.abortive||!1===r)&&(!0,s&&s(!1)),e.references&&(a instanceof G||a instanceof at)&&(e.references=e.references.concat(wt([a.reference])))}else if(e.references&&a instanceof G&&a.val instanceof j){e.references=e.references.slice(0);let t=wt([a.reference])[0],r=wt([a.val])[0];e.references.forEach(s=>{var n;bt(s,r)&&e.references.push(t.concat((n=r,s.slice(n.length))))})}}return i}toString(){return this.stringify()}stringify(t={}){return this.stmts.map(e=>e.stringify(t)).join(this.delim)}static parse(t,e,r={}){var s=M.lex(t+";",D(this.operators).concat([Ot.testBlockEnd]));if(s.matches.length)return new this(s.tokens.map(t=>e(t.trim())).filter(t=>t),s.matches[0].trim())}static testBlockEnd(t,e){return!(!t.endsWith("}")||e.trim().startsWith("else"))&&""}}Ot.operators=[";","\r\n"];const Et=class extends lt{constructor(t,e,r={}){super(),this.paramters=t||{},this.statements=e,this.statements.isIndependent=!0,this.arrowFunctionFormatting=r}inherit(t){if(t instanceof lt){for(var e=Object.keys(t.paramters),r=Object.keys(this.paramters),s=0;s<Math.max(r.length,e.length);s++){var n=e[s],i=r[s];if(!i&&n)throw new Error("Parameter #"+s+" ("+n+") in parent function must be implemented.");if(i&&n){var o=t.paramters[n],a=this.paramters[i];if(a&&!o)throw new Error("Parameter #"+s+" ("+i+") must not have a default value as established in parent function.");if(a&&o&&a.jsenType!==o.jsenType)throw new Error("Default value for parameter #"+s+" ("+i+") must be of type "+o.jsenType+" as established in parent function.")}}this.sup=t}return this}eval(t=null,e={}){var r=this;return delete(e={...e}).returnCallback,function(...s){var n={};v(Object.keys(r.paramters),(i,o)=>{var a=r.paramters[o];if(s.length-1<i&&!a)throw new Error('The parameter "'+o+'" is required.');n[o]=s.length>i?s[i]:r.paramters[o]?r.paramters[o].eval(t,e):null}),r.arrowFunctionFormatting||(n.this=this);var i=t instanceof xt?t.params.errorLevel:void 0,o=new xt({main:n,super:t},{errorLevel:i}),a=r.statements.eval(o,e);return!1===r.arrowFunctionFormatting.body?a[0]:a}}toString(){return this.stringify()}stringify(t={}){var e=[];if(v(this.paramters,(r,s)=>{e.push(r+(s?"="+s.stringify(t):""))}),this.arrowFunctionFormatting){var r=!1===this.arrowFunctionFormatting.head||1===e.length&&-1===e[0].indexOf("="),s=!1===this.arrowFunctionFormatting.body;return(r?e[0]:"("+e.join(", ")+")")+" => "+(s?this.statements.stringify(t):"{"+this.statements.stringify(t)+"}")}return"function ("+e.join(", ")+") {"+this.statements.stringify(t)+"}"}static parse(t,e,r={}){var s;if((t=t.trim()).startsWith("function")&&(s=M.split(t,[]).slice(1).filter(t=>t.trim()))&&2===s.length)var n=!1,i=W(s.shift().trim(),"(",")"),o=W(s.shift().trim(),"{","}");else{if(t.startsWith("function")||!(s=M.split(t,["=>"]))||2!==s.length)return;i=s.shift().trim(),o=s.shift().trim(),n={};C(i,"(",")")?i=W(i,"(",")"):n.head=!1,C(o,"{","}")?o=W(o,"{","}"):n.body=!1}var a={};M.split(i,[","]).forEach(t=>{var r=t.split("=");r[1]?a[r[0].trim()]=e(r[1].trim(),null,{meta:null}):a[t.trim()]=null});var c=e(o,[Ot],{assert:!1})||e(o,null,{meta:null});return new this(a,"Block"===c.jsenType?c:new Ot([c]),n)}};Et.operators=["=>"];var Tt=function(t,e,r=null){return s(e)?t.filter(t=>r?e.filter(e=>r(t,e)).length:-1!==e.indexOf(t)):[]};const $t=class extends w{};Object.defineProperty($t.prototype,"jsenType",{get:()=>"MathExpression"});var Pt=$t;const Ct=class extends Pt{constructor(t,e){super(),this.val=t,this.exprs=e}eval(t=null,e={}){return this.exprs.reduce((r,s)=>{var n=s.val.eval(t,e),i=s.operator.trim();if(!(h(r)&&h(n)||"+"===i))throw new Error("Invalid Math expression: "+this.toString()+"!");switch(i){case"+":return r+n;case"-":return r-n;case"*":return r*n;case"/":return r/n}},this.val.eval(t,e))}toString(){return this.stringify()}stringify(t={}){return[this.val.stringify(t)].concat(this.exprs.map(e=>e.operator+" "+e.val.stringify(t))).join(" ")}static parse(t,e,r={}){var s=M.lex(t,D(this.operators));if(s.tokens.filter(t=>t).length>1&&s.matches.length===s.tokens.length-1){var n=U(s.matches);if(Tt(n,this.operators.sup).length&&Tt(n,this.operators.sub).length)throw new Error('"Addition/subtraction" and "multiplication/division" operators cannot be used in the same expression: '+t+"!");return new this(e(s.tokens.shift().trim()),s.tokens.map((t,r)=>({operator:s.matches[r],val:e(t.trim())})))}}};Ct.operators={sup:["*","/"],sub:["+","-"]};const St=class extends w{};Object.defineProperty(St.prototype,"jsenType",{get:()=>"ObjectType"});var _t=St;const Wt=class extends _t{constructor(t){super(),this.entries=t||{}}inherit(t){return t instanceof _t&&v(t.entries,(t,e)=>{t in this.entries||(this.entries[t]=e)}),this}eval(t=null,e={}){var r={};return v(this.entries,(s,n)=>{r[s]=n.eval(t,e)}),r}toString(){return this.stringify()}stringify(t={}){var e=[];return v(this.entries,(r,s)=>{e.push(r+Wt.operators.sub+s.stringify(t))}),"{"+e.join(Wt.operators.sup)+"}"}static parse(t,e,r={}){if(C(t,"{","}")&&!M.match(t.trim(),[" "]).length){var s={},n=M.split(W(t,"{","}"),[Wt.operators.sup]).map(t=>t.trim()).filter(t=>t);return v(n,(t,r)=>{var n=M.split(r,[Wt.operators.sub],{limit:1});s[q(n).trim()]=e(I(n).trim())}),new this(s)}}};Wt.operators={sup:",",sub:":"};const Ft=class extends w{};Object.defineProperty(Ft.prototype,"jsenType",{get:()=>"PresenceOperator"});var Nt=Ft;const At=class extends Nt{constructor(t,e,r="in"){super(),this.prop=t,this.reference=e,this.operator=r}eval(t=null,e={}){var r=this.prop.eval(t,e);try{return this.reference.getEval(t,e).has(r)}catch(t){throw t instanceof X?new X("["+this+"]: "+t.message):t}}toString(){return this.stringify()}stringify(t={}){return[this.prop.stringify(t),this.operator,this.reference.stringify(t)].join(" ")}static parse(t,e,r={}){var s=M.lex(t,this.operators);if(2===s.tokens.length){var n,i;if(!((n=e(s.tokens.shift().trim()))&&(i=e(s.tokens.shift().trim()))instanceof j))throw new P(t);return new this(n,i,s.matches[0].trim())}}};At.operators=[" in "];class Dt extends j{constructor(t,e,r=!1){super(),this.context=t,this.name=e,this.backticks=r}getEval(t=null,e={}){var r=t,s=this.name;this.context&&(s instanceof w&&(s=s.eval(t,e)),r=this.context.eval(t,e));var n=!this.context;return{get:()=>xt.create(r,e).get(s,e.trap),del:()=>xt.create(r,e).del(s,e.trap),has:t=>xt.create(r,e).has(s,t,e.trap),set:(t,i=null)=>xt.create(r,e).set(s,t,e.trap,i,n),exec:t=>xt.create(r,e).exec(s,t,e.trap)}}eval(t=null,e={}){try{return this.getEval(t,e).get()}catch(t){throw t instanceof X?new X("["+this+"]: "+t.message):t}}toString(){return this.stringify()}stringify(t={}){var e=this.name;if(this.context){var r=this.context.stringify(t);e instanceof w?e="["+e.stringify(t)+"]":this.backticks&&(e="`"+e+"`")}else{r=t.context;this.backticks&&(e="`"+e+"`")}return(r||"")+(r&&!e.startsWith("[")?Dt.separator:"")+e}static parse(t,e,r={}){if(!M.match(t.trim(),[" "]).length){var s,n,i=M.split(t,[]),o=i.pop(),a=M.split(o.trim(),[this.separator],{preserveDelims:!0});if(a.length>1&&(o=a.pop().substr(1),i=i.concat(a)),C(o,"`","`")&&(o=W(o,"`","`"),n=!0),i.length&&(s=e(i.join(""),null,{role:"CONTEXT"})),C(o,"[","]")){if(!s)throw new P(t);o=e(W(o,"[","]"))}return new this(s,o,n)}}}Dt.separator=".";const qt=class extends w{};Object.defineProperty(qt.prototype,"jsenType",{get:()=>"Void"});window.WebQit||(window.WebQit={}),window.WebQit.Subscript=void 0}]);
//# sourceMappingURL=main.js.map