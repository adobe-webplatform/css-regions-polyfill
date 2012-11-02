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

function setup(url, width, height){
    var iframe = document.createElement("iframe"),
        fixture = document.getElementById('qunit-fixture'),
        iframeW = width | '100%',
        iframeH = height | '100%'
        
    iframe.style = "width: "+ iframeW + "; height: "+ iframeH;  
    iframe.src = url;
    iframe.id = "testframe"
    
    fixture.appendChild(iframe)
}

asyncTest("Breaking news demo", function(){ 
    setup("../playground/breaking-news/index.html")      
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        
        var win = iframe.contentWindow,
            polyfill = win.CSSRegions,
            region = win.document.querySelector('ul.breaking-news')
                
        start() 
        ok(polyfill, 'polyfill exists')
        equal(region.childNodes.length, 2, 'Region has two nodes')
    }) 
})

asyncTest("Content folding demo", function(){ 
    setup("../playground/content-folding/index.html", '300px')      
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        
        var win = iframe.contentWindow,
            polyfill = win.CSSRegions,
            region1 = win.document.querySelector('.ad-region-1'),
            region2 = win.document.querySelector('.ad-region-2')
                
        start() 
        equal(region1.childNodes[0].id, 'ad-source', 'Region 1 has content from #ad-source')
        equal(region2.childNodes[0].id, 'ad-source', 'Region 2 has content from #ad-source')
    }) 
})

asyncTest("Text nodes demo", function(){ 
    setup("../playground/text-nodes/index.html", '500px')      
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        
        var win = iframe.contentWindow,
            polyfill = win.CSSRegions,
            regions = win.document.querySelectorAll('.myregions')
                            
        start() 
        equal(regions.length, 3, "There are 3 regions")
        equal(regions.item(0).childNodes[0].id, 'source', 'The first region has content from #source')
        equal(regions.item(2).childNodes[0].id, 'source', 'The last region has content from #source')
    }) 
})

asyncTest("Non-linear Content Flow demo", function(){ 
    setup("../playground/the-first-example/index.html")      
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        
        var win = iframe.contentWindow,
            polyfill = win.CSSRegions,
            regions = win.document.querySelectorAll('.myregions')
                            
        start() 
        equal(regions.length, 5, "There are 5 regions")
        equal(regions.item(0).childNodes[0].id, 'source', 'The first region has content from #source')
        equal(regions.item(4).childNodes[0].id, 'source', 'The last region has content from #source')
    }) 
})