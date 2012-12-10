module('StyleLoader', {
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
    iframe.id = "styleLoaderFrame"
    
    fixture.appendChild(iframe)
}

asyncTest("Should load all stylesheets", function(){ 
    setup("test_styleloader/index.html")
    
    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){ 
        
        var win = iframe.contentWindow,
            StyleLoader = win.StyleLoader
            
        new StyleLoader(function(stylesheets){
            start() 
            // equal(stylesheets.length, 3, "All stylesheets collected")
            ok(stylesheets[0].cssText, "Fist stylesheet has css text")
            ok(stylesheets[1].cssText, "Second stylesheet has css text")
            ok(stylesheets[2].cssText, "Third stylesheet has css text")
        })
    }) 
})

// TODO: test for correct DOM order
// TODO: test for missing stylesheets
// TODO: test for mixed style and links
// TODO: test for disabled stylesheets
