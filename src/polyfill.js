/*!
Copyright 2012 Adobe Systems Inc.;
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
CSS Regions support
Author: Mihai Corlan (mcorlan@adobe.com, @mcorlan)
*/

/**
 * This is the object responsible for parsing the regions extracted by CSSParser.
 * Retrieves the DOM elements that formed the named flows and regions chains.
 * Flows the content into the region chain.
 * Listens for changes: region chains size or visibility changes and re-flows
 * the content.
 *
 */
window.CSSRegions = function(scope) {
    
    function Polyfill() {
        this.setup();
    }
    
    Polyfill.prototype = {
        // flag if CSS Regions is natively supported in the browser
        hasNativeSupport: false,
        
        // parse only adobe prefix for now
        prefixes: {
            css: '-adobe-',
            om: 'adobe'
        },
        
        getPrefixedProperty: function(property){
            return this.prefixes.css.concat(property)
        },
        
        getPrefixedOMProperty: function(property){
            return this.prefixes.om.concat((property.charAt(0).toUpperCase() + property.slice(1)))
        },
        
        getPrefixedEvent: function(eventName){
            return this.prefixes.om.concat(eventName)
        },
        
        init: function() {
            
            var self = this
            
            if (!window.StyleLoader){
                console.error("Missing StyleLoader.js")
                return
            }
            
            /* Load all stylesheets then feed them to the parser */
            new StyleLoader(function(){
                return function(stylesheets){
                    self.onStylesLoaded(stylesheets)
                }
            }())
        },
        
        setup: function(){
            // Array of NamedFlow objects.
            this.namedFlows = [];
            // instance of Collection
            this.namedFlowCollection = null;
        },
        
        onStylesLoaded: function(stylesheets){
            
            if (!window.CSSParser){
                console.error("Missing CSSParser.js")
                return
            }
            
            var rules, flowName, contentNodesSelectors, regionsSelectors, 
                parser = new CSSParser();
                
            // setup or reset everything
            this.setup(); 
            
            stylesheets.forEach(function(sheet){
                // Parse the stylesheet for rules
                parser.parse(sheet.cssText);
            })
            
            if (parser.cssRules.length === 0) {
                console.log("There is no inline CSS for CSS Regions!");
                return;
            }  
            
            // Parse the rules and look for "flow-into" and "flow-from" rules;
            rules = this.getNamedFlowRules(parser.cssRules); 
                             
            for (flowName in rules) {
                contentNodesSelectors = rules[flowName].contentNodesSelectors;
                regionsSelectors = rules[flowName].regionsSelectors;
                // The NamedFlow will collect and sort the DOM nodes based on selectors provided
                this.namedFlows.push(new NamedFlow(flowName, contentNodesSelectors, regionsSelectors));
            } 
                                                                            
            this.namedFlowCollection = new Collection(this.namedFlows, 'name');
            // Expose methods to window/document as defined by the CSS Regions spec
            this.exposeGlobalOM();
            
            // If there are CSS regions move the content from named flows into region chains
            this.doLayout();  
        },
        
        getNamedFlowRules: function(cssRules) {
            var rule, property, value,
                l = cssRules.length,
                rules = {},
                flowProperty = this.getPrefixedProperty('flow'),
                flowIntoProperty = this.getPrefixedProperty('flow-into'),
                flowFromProperty = this.getPrefixedProperty('flow-from');

            for (var i = 0; i < l; i++) {
                rule = cssRules[i];
                for (property in rule.style) {
                    if (property.indexOf(flowProperty) !== -1) {
                        
                        value = rule.style[property];  
                        rules[value] = rules[value] || {contentNodesSelectors: [], regionsSelectors: []};
                         
                        // collect content nodes
                        if (property.indexOf(flowIntoProperty) !== -1) {
                            rules[value].contentNodesSelectors.push(rule.selectorText);
                        }
                        
                        // collect regions
                        if (property.indexOf(flowFromProperty) !== -1) {
                            rules[value].regionsSelectors.push(rule.selectorText);
                        }
                        break;
                    }
                }
            }
            
            return rules;
        },
        
        doLayout: function() {
            if (!this.namedFlows || !this.namedFlows.length) {
                console.warn("No named flow / regions CSS rules");
                return;
            }
            executionQueue++;
            if (executionQueue > 1) {
                return;
            }
            while (executionQueue > 0) {
                flowContentIntoRegions();
                executionQueue--;
            }
        },
                                   
        // Polyfill necesary objects/methods on the document/window as specified by the CSS Regions spec
        exposeGlobalOM: function() { 
            // keeping non-prefixed value on document because part of the polyfill logic access it directly from the document
            // TODO: rewrite rogue layout methods to sit inside the polyfill scope and avoid global queries to the document. 
            
            var namedFlowsAccessor = 'getNamedFlows',
                prefixedNamedFlowsAccessor = this.getPrefixedOMProperty(namedFlowsAccessor);

            document[namedFlowsAccessor] = document[prefixedNamedFlowsAccessor] = this.getNamedFlows.bind(this);
        },
          
        /*
            Returns a map of NamedFlow objects where their 'name' attribute are the map keys.
            Also accessible from window.getNamedFlows()
        */
        getNamedFlows: function() {
            return this.namedFlowCollection;
        },

        addSourceToNamedFlow: function(flowName, el) {
            var namedFlow = this.getNamedFlows().namedItem(flowName);
            if (!namedFlow) {
                namedFlow = new NamedFlow(flowName);
                this.namedFlows.push(namedFlow);
                this.namedFlowCollection = new Collection(this.namedFlows, 'name');
            }
            namedFlow.contentNodes.push(el);
            regionsValidFlag[namedFlow.name] = false;
        },
        addRegionToNamedFlow: function(flowName, el) {
            var namedFlow = this.getNamedFlows().namedItem(flowName);
            if (!namedFlow) {
                namedFlow = new NamedFlow(flowName);
                this.namedFlows.push(namedFlow);
                this.namedFlowCollection = new Collection(this.namedFlows, 'name');
            }
            namedFlow.regions.push(el);
            regionsValidFlag[namedFlow.name] = false;
        },
          
        "NamedFlow": NamedFlow,
        "Collection": Collection
    };

    var executionQueue = 0;
    var regionsValidFlag = {};

    /**
     * Returns the nodes ordered by their DOM order
     * @param arrSelectors
     * @return {Array}
     */
    var orderNodes = function(arrSelectors) {
        var i, j, m, nodeList,
            tmp = [],
            l = arrSelectors.length;

        for (i = 0; i<l; i++) {
            nodeList = document.querySelectorAll(arrSelectors[i]);
            for (j = 0, m = nodeList.length; j < m; ++j) {
                tmp.push(nodeList[j]);
            }
        }
        return getFilteredDOMElements(
                    document.body,
                    NodeFilter.SHOW_ELEMENT,
                    { acceptNode: function(node) {
                                if (tmp.indexOf(node) >= 0) {
                                    return NodeFilter.FILTER_ACCEPT;
                                } else {
                                    return NodeFilter.FILTER_SKIP;
                                }
                            }
                     });
    };

    /**
     * Returns an array of elements that will be used as the source
     * @param namedFlows
     * @return {Array}
     */
    var getNodesForFlow = function(sourceElements) {
        var i, l, el,
            sourceNodes = [];
        for (i = 0, l = sourceElements.length; i < l; i++) {
            el = sourceElements[i].cloneNode(true);
            sourceNodes.push(el);
            if (el.style.display === "none") {
                el.style.display = el["data-display"] || "";
            }
            if (getComputedStyle(sourceElements[i]).display !== "none") {
                sourceElements[i]["data-display"] = sourceElements[i].style.display;
                sourceElements[i].style.display = "none";
            }
        }
        return sourceNodes;
    };

    /**
     * Returns an array of elements that forms the regions. If an element is hidden (display:none) it is excluded.
     * @param regions
     * @return {Array}
     */
    var getRegionsForFlow = function(regions, namedFlow) {
        var i, l, el,
            destinationNodes = [];
        for (i = 0, l = regions.length; i < l; i++) {
            el = regions[i];
            if (getComputedStyle(el).display !== "none") {
                destinationNodes.push(el);
                el["data-display"] = true;
                if (namedFlow.lastRegionWithContentIndex < i
                        && ( el["data-w"] !== getComputedStyle(el).width
                               || el["data-h"] !== getComputedStyle(el).height) ) {
                    invalidateRegions([namedFlow.name]);
                }
            } else if (el["data-display"]) {
                invalidateRegions([namedFlow.name]);
                delete(el["data-display"]);
            }
        }
        return destinationNodes;
    };

    /**
     * This is where the regions parsed by the CSS parser are actually put to used.
     * For each region rule we flow the content.
     * @param regions
     */
    var flowContentIntoRegions = function() {
        var currentRegion, currentFlow, j, m, i, l, destinationNodes, el, tmp, nextSibling,
            sourceNodes = [],
            flows = document.getNamedFlows();
            
        var regionOversetProperty = polyfill.getPrefixedOMProperty('regionOverset') 
            
        for (j = 0, m = flows.length; j < m; j++) {
            currentFlow = flows[j];
            currentFlow.regionsByContent = {content: [], regions: []};
            currentFlow.firstEmptyRegionIndex = -1;

            // Remove regions with display:none;
            destinationNodes = getRegionsForFlow(currentFlow.getRegions(), currentFlow);
            currentFlow.overset = false;

            if (regionsValidFlag[currentFlow.name]) { // Can we skip some of the layout?
                tmp = destinationNodes[currentFlow.lastRegionWithContentIndex].childNodes;
                for (i = 0, l = tmp.length; i < l; ++i) {
                    sourceNodes.push(tmp[i]);
                }
                i = currentFlow.lastRegionWithContentIndex;
            } else { // Build the source to be flown from the region names
                sourceNodes = getNodesForFlow(currentFlow.contentNodes);
                i = 0;
            }

            // Flow the source into regions
            for (l = destinationNodes.length; i < l; i++) {
                currentRegion = destinationNodes[i];
                currentRegion.innerHTML = "";
                // We still have to clear the possible content for the remaining regions
                // even when we don't have anymore content to flow.
                if (sourceNodes.length === 0) {
                    if (currentFlow.firstEmptyRegionIndex === -1) {
                        currentFlow.firstEmptyRegionIndex = i;
                    }
                    currentRegion[regionOversetProperty] = "empty";
                    continue;
                }
                el = sourceNodes.shift();
                // The last region gets all the remaining content
                if ((i + 1) === l) {
                    nextSibling = currentRegion.nextSibling || null;
                    tmp = currentRegion.parentNode;
                    tmp.removeChild(currentRegion);
                    while (el) {
                        currentRegion.appendChild(el.cloneNode(true));
                        addRegionsByContent(el, -1, currentRegion, currentFlow);
                        el = sourceNodes.shift();
                    }
                    if (nextSibling) {
                        tmp.insertBefore(currentRegion, nextSibling);
                        nextSibling = null;
                    } else {
                        tmp.appendChild(currentRegion);
                    }
                    tmp = null;
                    currentFlow.lastRegionWithContentIndex = i;
                    // Check if overflows
                    if (checkForOverflow(currentRegion)) {
                        currentRegion[regionOversetProperty] = "overset";
                        currentFlow.overset = true;
                    }
                } else {
                    while (el) {
                        el = addContentToRegion(el, currentRegion, currentFlow);
                        currentRegion["data-w"] = getComputedStyle(currentRegion).width;
                        currentRegion["data-h"] = getComputedStyle(currentRegion).height;
                        if (el) {
                            // If current region is filled, time to move to the next one
                            sourceNodes.unshift(el);
                            break;
                        } else {
                            el = sourceNodes.shift();
                        }
                    }
                    currentRegion[regionOversetProperty] = "fit";
                }
                regionsValidFlag[currentFlow.name] = true;
            }  
            // Dispatch regionLayoutUpdate event
            if (currentFlow.regions.length > 0) {

                // TODO: DO NOT access the polyfill like this. This whole method needs to go in the polyfill scope
                var eventName = polyfill.getPrefixedEvent('regionlayoutupdate')
                currentFlow.fire({type: eventName, target: currentFlow});
            }
        }
    };

    /**
     * Adds the elemContent into region. If the content to be consumed overflows the region
     * returns the overflow part as a DOM element. If not returns null.
     * @param elemContent
     * @param region
     * @return null or a DOM element
     */
    var addContentToRegion = function(elemContent, region, namedFlow) {
        var currentNode, l, arrString, txt,
            indexOverflowPoint = -1,
            ret = null,
            nodes = [],
            removedContent = [],
            el = elemContent;

        region.appendChild(el);

        // Oops it overflows. Can we split the content or is it a lost battle?
        if ( checkForOverflow(region) ) {
            region.removeChild(el);
            // Find all the textNodes, IMG, and FIG
            nodes = getFilteredDOMElements(el,
                                    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                                    { acceptNode: function(node) {
                                                if (node.nodeName.toLowerCase() === 'img'
                                                        || node.nodeName.toLowerCase() === 'fig'
                                                        || (node.nodeName.toLowerCase() === '#text'
                                                            && node.data.replace(/^\s+|\s+$/g,"") !== "")) {
                                                    return NodeFilter.FILTER_ACCEPT;
                                                } else {
                                                    return NodeFilter.FILTER_SKIP;
                                                }
                                            }
                                     });
            // If it is an image just quit. No way to split this between multiple regions.
            if (nodes.length === 1
                    && (nodes[0].nodeName.toLowerCase() === "img" || nodes[0].nodeName.toLowerCase() === "fig")) {
                ret = elemContent;
            // Let's try to do some splitting of the elemContent maybe we can fit a part of it in the current region.
            } else {
                // Set the nodes index order withing their parents
                setIndexOrder(nodes);
                // Let's see if we can fit the content if we remove some of the nodes
                indexOverflowPoint = findIndexForOverflowPoint(region, el, nodes, removedContent);
                if (indexOverflowPoint < 0 ) {   // We couldn't find a way to split the content
                    ret = elemContent;
                } else {        // Try splitting the TextNode content to fit in
                    currentNode = nodes[indexOverflowPoint];
                    if (currentNode.nodeName === "#text") {
                        txt = removedContent[indexOverflowPoint].replace(/^\s+|\s+$/g,"");
                        arrString = txt.split(" ");
                        l = findMaxIndex(region, el, currentNode, arrString);
                        removedContent[indexOverflowPoint] = buildText(arrString, l, arrString.length - 1);
                    }
                    region.appendChild(removeEmptyHTMLElements(el.cloneNode(true)));
                    // Build the RegionsByContent Map for the current NamedFlow
                    addRegionsByContent(region.lastChild, region, namedFlow);
                    assembleUnusedContent(indexOverflowPoint, nodes, removedContent, el);
                    ret = el;
                }
            }
        } else {
            addRegionsByContent(el, region, namedFlow);
        }
        return ret;
    };

    var setIndexOrder = function(nodes) {
          var i, l, index, sibling, currentNode;
          for (i = 0, l = nodes.length; i < l; i++) {
              currentNode = nodes[i];
              if (currentNode.nodeName === "#text") {
                  continue;
              }
              index = 0;
              sibling = currentNode;
              while( (sibling = sibling.previousSibling) !== null ) {
                  index++;
              }
              currentNode["data-index"] = index;
          }
      };

    var findIndexForOverflowPoint = function(region, el, nodes, removedContent) {
        var currentNode, j, l, m,
            i = nodes.length,
            k = nodes.length,
            iMin = 0,
            iMax = nodes.length - 1;

        while (iMax >= iMin) {
            l = iMin + Math.round((iMax - iMin) / 2);
            for (i = l; i < k; i++ ) { // Remove content
                currentNode = nodes[i];
                if (currentNode.nodeName === "#text") {
                    if (currentNode.data !== "") {
                        removedContent[i] = currentNode.data;
                        currentNode.data = "";
                    } else {
                        break;
                    }
                } else {
                    if (currentNode.parentNode) {
                        removedContent[i] = currentNode.parentNode;
                        currentNode.parentNode.removeChild(currentNode);
                    } else {
                        break;
                    }
                }
            }
            region.appendChild(el);
            if ( checkForOverflow(region) ) {
                iMax =  l - 1;
                if (iMax < iMin) {
                    iMin = iMax;
                }
            } else {
                iMin = l + 1;
                if (iMax >= iMin) {
                    m = iMin + Math.round((iMax - iMin) / 2) + 1;
                    // Put back content that was removed
                    for (j = l; j < m; j++) {
                        currentNode = nodes[j];
                        if (currentNode.nodeName === "#text") {
                            currentNode.data = removedContent[j];
                        } else {
                            removedContent[j].insertBefore(currentNode, removedContent[j].childNodes.item(currentNode["data-index"]));
                        }
                        delete(removedContent[j]);
                    }
                }
            }
            region.removeChild(el);
        }
        return l;
    };

    /**
     * Remove empty HTML elements
     * @param elem
     * @return elem
     */
    var removeEmptyHTMLElements = function(elem) {
        var node, nodes, lastContentNode;
        // Find all the textNodes, IMG, and FIG
        nodes = getFilteredDOMElements(elem,
                    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                    { acceptNode: function(node) {
                                if (node.nodeName.toLowerCase() === 'img'
                                        || node.nodeName.toLowerCase() === 'fig'
                                        || (node.nodeName.toLowerCase() === '#text'
                                            && node.data.replace(/^\s+|\s+$/g,"") !== "")) {
                                    return NodeFilter.FILTER_ACCEPT;
                                } else {
                                    return NodeFilter.FILTER_SKIP;
                                }
                            }
                     });

        lastContentNode = nodes[nodes.length - 1];
        node = lastContentNode.nextSibling;
        while (node) {
            deleteEmtpyElement(node);
            node = node.nextSibling;
        }
        node = lastContentNode.parentNode.nextSibling;
        while (node) {
            deleteEmtpyElement(node);
            node = node.nextSibling;
        }
        node = lastContentNode.parentNode;
        while (node) {
            if (node.parentNode === elem) {
                while (node.nextSibling) {
                    node.parentNode.removeChild(node.nextSibling);
                }
                break;
            }
            node = node.parentNode;
        }
        return elem;
    };

    var deleteEmtpyElement = function(elem) {
        var nodes, i, currentNode;
        if (elem.nodeName === "#text") {
            elem.parentNode.removeChild(elem);
            return;
        }
        nodes = elem.childNodes;
        for (i = nodes.length - 1; i >= 0; i--) {
            currentNode = nodes.item(i);
            if (currentNode.nodeName !== "#text") {
                if (currentNode.childNodes.length === 0) {
                    currentNode.parentNode.removeChild(currentNode);
                } else {
                    deleteEmtpyElement(currentNode);
                }
            } else {
                currentNode.parentNode.removeChild(currentNode);
            }
        }
        if (elem.childNodes.length === 0) {
            elem.parentNode.removeChild(elem);
        }
    };

    var addRegionsByContent = function(elemContent, region, namedFlow) {
        var i, l, arr, el, k, nodes;
        nodes = getFilteredDOMElements(elemContent,
                        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                        { acceptNode: function(node) {
                                    if (node.nodeName.toLowerCase() === 'img'
                                            || node.nodeName.toLowerCase() === 'fig'
                                            || (node.nodeName.toLowerCase() === '#text'
                                                && node.data.replace(/^\s+|\s+$/g,"") !== "")) {
                                        return NodeFilter.FILTER_ACCEPT;
                                    } else {
                                        return NodeFilter.FILTER_SKIP;
                                    }
                                }
                         });
        if (!namedFlow.regionsByContent) {
            namedFlow.regionsByContent = {content: [], regions: []};
        }
        for (i = 0, l = nodes.length; i < l; i++) {
            el = nodes[i];
            if (el.nodeName.toLowerCase() === "#text") {
                el = el.parentNode;
            }
            k = namedFlow.regionsByContent["content"].indexOf(el);
            if (k === -1) {
                namedFlow.regionsByContent["content"].push(el);
                k = namedFlow.regionsByContent["content"].length - 1;
            }
            arr = namedFlow.regionsByContent["regions"][k] || [];
            arr.push(region);
            namedFlow.regionsByContent["regions"][k] = arr;
        }
    };

    /**
     * Finds the max index that allows adding text from arrString to the el without overflowing the region.
     * @param region
     * @param el
     * @param currentNode
     * @param arrString
     * @return {Number}
     */
    var findMaxIndex = function(region, el, currentNode, arrString) {
        var l = 0,
            iMin = 0,
            iMax = arrString.length - 1;

        while (iMax >= iMin) {
            l = iMin + Math.round((iMax - iMin) / 2);
            currentNode.data = buildText(arrString, 0, l-1);
            region.appendChild(el);
            if ( checkForOverflow(region) ) {
                iMax =  l - 1;
                if (iMax < iMin) {
                    iMin = iMax;
                }
            } else {
                iMin = l + 1;
            }
            region.removeChild(el);
        }
        return l;
    };

    /**
     * Puts back the content removed in order to fit the parent element in the current region
     * and deletes the content consumed by the current region.
     * @param indexOverflowPoint
     * @param nodes
     * @param removedContent
     */
    var assembleUnusedContent = function(indexOverflowPoint, nodes, removedContent, elem) {
        var currentNode, i, l, node,
            arrElements = [];
        // Put back the leftovers not consumed by the current region
        for (i = indexOverflowPoint, l = nodes.length; i < l; i++) {
            currentNode = nodes[i];
            if (currentNode.nodeName === "#text") {
                currentNode.data = removedContent[i];
            } else {
                removedContent[i].insertBefore(currentNode, removedContent[i].childNodes.item(currentNode["data-index"]));
            }
        }
        // Delete the content that was already consumed by the current region
        for (i = 0; i < indexOverflowPoint; i++) {
            currentNode = nodes[i];
            if (currentNode.nodeName === "#text") {
                node = currentNode.parentNode;
                node.removeChild(currentNode);
                while (node && node.childNodes.length === 0) {
                    node = node.parentNode;
                    node.removeChild(node.childNodes.item(0));
                }
                if (node) {
                    arrElements.push(node);
                }
            } else {
                arrElements.push(currentNode.parentNode);
                currentNode.parentNode.removeChild(currentNode);
            }
        }
        // Remove empty HTML elements
        for (i = 0, l = arrElements.length; i < l; i++) {
            node = arrElements[i];
            while (node && node.childNodes.length === 0) {
                node = node.parentNode;
                if (node)
                    node.removeChild(node.childNodes.item(0));
            }
        }
        node = nodes[indexOverflowPoint].parentNode;
        while (node) {
            if (node.parentNode === elem) {
                while (node.previousSibling) {
                    node.parentNode.removeChild(node.previousSibling);
                }
                break;
            }
            node = node.parentNode;
        }

    };

    /**
     * Returns an array of elements that are children of the root parameter and satisfy the whatElements and condition
     * filtering options
     * @param root
     * @param whatElements
     * @param condition
     * @return {Array}
     */
    var getFilteredDOMElements = function(root, whatElements, condition) {
        var nodeIterator, currentNode,
            nodes = [];
        // createNodeIterator works in FF 3.5+, Chrome 1+, Opera 9+, Safari 3+, IE9+
        // https://developer.mozilla.org/en-US/docs/DOM/Document.createNodeIterator
        nodeIterator = document.createNodeIterator(root, whatElements, condition, false);
        while (currentNode = nodeIterator.nextNode()) {
            nodes.push(currentNode);
        }
        return nodes;
    };

    /**
     * Returns a string built by joining the arr elements between the i & l indexes
     * @param arr string array
     * @param i start index
     * @param l end intex
     * @return {String}
     */
    var buildText = function(arr, i, l) {
        return arr.slice(i, l+1).join(" ") + " ";
    };

    /**
     * Returns true if the argument has content that overflows.
     * @param el
     * @return {Boolean}
     */
    var checkForOverflow = function(el) {
        var isOverflowing,
            curOverflow = el.style.overflow;
        if ( !curOverflow || curOverflow === "visible" ) {
            el.style.overflow = "hidden";
        }
        isOverflowing = el.clientHeight < (el.scrollHeight - 1);
        el.style.overflow = curOverflow;
        return isOverflowing;
    };

    var invalidateRegions = function(arr) {
        var j, m, flows;
        if (arr && arr.length) {
            arr.forEach(function(key){
                regionsValidFlag[key] = false;
            });
        } else {
            flows = document.getNamedFlows();
            for (j = 0, m = flows.length; j < m; j++) {
                regionsValidFlag[flows[j].name] = false;
            }
        }
    };

    function EventManager() {

    };
    EventManager.prototype = {
        constructor: EventManager,

        addEventListener: function(type, listener) {
            if (!this._listeners[type]) {
              this._listeners[type] = [];
            }
            this._listeners[type].push(listener);
            polyfill.doLayout();
        },

        fire: function(event) {
            var listeners, i, l;
            if (this._listeners[event.type] instanceof Array){
                listeners = this._listeners[event.type];
                for (i = 0, l = listeners.length; i < l; i++){
                    listeners[i].call(this, event);
                }
            }
        },

        removeEventListener: function(type, listener) {
            var listeners, i, l;
            if (this._listeners[type] instanceof Array) {
                listeners = this._listeners[type];
                for (i = 0, l = listeners.length; i < l; i++){
                    if (listeners[i] === listener){
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }; 
    
    /*
        Turns an array into a collection.
        Collection items can be iterated over like an array.
        
        Collection items can be accessed by:
        - index
        - index() method
        - namedItem() method
        
        @param {Array} arr The source array
        @param {String} key Optional key found on each item in the source array, 
                            used as index in .namedItem() accessor
                            
        @return {Object}
    */
    function Collection(arr, key) {
        var i, l;

        if (typeof arr.pop != 'function' ) {
            throw "Invalid input. Expected an array, got: " + typeof arr;
        }                   
        
        this.map = {};
        this.length = 0;
        
        for (i = 0, l = arr.length; i < l; i++) {
            this[i] = arr[i];
            this.length++;
            
            // build a map indexed with specified object key for quick access
            if (key && arr[i][key]) {
                this.map[arr[i][key]] = this[i];
            }
        }
    }   
    
    Collection.prototype = {
        /*
            Get item by numeric index
            @param {Number} index
        */
        item: function(index) {
            return this[index] || null;
        },

        /*
            Get item by item key 
            @param {String} key Optional index key specified in the constructor
        */
        namedItem: function(key) {
            return this.map[key] || null;
        }
    }

    /*
        NamedFlow obeject to polyfill the CSS Regions spec one
        
        @param {String} flowName The identifier of the flow
        @param {Array} contentNodesSelectors List of selectors of nodes to be collected into the named flow
        @param {Array} regionsSelectors List of selectors of nodes to be used as regions
    */
    function NamedFlow(flowName, contentNodesSelectors, regionsSelectors) {
        this.name = flowName || 'none';
        this.overset = true;   
        this.contentNodes = [];
        this.regions = [];
        this.regionsByContent = {};
        this._listeners = {};
        this.firstEmptyRegionIndex = -1;
        this.lastRegionWithContentIndex = -1;

        if (contentNodesSelectors && contentNodesSelectors.length) {
            this.contentNodes = orderNodes(contentNodesSelectors);
        }          

        if (regionsSelectors && regionsSelectors.length) {
            this.regions = orderNodes(regionsSelectors);
        }          
        
    };
    NamedFlow.prototype = new EventManager();
    NamedFlow.prototype.constructor = NamedFlow;
    NamedFlow.prototype.getRegions = function() {
        return this.regions;
    };
    NamedFlow.prototype.getRegionsByContent = function(elem) {
        var k, ret = [];
        k = this.regionsByContent["content"].indexOf(elem);
        if (k !== -1) {
            ret = this.regionsByContent["regions"][k];
        }
        return ret;
    };
    
    var Supports = (function(){
        // all spaces are important!
        var prefixes = ' -webkit- -moz- -o- -ms- ';

        function getPrefixedProperties(property, prefixes) {
            var properties = prefixes.join(property + " ").split(' ');

            // ignore the last string which is empty.
            return properties.slice(0, properties.length-1);
        }
        
        return {
            cssProperty: function(property, host) {
                var host = host || document.body;
                var cssPrefixes = prefixes.split(' ');

                // build an array of prefixed properties.
                var properties = getPrefixedProperties(property, cssPrefixes);

                for (var i = 0, len = properties.length; i < len; i++) {
                    if (host.style[properties[i]] !== undefined) {
                        // the scope for 'this' is injected
                        this.supportedProperty = properties[i];
                        return true;
                    }
                }

                return false;
            },

            omProperty: function(property, host) {
                var host = host || document;
                
                var omPrefixes = prefixes.replace(/-/g, '').split(' ');

                // drop the first element, which is empty
                omPrefixes = omPrefixes.slice(1, omPrefixes.length);

                // uppercase the property to attach prefixes
                var ucProperty = property.charAt(0).toUpperCase() + property.slice(1);

                // build an array of prefixed properties.
                var properties = getPrefixedProperties(ucProperty, omPrefixes);

                // ignore the last string which is empty.
                properties = properties.slice(0, properties.length-1);

                // add the unprefixed property
                properties.unshift(property);

                for (var i = 0, len = properties.length; i < len; i++) {
                    if (properties[i] in host) {
                        this.supportedProperty = properties[i];
                        return true;
                    }
                }

                return false;
            },
            
            /* 
                Get the supported property name, prefixed or regular. 
                Checks and returns CSS properties. If isDOMProperty is set to true it checks and DOM properties

                @param {String} property The unprefixed property
                @param {String} host The optional host element to check against
                @param {Boolean} isDOMProperty Look in the dom
                @return {String}
            */
            getSupportedProperty: function(property, host, isDOMProperty) {
                // make it a boolean
                var isDOMProperty = !!isDOMProperty;

                // scope to inject in checker function to pluck out the supported property
                var obj = function(){};
                var inst = new obj;
                
                // assume non-prefixed property, let checker function change it
                inst.supportedProperty = property;
                
                if (isDOMProperty) {
                    Supports.omProperty.call(inst, property, host);
                } else {
                    Supports.cssProperty.call(inst, property, host);
                }
                
                return inst.supportedProperty;
            }
        }
    })();
    
    // using the sledgehammer to test CSS Regions support 
    // until the false positives get fixed in Chrome
    function flowHasOverset() {
        var flow,
            test = document.createElement("span"),
            hasOverset = false,
            flowIntoCSSProperty = Supports.getSupportedProperty('flow-into'),
            getNamedFlows = Supports.getSupportedProperty('getNamedFlows', document, true);
            
        test.id = 'test-regions-support';
        test.style[flowIntoCSSProperty] = 'testflow';
        document.body.appendChild(test);
        
        // Make sure we don't bork if regions methods are missing
        try {
            flow = document[getNamedFlows].call(document)['testflow'];
            // older implementations used to have overflow not overset
            hasOverset = (typeof flow.overset !== 'undefined');
        } catch(e) {
        } finally {
            // cleanup
            test.style[flowIntoCSSProperty] = 'none';
            test.parentNode.removeChild(test);
            flow = null;
            return !!hasOverset;
        }
    }

    if (typeof scope.addEventListener === 'undefined') {
       scope.addEventListener = function(eventName, handler) {
           scope.attachEvent("on" + eventName, handler);
       };
    }
    
    var timeoutId,
        polyfill = new Polyfill,
        htmlEl = document.documentElement;
        
    scope.addEventListener('load', function() {
        
        // check for regions CSS and CSSOM support
        if (Supports.cssProperty('flow-into') && Supports.omProperty('getNamedFlows') && flowHasOverset()) {
            polyfill.hasNativeSupport = true;
            
            // Modernizr-esque classes on <html> tag to signal CSS Regions support
            htmlEl.className += " regions";
            return;
        }
        
        // no native CSS Regions support, use polyfill
        polyfill.init();
        htmlEl.className += " no-regions";
        
        scope.addEventListener("resize", function() {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(function() {
                invalidateRegions();
                polyfill.doLayout();
            },
            300);
        });
    })
    
    return polyfill;
    
}(window);
