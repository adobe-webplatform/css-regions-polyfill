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