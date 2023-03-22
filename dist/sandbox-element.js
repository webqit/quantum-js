(()=>{function P(p={}){let{runtimeParams:t={},compilerParams:{globalsNoObserve:e=[],globalsOnlyPathsExcept:i=[],...s}={},parserParams:r={}}=p,n={runtimeParams:{...k,...t},compilerParams:{...$,globalsNoObserve:[...$.globalsNoObserve,...e],globalsOnlyPathsExcept:[...$.globalsOnlyPathsExcept,...i],...s},parserParams:{...I,...r}};return p.devMode,n}var I={ecmaVersion:"2020",allowReturnOutsideFunction:!0,allowAwaitOutsideFunction:!0,allowSuperOutsideMethod:!0,preserveParens:!1,locations:!1},$={globalsNoObserve:["globalThis","arguments","console","debugger"],globalsOnlyPathsExcept:[],originalSource:!0,locations:!0,compact:2},k={apiVersion:1};function O(p,t=!1){let e=p.split(/\n/g);if(e.length>1){for(;!e[0].trim().length;)e.shift();let i=e[t?1:0].split(/[^\s]/)[0].length;if(i)return e.map((s,r)=>{let n=s.substring(0,i);return n.trim().length?n.trim()==="}"&&r===e.length-1?"}":s:s.substring(i)}).join(`
`)}return p}var m=(p,t)=>p instanceof Promise?p.then(t):t(p);var j=new Map;function x(p,t,e=void 0){let i=j.get(p);if(arguments.length>2){i||(i=new Map,j.set(p,i)),i.set(t,e);return}return i&&i.get(t)}var C=class{constructor(t,e,i,s={},r=null,n=null){this.ownerContract=t,this.graph=e,this.callee=i,this.params=t?s:{...s,isSubscriptFunction:!0},this.exits=n||new Map,this.$thread=r||{entries:new Map,sequence:[],ownerContract:this},this.subContracts=new Map,this.observers=[],this.contract=function(o,l,u=null,h=null){if(!this.graph.subContracts[o])throw new Error(`[${this.graph.type}:${this.graph.lineage}]: Graph not found for child contract ${o}.`);let a=this.graph.subContracts[o],c={...this.params,isIterationContract:arguments.length===3,iterationId:arguments.length===3&&l,isFunctionContract:arguments.length===4,functionType:arguments.length===4&&l,isSubscriptFunction:arguments.length===4&&u,functionScope:this.params.isFunctionContract&&this.graph.lineage||this.params.functionScope};if(c.isIterationContract){let b=u,g=new C(this,a,b,c,this.$thread,this.exits),w=this.subContracts.get(o);return w||(w=new Map,this.subContracts.set(o,w)),w.has(c.iterationId)&&w.get(c.iterationId).dispose(),w.set(c.iterationId,g),g.call()}let f,y,d;if(this.subContracts.has(o)&&this.subContracts.get(o).dispose(),c.isFunctionContract){f=h;let b=()=>new C(this,a,f,c);if(c.functionType!=="FunctionDeclaration")d=this.createFunction(b);else{let g=b();c.apiVersion>1?(d=function(...w){let v=g.call(this,...w);return v=m(v,M=>[v,g.thread.bind(g),g]),g=b(),v},d.target=g):d=g}}else f=l,y=new C(this,a,f,c,this.$thread,this.exits),this.subContracts.set(o,y),d=y.call();return d}.bind(this),this.contract.memo=Object.create(null),this.ownerContract&&!["FunctionDeclaration","FunctionExpression"].includes(this.graph.type)&&(this.contract.args=this.ownerContract.contract.args),this.contract.exiting=function(o,l){if(!arguments.length)return this.exits.size;let u=this.exits.get(o)===l;return u&&this.exits.clear(),u}.bind(this),this.contract.exit=function(o,l){this.exits.set(o,l)}.bind(this),this.contract.functions=new Map,this.contract.functions.declaration=(o,l)=>{this.contract.functions.set(o,l),this.applyReflection(o,typeof l=="function"?l.target:l)}}fire(t,e,i){if(!this.ownerContract)return;let s=this.ownerContract.fire(t,e,i);return this.observers.forEach(r=>{r.contractUrl===t&&r.callback(e,i)}),s}observe(t,e){!this.params.isFunctionContract||this.observers.push({contractUrl:t,callback:e})}call(t,...e){if(this.disposed)throw new Error(`[${this.graph.type}:${this.graph.lineage}]: Instance not runable after having been disposed.`);this.ownerContract||(this.contract.args=e,Object.defineProperty(this.contract.args,Symbol.toStringTag,{value:"Arguments"}));let i=this.callee.call(t,this.contract,...e);if(this.graph.$sideEffects)for(let s in this.graph.effects)for(let r of this.graph.effects[s].refs)this.buildThread([],r,[],0,!0);return m(i,()=>{if(!this.ownerContract||this.params.isFunctionContract){let s=this.exits.get("return");if(this.exits.clear(),s!==void 0)return s}return i})}iterate(t=[]){if(this.disposed)return!1;if(!["ForOfStatement","ForInStatement"].includes(this.graph.type)||this.subContracts.size!==1)throw new Error(`Contract ${this.graph.lineage} is not an iterator.`);let[[,e]]=this.subContracts,i;if(!t.length||t.includes("length")&&this.graph.type==="ForOfStatement")for(let[,s]of e)i=m(i,()=>s.call());else for(let s of t){let r=e.get(s)||e.get(parseInt(s));!r||(i=m(i,()=>r.call()))}return i}thread(...t){if(this.disposed)return!1;this.$thread.active=!0;for(let e in this.graph.effects)for(let i of this.graph.effects[e].refs)for(let s of t){let[r,n,o]=this.matchRefs(s,i);!r||this.buildThread(s,i,o,n)}return this.runThread()}runThread(){let t=(r,n)=>{if(["ForOfStatement","ForInStatement"].includes(r.graph.type)&&n.every(o=>o.executionPlan.isIterationContractTarget)){let o=n.map(l=>l.executionPlan.iterationTarget);return this.fire(r.graph.lineage,"iterating",n),r.iterate(o)}return this.fire(r.graph.lineage,"executing",n),r.call()},e,i,s;for(;(i=this.$thread.sequence.shift())&&(s=[...this.$thread.entries.get(i)])&&this.$thread.entries.delete(i);)e=m(e,()=>{if(i.disposed||!i.filterRefs(s).length)return;this.$thread.current=i;let r=t(i,s);return m(r,()=>{for(let n of s)[].concat(n.executionPlan.assigneeRef||n.executionPlan.assigneeRefs||[]).forEach(o=>{i.buildThread([],o,[],0)})}),r});return m(e,()=>{let r=this.exits.get("return");return this.exits.clear(),this.$thread.current=null,this.$thread.active=!1,r})}buildThread(t,e,i,s=0,r=!1){let n=s>0;if(this.ownerContract){if(!this.compute(i)||e.condition!==void 0&&!this.assert(e.condition))return}else n||(n=i.length||e.condition!==void 0);let o=r?e.$subscriptions:e.subscriptions;Object.keys(o).forEach(l=>{let[u,h]=l.split(":"),a=f=>{!f||f.selectRefs(h,o[l],n?t:null)},c=this.locate(u);Array.isArray(c)?c.forEach(a):a(c)})}selectRefs(t,e,i=null){let s=this.$thread,r=this.graph.signals[t],n=(l,u)=>l.graph.lineage.localeCompare(u.graph.lineage,void 0,{numeric:!0}),o=(l,u=[],h={})=>{if(!s.active||s.current&&n(this,s.current)<0)return;let a=s.entries.get(this);if(a||(a=new Set,s.entries.set(this,a),s.sequence.push(this),s.sequence.sort(n)),a.add({...l,computes:u,executionPlan:h}),!h.assigneeRef&&["VariableDeclaration","AssignmentExpression"].includes(this.graph.type)){h.assigneeRefs=[];for(let c in this.graph.effects)h.assigneeRefs.push(...this.graph.effects[c].refs)}};for(let l of e){let u=r.refs[l];if(!i){o(u);continue}let[h,a,c]=this.matchRefs(i,u);if(!h)continue;if(a<=0){o(u,c);continue}let f=i.slice(-a),y="assignee"in r?this.graph.effects[r.assignee]:null;if(y){y.refs.forEach(d=>{if(d.depth.length){let[b,g,w]=this.matchRefs(f,d.depth),v=c.concat(w);if(b&&g>0){let M=d.path.concat(f.slice(-g));this.buildThread(M,d,v,g)}else b&&o(u,v,{assigneeRef:d})}else{let b=d.path.concat(f);this.buildThread(b,d,c,a)}});continue}if(a===1&&this.graph.type==="ForOfStatement"){o(u,c,{isIterationContractTarget:!0,iterationTarget:f[0]});continue}if(a===1&&this.graph.type==="ForInStatement"){o(u,c,{isIterationContractTarget:!0,iterationTarget:f[0]});continue}}}filterRefs(t){return t.filter(e=>{if(!!this.compute(e.computes)&&!(e.condition!==void 0&&!this.assert(e.condition)))return!0})}matchRefs(t,e){let i,s,r,n;Array.isArray(t)?(i=t,s=t.dotSafe?t.join("."):void 0):(i=t.path,s=t.$path),Array.isArray(e)?(r=e,n=e.dotSafe?e.join("."):void 0):(r=e.path,n=e.$path);let o=i.length-r.length;if(o>0&&([i,r,s,n]=[r,i,n,s]),s&&n)return[`${n}.`.startsWith(`${s}.`),o,[]];let l=[],u=a=>typeof a=="object"?a.name:a,h=(a,c)=>{if(!a||!c)return!1;let f=typeof a=="object"&&"memoId"in a,y=typeof c=="object"&&"memoId"in c;return f||y?(l.push(d=>(f?d[a.memoId]:u(a))===(y?d[c.memoId]:u(c))),!0):u(a)===u(c)};return[i.reduce((a,c,f)=>a&&h(c,r[f]),!0),o,l]}locate(t){let e=this.graph.lineage+"/",i=t+"/";if(i===e)return this;if(i.startsWith(e)){let s=t.slice(e.length).split("/"),r=this.subContracts.get(parseInt(s.shift()));if(s.length){if(r instanceof Map)return Array.from(r).reduce((n,[o,l])=>n.concat(l.locate(t)),[]);if(r)return r.locate(t)}return r}if(this.ownerContract)return this.ownerContract.locate(t)}compute(t){return!t.some(e=>e(this.contract.memo)===!1)}assert(t){if(typeof t=="string"&&t.includes(":")){let[s,r]=t.split(":");return this.locate(s).assert(r)}let e=this.graph.conditions[t],i=this.contract.memo;return typeof e.parent<"u"&&!this.assert(e.parent)?!1:typeof e.switch<"u"?e.cases.some(s=>i[s]===i[e.switch]):typeof e.whenNot<"u"?!i[e.whenNot]:typeof e.when<"u"?i[e.when]:!0}dispose(){this.params.isFunctionContract||(this.subContracts.forEach((t,e)=>{t instanceof Map?(t.forEach(i=>i.dispose()),t.clear()):t.dispose()}),this.subContracts.clear(),delete this.ownerContract,delete this.callee,delete this.params,delete this.contract.memo,this.disposed=!0)}createFunction(t,e=void 0){let i=t(),s=function(n,...o){let l=n.call(this===void 0?e:this,...o);return n.params.isSubscriptFunction&&n.params.apiVersion>1&&(l=m(l,u=>[u,n.thread.bind(n),n]),i=t(i)),l},r=i instanceof Promise||i.callee instanceof async function(){}.constructor?async function(){return m(i,n=>s.call(this,n,...arguments))}:function(){return s.call(this,i,...arguments)};return m(i,n=>{this.applyReflection(r,n)}),x(r,"properties",m(i,n=>{let o={type:n.params.functionType||"Program",apiVersion:n.params.apiVersion||1,isSubscriptFunction:n.params.isSubscriptFunction,sideEffects:n.graph.sideEffects||!1};if(n.params.isSubscriptFunction){o.dependencies=[];for(let[l,u]of Object.entries(n.graph.effects))o.dependencies.push(...u.refs.map(h=>h.path.map(a=>"name"in a?a.name:1/0)))}return o})),r}applyReflection(t,e){Object.defineProperty(e.callee,"length",{configurable:!0,value:e.callee.length-1});let i=e.callee.toString();Object.defineProperty(e.callee,"toString",{configurable:!0,value:(r=!1)=>!r&&e.graph.originalSource?e.graph.originalSource:i});let s={name:e.callee.name,length:e.callee.length,toString:e.callee.toString};e.params.isSubscriptFunction&&(e.params.apiVersion>1||(s={...s,thread:e.thread.bind(e),dispose:e.dispose.bind(e),runtime:e})),Object.keys(s).forEach(r=>{Object.defineProperty(t,r,{configurable:!0,value:s[r]})})}};var E=class extends C{static create(t,e=[],i={}){let r=i.async||t.graph.hoistedAwaitKeyword?Object.getPrototypeOf(async function(){}).constructor:Function,n=i.compileFunction?i.compileFunction(t.source,[t.identifier+""].concat(e)):new r(t.identifier+"",...e,t.source);return new this(null,t.graph,n,i)}static createFunction(t,e,i=[],s={},r,n=null){s={...s,functionType:"Constructor"},e instanceof Promise&&(s={...s,async:!0});let o=h=>h?new this(null,h.graph,h.callee,s):m(e,a=>l(this.create(a,i,s))),l=h=>{if(h.graph.originalSource&&!h.graph.originalSourceModified){let a=`${s.async||h.graph.hoistedAwaitKeyword?"async ":""}function ${t||"anonymous"}`,c=h.graph.originalSource.split(/\n/g).map(f=>`    ${f}`).join(`
`);h.graph.originalSource=`${a}(${i.join(", ")}) {
${c}
}`,h.graph.originalSourceModified=!0}return t&&Object.defineProperty(h.callee,"name",{configurable:!0,value:t}),h},u=this.prototype.createFunction(o,r);return x(u,"locations",m(e,h=>({locations:h.locations}))),u}};function S(...p){if(typeof window!="object")throw new Error("No window in context.");let t=P(typeof p[p.length-1]=="object"?p.pop():{}),e=O(p.pop()||""),i=p,s=r=>E.createFunction(void 0,r,i,t.runtimeParams,this,e);if(window.wq?.SubscriptCompiler&&!t.runtimeParams.async){let{parse:r,compile:n}=window.wq.SubscriptCompiler,o=r(e,t.parserParams);return s(n(o,t.compilerParams))}if(!window.wq?.SubscriptCompilerWorker){let o=`
        importScripts( '${document.querySelector('meta[name="subscript-compiler-url"]')?.content||"https://unpkg.com/@webqit/subscript/dist/compiler.js"}' );
        const { parse, compile } = self.wq.SubscriptCompiler;
        self.onmessage = e => {
            const { source, params } = e.data;
            const ast = parse( source, params.parserParams );
            const compilation = compile( ast, params.compilerParams );
            compilation.identifier = compilation.identifier.toString();
            e.ports[ 0 ]?.postMessage( compilation );
        };`;window.wq=window.wq||{},window.wq.SubscriptCompilerWorker=new Worker(`data:text/javascript;base64,${btoa(o)}`)}return s(new Promise(r=>{let n=new MessageChannel;wq.SubscriptCompilerWorker.postMessage({source:e,params:t},[n.port2]),n.port1.onmessage=o=>r(o.data)}))}Object.defineProperty(S,"inspect",{value:x});var A=p=>class extends p{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){[].concat(this.css).forEach(e=>{if(e.includes("{")&&e.includes(":")&&e.includes(";")){let i=this.shadowRoot.appendChild(document.createElement("style"));i.textContent=e}else{let i=this.shadowRoot.appendChild(document.createElement("link"));i.setAttribute("rel","stylesheet"),i.setAttribute("href",e)}})}get css(){return[]}};var F=class extends A(HTMLElement){connectedCallback(){this.autoMode=this.getAttribute("auto-mode"),this.visualizerElement=document.createElement("cfunctions-visualizer"),this.controlsElement=document.createElement("div"),this.controlsElement.classList.add("controls-element"),this.buttons={},["edit","play"].forEach(t=>{let e=t.substring(0,1).toUpperCase()+t.substring(1);this.buttons[t]=this.controlsElement.appendChild(document.createElement("button")),this.buttons[t].classList.add(t),this.buttons[t].setAttribute("title",e);let i=this.buttons[t].appendChild(document.createElement("i"));(this.getAttribute(`data-${t}-icon`)||`bi bi-${t==="edit"?"pencil":t}`).split(" ").map(n=>n.trim()).forEach(n=>i.classList.add(n)),this.buttons[t].appendChild(document.createElement("span")).append(" ",e),this.buttons[t].addEventListener("click",n=>{this.active&&this.active.classList.remove("active"),this.active=this.buttons[t],this.active.classList.add("active")})}),this.buttons.edit.addEventListener("click",t=>this.switchEditable(!0)),this.buttons.play.addEventListener("click",t=>this.switchEditable(!1)),this.shadowRoot.append(this.controlsElement,this.visualizerElement),super.connectedCallback(),setTimeout(()=>{this.visualizerElement.innerHTML=this.innerHTML,setTimeout(()=>{this.loadConsole(),this.autoMode&&this.buttons[this.autoMode].dispatchEvent(new MouseEvent("click"))},0)},0)}loadConsole(){this.fn=S(this.visualizerElement.source,{devMode:!0}),this.visualizerElement.visualize(this.fn,!1)}switchEditable(t){this.visualizerElement.editable=t,t?this.fn&&(this.fn.dispose(),this.fn=null):(this.fn||this.loadConsole(),this.fn())}get css(){return["https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css",`
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
                box-sizing: border-box;
            }
            :host {
                position: relative;
                display: block;
                background-color: rgb(75, 75, 75);
            }
            .controls-element button {
                display: inline-flex;
                align-items: center;
                background-color: transparent;
                padding: 0.5rem 1rem;
                border: none;
                color: silver;
            }
            .controls-element button:is(:hover, .active) {
                background-color: var(--active-bg-color, dimgray);
                color: var(--active-color, gainsboro);
            }
            .controls-element button .bi {
                margin-right: 0.5rem;
            }
            .controls-element button .bi.bi-play {
                font-size: larger;
            }

            @media (min-width: 800px) {
                :host(.layout2) {
                    display: flex;
                    display: -webkit-flex;
                }
                :host(.layout2) cfunctions-visualizer {
                    flex-grow: 1;
                }
                :host(.layout2) .controls-element {
                    flex-basis: 1rem;
                }
                :host(.layout2) .controls-element button {
                    width: 100%;
                    text-align: center;
                    display: block;
                    padding: 1rem;
                }
                :host(.layout2) .controls-element button span {
                    display: none;
                }
                :host(.layout2) .controls-element button .bi {
                    margin-right: 0;
                }
            }
            `]}};customElements.define("cfunctions-sandbox",F);})();
//# sourceMappingURL=sandbox-element.js.map