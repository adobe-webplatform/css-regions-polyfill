/*  
    Unit tests
    
    Tests individual components of the CSS Regions polyfill
*/
module('CSS Regions polyfill')  

test("polyfill exists", function(){
    ok(CSSRegions)
})

test('has doLayout method', function(){
    equal(typeof CSSRegions.doLayout, 'function')
})

test('has namedFlows method', function(){
    ok(typeof CSSRegions.namedFlows, 'has named flows')
}) 
                     

var testCollection

module("Collection", {
    setup: function(){
     var array = [
        {
            name: "oprea",
            value: 1
        },
        {
            name: "costel",
            value: 2
        }
     ]

     testCollection = new CSSRegions.Collection(array, "name")
    }, 
    
    teardown: function(){
       testCollection = null
    }
    
})            

test('Collection constructor exists', function(){
    equal(typeof CSSRegions.Collection, 'function', 'Collection is defined')
})

test('Collection has length', function(){
    equal(testCollection.length, 2, 'has 2 items')
})

test('Collection items can be accessed by index', function(){
    ok(testCollection[0], 'first item is defined')
    equal(testCollection[0].name, 'oprea', 'first item is defined')
})

test('Collection has item() method', function(){
    equal(typeof testCollection.item, 'function', 'item() is defined as function')
    ok(testCollection.item(0), 'first item exists')
    equal(testCollection.item(0).name, 'oprea', 'first item is oprea')
    equal(testCollection.item(1).name, 'costel', 'second item is costel')
})

test('Collection has namedIdem() method', function(){
    equal(typeof testCollection.namedItem, 'function', 'namedIdem() is defined as function')
    ok(testCollection.namedItem('oprea'), 'first item exists')
    equal(testCollection.namedItem('oprea').name, 'oprea', 'first item is oprea')
    equal(testCollection.namedItem('costel').name, 'costel', 'second item is costel')
})

module('CSSOM', {
    setup: function(){
        var style = document.createElement('style')
        style.id = 'testStyle'
        style.innerHTML = '#testSource { flow-into: article } .region{ flow-from: article; width: 100px; height: 20px; }'

        var el = document.createElement('div') 
        el.id = 'testHTML'
        el.innerHTML = "<div id=\"source\">\
            <p>Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.</p>\
        </div>\
        <div class=\"region\"></div>\
        <div class=\"region\"></div>"
        
        document.getElementsByTagName('body')[0].appendChild(el)
        document.getElementsByTagName('head')[0].appendChild(style)        
    },
    teardown: function(){  
        var style = document.getElementById('testStyle')
        style.parentNode.removeChild(style)
        
        var testEl = document.getElementById('testHTML')
        testEl.parentNode.removeChild(testEl)
    }
})

test('NamedFlow exists', function(){
    var nf = new CSSRegions.NamedFlow()
    
    ok(nf, 'Named flow exists')
})

test('NamedFlow has name', function(){
    var flowName = 'myFlow',
        nf = new CSSRegions.NamedFlow(flowName)
        
    equal(nf.name, flowName, 'Named flow has name')
})

test('NamedFlow has overset property', function(){
    var nf = new CSSRegions.NamedFlow('myFlow')
    
    strictEqual(nf.overset, true, 'Has overset property set to "true" if no region chain')
}) 
      


test('NamedFlow has regions', function(){
    var nf = new CSSRegions.NamedFlow('myFlow', ['#source'], ['.region'])

    equal(typeof nf.getRegions, 'function', 'getRegions() is defined as function')
    // equal(nf.getRegions(), Array.prototype.slice.call(document.querySelectorAll('.region'), 0), 'has 2 regions')
    equal(nf.getRegions().length, 2, 'has 2 regions')
}) 

test('NamedFlow has contentNodes', function(){
    var nf = new CSSRegions.NamedFlow('myFlow', ['#source'], ['.region'])
    
    ok(nf.contentNodes, 'contentNodes is defined')
    equal(nf.contentNodes.length, 1, 'has one content node')
}) 

test('document has getNamedFlows method', function(){
    equal(typeof document.getNamedFlows, 'function', 'getNamedFlows() is defined as function')
})

test('document has getFlowByName method', function(){
    equal(typeof document.getFlowByName, 'function', 'getFlowByName() is defined as function')
})