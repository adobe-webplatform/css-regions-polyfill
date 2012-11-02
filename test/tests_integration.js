/*  
    Integration tests
    
    Checks that the CSS Regions polyfill works correctly 
    when applied to regular HTML pages with CSS content.
*/

module('Integration', {
    teardown: function(){   
        fixture = document.getElementById('qunit-fixture')
        fixture.innerHTML = '' 
    }
})      

function setup(url){
    var iframe = document.createElement("iframe"),
        fixture = document.getElementById('qunit-fixture')
        
    iframe.style = "width: 100%; height: 100%"
    iframe.src = url;
    iframe.id = "testframe"
    
    fixture.appendChild(iframe)
}

asyncTest("Breaking news demo", function(){ 
    setup("../playground/breaking-news/index.html")      
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        console.log(iframe.contentWindow)
        
        var win = iframe.contentWindow,
            polyfill = win.CSSRegions
                
        start() 
        ok(polyfill, 'polyfill exists')
    }) 
})