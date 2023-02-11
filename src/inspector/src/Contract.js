/**
 * @imports
 */
import Interactable from './Interactable.js';
import Ref from './Ref.js';

/**
 * @Path
 */
export default class Contract extends Interactable( HTMLElement ) {

    visualize( binding ) {
        Object.assign( this, binding );
        if ( !this.graph ) return;
        
        if ( this.subContracts ) {
            this.subContracts.forEach( subContract => {
                subContract.replaceWith( ...subContract.childNodes );
            } );
        }
        this.subContracts = new Map;
        this._textNodes = this.getTextNodes();
        for ( let contractId in this.graph.subContracts ) {
            let graph = this.graph.subContracts[ contractId ];
            let childInstance = this.createSubContract( { ownerContract: this, graph } );
            this.subContracts.set( graph.id, childInstance );
        }

        this.effects = new Map;
        this.signals = new Map;
        if ( this.refAnchors ) {
            for ( let anchorId in this.refAnchors ) {
                let anchor = this.refAnchors[ anchorId ];
                anchor.replaceWith( ...anchor.childNodes );
            }
        }
        this.refAnchors = {};
        this._textNodes = this.getTextNodes();
        const renderRefs = type => {
            for ( let referenceId in this.graph[ type ] ) {
                let referenceInstance = this.createReference( { ownerContract: this, ...this.graph[ type ][ referenceId ] } );
                this[ type ].set( referenceId, referenceInstance );
            }
        };
        renderRefs( 'effects' );
        renderRefs( 'signals' );

        this.setAttribute( 'title', this.graph.type + ' Contract' );
        this.on( 'mouseenter', () => {
            this.setState( 'block', 'hover', true, 0 );
        } ).on( 'mouseleave', () => {
            this.setState( 'block', 'hover', false );
        } );
        this.observe( ( event, refs ) => {
            this.setState( 'block', 'runtime-active', true, 100 );
            refs.forEach( ref => {
                const referenceInstance = this.signals.get( ref.referenceId + '' );
                if ( !referenceInstance ) return;
                referenceInstance.refs.get( ref.id ).setState( 'path', 'runtime-active', true, 100 );
            } );
        } );
    }

    get program() {
        if ( this.ownerContract ) return this.ownerContract.program;
        return this.runtime;
    }

    runThread( ...refs ) {
        const runtimeContract = this.program.locate( this.graph.lineage );
        if ( !runtimeContract ) return;
        return runtimeContract.thread( ...refs );
    }

    observe( callback ) {
        return this.program.observe( this.graph.lineage, callback );
    }

    createSubContract( childBinding ) {
        let childInstance = document.createElement( 'cfunctions-contract' );
        this.insertNode( childInstance, childBinding.graph.loc, 'contract' );
        childInstance.visualize( childBinding );
        return childInstance;
    }

    createReference( referenceBinding ) {
        let referenceInstance = { ...referenceBinding, refs: new Map };
        if ( 'assignee' in referenceBinding ) {
            referenceInstance.assignee = this.effects.get( referenceBinding.assignee + '' );
        }
        for ( let refDef of referenceBinding.refs ) {
            let refInstance = this.createRef( { ownerReference: referenceInstance, ...refDef } );
            referenceInstance.refs.set( refDef.id, refInstance );
        }
        return referenceInstance;
    }

    createRef( refBinding ) {
        let refInstance = new Ref;
        const createAnchor = element => {
            let [ start, end ] = element.loc, anchorId = start + '-' + end;
            let anchor = this.refAnchors[ anchorId ];
            if ( !anchor ) {
                anchor = document.createElement( 'span' );
                this.insertNode( anchor, [ start, end ], 'ref' );
                this.refAnchors[ anchorId ] = anchor;
            }
            return anchor;
        };
        refBinding = { ...refBinding, path: refBinding.path.map( element => {
            let anchor = createAnchor( element );
            return { anchor, ...element };
        } ), };
        if ( refBinding.depth ) {
            refBinding.depth = refBinding.depth.map( element => {
                let anchor = createAnchor( element );
                return { anchor, ...element };
            } );
        }
        refInstance.bind( refBinding );
        return refInstance;
    }

    insertNode( node, loc, type ) {
        let [ start, end ] = loc;
        let ownLocStart = this.graph.loc ? this.graph.loc[ 0 ] : 0;
        let [ startOffsetNode, startOffset ] = this.resolveOffset( start - ownLocStart ),
            [ endOffsetNode, endOffset ] = this.resolveOffset( end - ownLocStart, false );
        let range = new Range;
        if ( type === 'contract' ) {
            if ( startOffset === 0 
            && startOffsetNode.parentNode.nodeName === 'SPAN'  ) {
                range.setStartBefore( startOffsetNode.parentNode );
            } else {
                range.setStart( startOffsetNode, startOffset );
            }
            if ( endOffset === ( endOffsetNode.nodeValue || '' ).length 
            && endOffsetNode.parentNode.nodeName === 'SPAN' ) {
                range.setEndAfter( endOffsetNode.parentNode );
            } else {
                range.setEnd( endOffsetNode, endOffset );
            }
        } else {
            range.setStart( startOffsetNode, startOffset );
            range.setEnd( endOffsetNode, endOffset );
        }
        range.surroundContents( node );
        return node;
    }

    resolveOffset( offset, isStart = true ) {
        return this._textNodes.reduce( ( [ prevNodeDef, final, prevSum ], nodeDef ) => {
            if ( final === null ) {
                let currentSum = prevSum + nodeDef.length;
                if ( offset <= currentSum && !nodeDef.isBlank ) {
                    let subOffset = offset - prevSum;
                    if ( !isStart && subOffset === 0 ) {
                        // We must not end at the start of a text node
                        return [ prevNodeDef.node, prevNodeDef.length ];
                    }
                    if ( ( !isStart || subOffset < nodeDef.length ) ) {
                        // We're sure not starting at the end of a text node
                        return [ nodeDef.node, subOffset ];
                    }
                }
                [ prevNodeDef, final, prevSum ] = [ nodeDef, final, currentSum ];
            }
            return [ prevNodeDef, final, prevSum ];
        }, [ null, null, 0 ] );
    }

    getTextNodes( from = this ) {
        let rejectScriptTextFilter = {
            acceptNode: function( node ) {
                if ( node.parentNode.nodeName === 'SCRIPT' ) return;
                return window.NodeFilter.FILTER_ACCEPT;
            }
        };
        let walker = window.document.createTreeWalker( from || this, window.NodeFilter.SHOW_TEXT, rejectScriptTextFilter, false );
        let textNodes = [], node;
        while( node = walker.nextNode() ) {
            let textContent = node.nodeValue || '';
            textNodes.push( { node, length: textContent.length, isBlank: textContent.trim().length === 0 } );
        }
        return textNodes;
    }

    setState( type, state, value, duration = 100 ) {
        if ( value && this.ownerContract ) {
            this.ownerContract.setState( type, state, false );
        }
        this.setStateCallback( type, state, value, duration, () => {
            if ( value ) {
                this.classList.add( `${ type }-${ state }` );
            } else {
                this.classList.remove( `${ type }-${ state }` );
            }
        } );
    }

    on( eventName, callback ) {
        this.addEventListener( eventName, callback.bind( this ) );
        return this;
    }

}