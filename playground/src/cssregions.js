/*!
Copyright (C) 2012 Adobe Systems, Incorporated. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
 

/*
Real developers learn from source. Welcome!

Light JavaScript CSS Parser
Author: Razvan Caliman (rcaliman@adobe.com, twitter: @razvancaliman)    

This is a lightweight, naive and blind CSS Parser. It's meant to be used as a 
building-block for experiments with unsupported CSS rules and properties. 

This experimental parser is not intended to fully comply with any CSS Standard.
Use it responsibly and have fun! ;)

CSS Regions support
Author: Mihai Corlan (mcorlan@adobe.com, @mcorlan)

*/

!function(scope){  
    
    // pre-flight setup
    !function(){
        if (typeof String.prototype.trim !== "function"){
            
            // shameless augmentation of String with a trim function 
            String.prototype.trim = function(string){
                return string.replace(/^\s+/,"").replace(/\s+$/,"");
            }
        }
    }()
    
    function CSSRule(){ 
        this.selectorText = null;
        this.style = {};
        this.type = "rule";
    }
    
    CSSRule.prototype = {    
        
         setSelector: function(string){ 
            this.selectorText = string;
            
            // detect @-rules in the following format: @rule-name identifier{ }
            var ruleType = string.match(/^@([^\s]+)\s*([^{]+)?/);

            if (ruleType && ruleType[1]){
                switch (ruleType[1]){
                    case "template":
                        this.type = "template";
                        this.cssRules = [];
                    break

                    case "slot":
                        this.type = "slot";
                    break
                    
                    default:
                        this.type = "unknown";
                }
                
                // set the identifier of the rule
                this.identifier = ruleType[2] || "auto";
            }
        }, 

        setStyle: function(properties){ 
            
            if (!properties){
                throw new TypeError("CSSRule.setStyles(). Invalid input. Expected 'object', got " + properties);
            }

            this.style = properties || {};

            return this.style;
        }, 

        setParentRule: function(rule){

            if (!rule){
                throw new TypeError("CSSRule.setParentRule(). Invalid input. Expected 'object', got " + properties);
            }

            this.parentRule = rule;

            return this.parentRule;
        }
    }

    /*
        Naive and blind CSS syntax parser.

        The constructor returns a CSSParser object with the following members:
            .parse(string) - method to parse a CSS String into an array of CSSRule objects  
            .clear() - method to remove any previously parsed data
            .cssRules - array with CSSRule objects extracted from the parser input string
    */
    function CSSParser(){ 
            
        /*   
            Extracts the selector-like part of a string.  
            
            Matches anything after the last semicolon ";". If no semicolon is found, the input string is returned. 
            This is an optimistic matching. No selector validation is perfomed.
            
            @param {String} string The string where to match a selector 
            
            @return {String} The selelector-like string
        */
        function getSelector(string){
            var sets = string.trim().split(";");

            if (sets.length){
                return sets.pop().trim();
            }  

            return null;
        }
        
        /*
            Parse a string and return an object with CSS-looking property sets.   
            
            Matches all key/value pairs separated by ":", 
            themselves separated between eachother by semicolons ";" 
            
            This is an optimistic matching. No key/valye validation is perfomed other than 'undefined'.
            
            @param {String} string The CSS string where to match property pairs
            @return {Obect} The object with key/value pairs that look like CSS properties
        */
        function parseCSSProperties(string){
             var properties = {},
                 sets = string.trim().split(";");

             if (!sets || !sets.length){
                 return properties;
             }                    

             sets.forEach(function(set){ 

                 // invalid key/valye pair
                 if (set.indexOf(":") == -1){ 
                     return;
                 }         

                 var key, 
                     value,
                     parts = set.split(":");
                    

                 if (parts[0] !== undefined && parts[1] !== undefined) {
                     key = parts[0].trim();
                     value = parts[1].trim().replace(/[\"\']/g, "");

                     properties[key] = value;
                 }
             }) 

             return properties;
         }            
         
         /*
            Parse a string and create CSSRule objects from constructs looking like CSS rules with valid grammar.  
            CSSRule objects are added to the 'cssRules' Array of the CSSParser object.
            
            This is an optimistic matching. Minor syntax validation is used.    
             
            Supports nested rules.             
            
            Example: 
            @template{
                
                @slot{
                
                }
            }     
            
         */
         function parseBlocks(string, set, parent){
             var start = string.indexOf("{"),
                properties, 
                rule = new CSSRule,
                token = string.substring(0, start),
                selector = getSelector(token),
                remainder = string.substr(start + 1, string.length),
                end = remainder.indexOf("}"),
                nextStart = remainder.indexOf("{");
              
             if (start > 0){
                     
                 rule.setSelector(selector);

                 if (parent){  
                     rule.setParentRule(parent);
                    
                    /*
                        If it's a nested structure (a parent exists) properties might be mixed in with nested rules.
                        Make sure the parent gets both its styles and nested rules   
                        
                        Example:
                        @template{
                        
                            background: green;
                            
                            @slot{
                                
                            } 
                        }
                    */  
                    properties = parseCSSProperties(token);

                    parent.setStyle(properties);
                 }

                  // nested blocks! the next "{" occurs before the next "}"
                 if (nextStart > -1 && nextStart < end){  
                     
                     // find where the block ends
                     end = getBalancingBracketIndex(remainder, 1);
                     
                     // extract the nested block cssText
                     var block = remainder.substring(0, end);
                     
                     properties = parseCSSProperties(token);

                     rule.setStyle(properties);
                     rule.cssRules = rule.cssRules || [];
                     
                     // parse the rules of this block, and assign them to this block's rule object
                     parseBlocks(block, rule.cssRules, rule);
                     
                     // get unparsed remainder of the CSS string, without the block
                     remainder = remainder.substring(end + 1, remainder.length);
                 } else {
                     properties = parseCSSProperties(remainder.substring(0, end));
                        
                     rule.setStyle(properties);
                     
                     // get the unparsed remainder of the CSS string
                     remainder = remainder.substring(end + 1, string.length);
                 }
                 
                 // continue parsing the remainder of the CSS string
                 parseBlocks(remainder, set);
                                 
                 // prepend this CSSRule to the cssRules array
                 set.unshift(rule); 
             }
             
             function getBalancingBracketIndex(string, depth){
                var index = 0; 
                
                while(depth){      
                    switch (string.charAt(index)){
                        case "{": 
                         depth++;
                        break

                        case "}":
                         depth--;
                        break
                    }        

                    index++;
                } 

                return (index - 1);
             }
             
         }
        
        function cascadeRules(rules){
            if (!rules){
                throw new Error("CSSParser.cascadeRules(). No css rules available for cascade");
            }         
            
            if (!rules.length){
                return rules;
            }
            
            var cascaded = [], temp = {}, selectors = [];
            
            rules.forEach(function(rule){ 
                
                if (rule.cssRules){
                    rule.cssRules = cascadeRules(rule.cssRules);
                }
                
                // isDuplicate
                if (!temp[rule.selectorText]){  

                    // store this selector in the order that was matched
                    // we'll use this to sort rules after the cascade
                    selectors.push(rule.selectorText);
                    
                    // create the reference for cascading into
                    temp[rule.selectorText] = rule;
                } 
                else{
                    // cascade rules into the matching selector
                    temp[rule.selectorText] = extend({}, temp[rule.selectorText], rule);
                }
            });

            // expose cascaded rules in the order the parser got them
            selectors.forEach(function(selectorText){
                cascaded.push(temp[selectorText]);
            }, this);

            // cleanup
            temp = null;
            selectors = null;
            
            return cascaded;
        }
        
        function extend(target){  
            var sources = Array.prototype.slice.call(arguments, 1);
            sources.forEach(function(source){
                for (var key in source){
                    
                    // prevent an infinite loop trying to merge parent rules
                    // TODO: grow a brain and do this more elegantly
                    if (key === "parentRule"){
                        return;
                    }  
                    
                    // is the property pointing to an object that's not falsy?
                    if (typeof target[key] === 'object' && target[key]){
                         // dealing with an array?
                         if (typeof target[key].slice === "function"){  
                             target[key] = cascadeRules(target[key].concat(source[key]));
                         } else {
                         // dealing with an object
                             target[key] = extend({}, target[key], source[key]);
                         }
                    } else {
                        target[key] = source[key];
                    }
                }
            });
            
            return target;
        }

        return {
            cssRules: [],
            
            parse: function(string){ 
                 // inline css text and remove comments
                string = string.replace(/[\n\t]+/g, "").replace(/\/\*[\s\S]*?\*\//g,'').trim();
                parseBlocks.call(this, string, this.cssRules);
            },  
                                      
            /*
                Parse a single css block declaration and return a CSSRule.
                
                @return {CSSRule} if valid css declaration
                @return {null} if invalid css declaration
                
            */
            parseCSSDeclaration: function(string){
                var set = [];
                parseBlocks.call(this, string, set);
                if (set.length && set.length === 1){
                    return set.pop();
                } else {
                    return null;
                }
            },
            
            clear: function(){
                this.cssRules = [];
            },
            
            cascade: function(rules){   
                if (!rules || !rules.length){
                    // TODO: externalize this rule
                    this.cssRules = cascadeRules.call(this, this.cssRules);
                    return;
                }          
                
                return cascadeRules.call(this, rules);
            }, 

            extractRegions: function () {
                var style, property, value,
                    l = this.cssRules.length,
                    regions = {};

                for (var i = 0; i < l; i++) {
                    style = this.cssRules[i].style;
                    for (property in style) {
                        if (property.indexOf("flow-") !== -1) {
                            value = style[property];
                            regions[value] = regions[value] || {namedFlows: [], regionChains: [], DOMSource: [], DOMRegions: []};
                            if (property.indexOf("flow-into") !== -1) {
                                regions[value]["namedFlows"].push(this.cssRules[i].selectorText);
                            } else {
                                regions[value]["regionChains"].push(this.cssRules[i].selectorText);
                            }
                            break;
                        }
                    }
                }
                return regions;
            },

            doExtend: extend
        }
    }

    function init(e) {
        scope.removeEventListener("load", init);

        if (!Modernizr) {
            throw new Error("Modernizr is not loaded!");
        }

        // There is no CSS Regions support
        if (!Modernizr.regions) {
            console.log("CSS Regions is not supported");
            if (!document.styleSheets.length) {
                console.log("No CSS rules defined!");
                return;
            }

            var inlineStyles = document.querySelector("style");
            if (inlineStyles === null) {
                console.log("There is no inline CSS for CSS Regions!");
                return;
            }

            // Parse the inline stylesheet for rules
            var parser = new CSSParser();
            parser.parse(document.querySelector("style").innerHTML);
            if (parser.cssRules.length === 0) {
                console.log("There is no inline CSS for CSS Regions!");
                return;
            }

            // parse the rules and look for "flow-into" and "flow-from" rules;
            var regions = parser.extractRegions();
            // If there are CSS regions move the content from named flows into region chains
            CSSRegions.doLayout(regions);
        }
    }

    scope = scope || window;
    scope["CSSParser"] = CSSParser;
    scope.addEventListener("load", init);
       
}(window);

/**
 * This is the object responsible for parsing the regions extracted by CSSParser.
 * Retrieves the DOM elements that formed the named flows and regions chains.
 * Flows the content into the region chain.
 * Listens for changes window resize events.
 *
 */
window.CSSRegions = (function(window, regions) {
    var CSSRegions = {};

    if (Modernizr.regions) {
        return;
    }

    /**
     * This is the method that does all the magic.
     * If you want to trigger the layout from JS, then call CSS.doLayout().
     * @param regions
     */
    CSSRegions.doLayout = function(regions) {
        if (regions) {
            CSSRegions.regions = regions;
        } else {
            regions =  CSSRegions.regions || null;
        }
        if (regions === null || Object.getOwnPropertyNames(regions).length === 0) {
            return;
        }
        flowContentIntoRegions(regions);
    };

    /**
     * Orders the elements used for the name flows and regions
     * @param regions
     */
    var findDOMOrderForNameFlowsAndRegions = function(regions) {
        var nameFlow, currentRegion;
        for (nameFlow in regions) {
            currentRegion = regions[nameFlow];
            // Find the name flows/region chains DOM elements
            // Order them by the order of their DOM appearance
            if (regions[nameFlow].DOMSource.length === 0) {
                regions[nameFlow].DOMSource = orderNodes(currentRegion.namedFlows);
            }
            if (regions[nameFlow].DOMRegions.length === 0) {
                regions[nameFlow].DOMRegions = orderNodes(currentRegion.regionChains);
            }
        }
    };

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
    var getRegionsForFlow = function(regions) {
        var i, l, el,
            destinationNodes = [];
        for (i = 0, l = regions.length; i < l; i++) {
            el = regions[i];
            if (getComputedStyle(el).display !== "none") {
                destinationNodes.push(el);
            }
        }
        return destinationNodes;
    };

    // regions = {flowName : {namedFlows: [], regionChains: [], DOMSource: [], DOMRegions: []} }
    /**
     * This is where the regions parsed by the CSS parser are actually put to used.
     * For each region rule we flow the content.
     * @param regions
     */
    var flowContentIntoRegions = function(regions) {
        var nameFlow, currentRegion, currentFlow, i, l, sourceNodes, destinationNodes, el;

        findDOMOrderForNameFlowsAndRegions(regions);
        addCSSOMAPI(regions);

        for (nameFlow in regions) {
            currentFlow = regions[nameFlow];
            // Build the source to be flown from the region names
            sourceNodes = getNodesForFlow(currentFlow.DOMSource);
            // Remove regions with display:none;
            destinationNodes = getRegionsForFlow(currentFlow.DOMRegions);

            document.getNamedFlows().namedItem(nameFlow).overset = false;
            document.webkitGetNamedFlows().namedItem(nameFlow).overset = false

            // Flow the source into regions
            for (i = 0, l = destinationNodes.length; i < l; i++) {
                currentRegion = destinationNodes[i];
                currentRegion.innerHTML = "";
                // We still have to clear the possible content for the remaining regions
                // even when we don;t have anymore content to flow.
                if (sourceNodes.length === 0) {
                    currentRegion.webKitRegionOverset = "empty";
                    currentRegion.regionOverset = "empty";
                    continue;
                }
                // Don't use regions with display attribute value (none)
                if (getComputedStyle(currentRegion).display !== "none") {
                    el = sourceNodes.shift();
                    // The last region gets all the remaining content
                    if ((i + 1) === l) {
                        while (el) {
                            currentRegion.appendChild(el.cloneNode(true));
                            el = sourceNodes.shift();
                        }
                        // Check if it overflows
                        if (checkForOverflow(currentRegion)) {
                            document.getNamedFlows().namedItem(nameFlow).overset = true;
                            currentRegion.webKitRegionOverset = "overset";
                            currentRegion.regionOverset = "overset";
                            document.getNamedFlows().namedItem(nameFlow).overset = true;
                            document.webkitGetNamedFlows().namedItem(nameFlow).overset = true;
                        }
                    } else {
                        while (el) {
                            el = addContentToRegion(el, currentRegion);
                            if (el) {
                                // If current region is filled, time to move to the next one
                                sourceNodes.unshift(el);
                                break;
                            } else {
                                el = sourceNodes.shift();
                            }
                        }
                        currentRegion.webKitRegionOverset = "fit";
                        currentRegion.regionOverset = "fit";
                    }
                }
            }
            // Dispatch regionLayoutUpdate event document.getNamedFlows().namedItem(nameFlow).
        }
    };

    /**
     * Adds the elemContent into region. If the content to be consumed overflows out of region,
     * it returns the overflow part as a DOM element.
     * @param elemContent
     * @param region
     * @return null or a DOM element
     */
    var addContentToRegion = function(elemContent, region) {
        var currentNode, i, l, arrString, txt, indexOverflowPoint,
            ret = null,
            nodes = [],
            removedContent = [],
            el = elemContent.cloneNode(true);

        region.appendChild(el);
        // Oops it overflows. Can we split the content or is it a lost battle?
        if ( checkForOverflow(region) ) {
            region.removeChild(el);
            // Find all the textNodes, IMG, and FIG
            nodes = getFilteredDOMElements(
                        el,
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
                // Let's see if we can fit the content if we remove some of the textNodes/images
                for (i = nodes.length - 1; i >= 0; i--) {
                    currentNode = nodes[i];
                    if (currentNode.nodeName === "#text") {
                        removedContent[i] = currentNode.data;
                        currentNode.data = "";
                    } else {
                        removedContent[i] = currentNode.parentNode;
                        currentNode.parentNode.removeChild(currentNode);
                    }
                    region.appendChild(el);
                    if ( !checkForOverflow(region) ) {  // We found a node that triggers the overflow
                        indexOverflowPoint = i;
                        region.removeChild(el);
                        break;
                    }
                    region.removeChild(el);
                }

                if (i < 0 ) {   // We couldn't find a way to split the content
                    ret = elemContent;
                } else {        // Try splitting the TextNode content to fit in
                    if (currentNode.nodeName === "#text") {
                        txt = removedContent[indexOverflowPoint].replace(/^\s+|\s+$/g,"");
                        arrString = txt.split(" ");
                        l = findMaxIndex(region, el, currentNode, arrString);
                        removedContent[indexOverflowPoint] = buildText(arrString, l, arrString.length - 1);
                    }
                    region.appendChild(el.cloneNode(true));
                    assembleUnusedContent(indexOverflowPoint, nodes, removedContent);
                    ret = el;
                }
            }
        }
        return ret;
    };

    /**
     * Finds the max index that allows adding text from arrString to the el without overflowing the container.
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
     * @param indexOverflowPoint
     * @param nodes
     * @param removedContent
     */
    var assembleUnusedContent = function(indexOverflowPoint, nodes, removedContent) {
        var currentNode, i, l;
        // Delete the content that was already consumed by the current region
        for (i = 0; i < indexOverflowPoint; i++) {
            currentNode = nodes[i];
            if (currentNode.nodeName === "#text") {
                currentNode.data = "";
            } else {
                currentNode.parentNode.removeChild(currentNode);
            }
        }
        // Put back the leftovers not consumed by the current region
        for (i = indexOverflowPoint, l = nodes.length; i < l; i++) {
            currentNode = nodes[i];
            if (currentNode.nodeName === "#text") {
                currentNode.data = removedContent[i];
            } else {
                removedContent[i].appendChild(currentNode);
            }
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

    var addCSSOMAPI = function(regions) {
        var f, nameFlow,
            obj = {},
            arr = [];

        for (nameFlow in regions) {
            obj[nameFlow] = {name: nameFlow, overset: false};
            arr.push(obj[nameFlow]);
        }

        f = function () {
            var ret = {namedItem: null, item: null};

            ret.namedItem = function(name) {
                if (obj[name]) {
                    return obj[name];
                } else {
                    return null;
                }
            };

            ret.item = function(index) {
              if (arr.length > index && index > 0){
                return arr[index];
              } else {
                return null;
              }
            };

            return ret;
        };

        document.getNamedFlows = f;
        document.webkitGetNamedFlows = f;
    };

    // regions = {flowName : {namedFlows: [], regionChains: [], DOMSource: [], DOMRegions: []} }
    CSSRegions.addRegionToNamedFlow = function(flowName, elem) {
        var regions;
        if (!CSSRegions.regions) {
            return;
        }
        regions = this.regions;
        if (regions[flowName]) {
            regions[flowName].DOMRegions.push(elem);
        }
    };

    CSSRegions.removeRegionFromNamedFlow = function(flowName, elem) {
        var regions, i;
        if (!CSSRegions.regions) {
            return;
        }
        regions = this.regions;
        if (regions[flowName]) {
            i = regions[flowName].DOMRegions.indexOf(elem);
            if (i >= 0) {
                regions[flowName].DOMRegions.splice(i, 1);
            }
        }
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
        isOverflowing = el.clientHeight < el.scrollHeight;
        el.style.overflow = curOverflow;
        return isOverflowing;
    };

    window.addEventListener("resize", function(e) {
        CSSRegions.doLayout();
    });

    return CSSRegions;

})(window);

