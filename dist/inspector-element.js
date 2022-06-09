(()=>{var c=l=>class extends l{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){[].concat(this.css).forEach(e=>{if(e.includes("{")&&e.includes(":")&&e.includes(";")){let t=this.shadowRoot.appendChild(document.createElement("style"));t.textContent=e}else{let t=this.shadowRoot.appendChild(document.createElement("link"));t.setAttribute("rel","stylesheet"),t.setAttribute("href",e)}})}get css(){return[]}};var i=class extends c(HTMLElement){connectedCallback(){this._contentSlot=document.createElement("slot"),this.shadowRoot.append(this._contentSlot),super.connectedCallback(),this._contentSlot.addEventListener("slotchange",()=>{setTimeout(()=>{let n=this._contentSlot.assignedNodes().reduce((e,t)=>e||(t.subscript instanceof Map?t:null),null);if(n){this.inspectElement(n);let e=this.getAttribute("active");e&&this.inspectFunction(e)}else console.error("No subscript element found.")},0)})}inspectElement(n){this.consoleElement&&(this.consoleElement.remove(),this.controlsElement.remove()),this.consoleElement=document.createElement("subscript-console"),this.controlsElement=document.createElement("div"),this.controlsElement.classList.add("controls-element"),this.shadowRoot.append(this.consoleElement,this.controlsElement),this.buttons={},n.subscript.forEach((e,t)=>{let s=typeof t=="number"?`script:${t}`:`${t}()`;this.buttons[t]=this.controlsElement.appendChild(document.createElement("button")),this.buttons[t].setAttribute("script-id",t),this.buttons[t].setAttribute("title",s),this.buttons[t].appendChild(document.createElement("span")).append(" ",s);let r=this.buttons[t].appendChild(document.createElement("i"));(this.getAttribute("data-icons")||`bi bi-${typeof t=="number"?"code":"braces"}`).split(" ").map(o=>o.trim()).forEach(o=>r.classList.add(o)),this.buttons[t].addEventListener("click",o=>{this.active&&this.active.classList.remove("active"),this.active=this.buttons[t],this.active.classList.add("active"),this.inspectFunction(e)})})}inspectFunction(n){if(!n||typeof n=="string"){let e=n;if(n||(e=Object.keys(this.buttons)[0]),e){let t=this.buttons[e],s=new MouseEvent("click",{view:window});t.dispatchEvent(s)}return}this.consoleElement.bind(n)}get css(){return["https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css",`
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
            .controls-element {
                position: relative;
                z-index: 10;
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
                background-color: dimgray;
                color: gainsboro;
            }
            .controls-element button .bi {
                margin-left: 0.5rem;
            }
            `]}};customElements.define("subscript-inspector",i);})();
//# sourceMappingURL=inspector-element.js.map
