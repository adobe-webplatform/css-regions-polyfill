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
            //  ignore polyfill tests if there's native support
            if (polyfill.hasNativeSupport){
                expect(0)
            }
            else{
                ok(polyfill, 'polyfill exists')
                equal(region.childNodes.length, 2, 'Region has two nodes')
            }
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
        //  ignore polyfill tests if there's native support
        if (polyfill.hasNativeSupport){
            expect(0)
        }
        else{
            equal(region1.childNodes[0].id, 'ad-source', 'Region 1 has content from #ad-source')
            equal(region2.childNodes[0].id, 'ad-source', 'Region 2 has content from #ad-source')
        }
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
        //  ignore polyfill tests if there's native support
        if (polyfill.hasNativeSupport){
            expect(0)
        }
        else{
            equal(regions.length, 3, "There are 3 regions")
            equal(regions.item(0).childNodes[0].id, 'source', 'The first region has content from #source')
            equal(regions.item(2).childNodes[0].id, 'source', 'The last region has content from #source')
        }
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
        //  ignore polyfill tests if there's native support
        if (polyfill.hasNativeSupport){
            expect(0)
        }
        else{
            equal(regions.length, 5, "There are 5 regions")
            equal(regions.item(0).childNodes[0].id, 'source', 'The first region has content from #source')
            equal(regions.item(4).childNodes[0].id, 'source', 'The last region has content from #source')
        }
    }) 
})

module('Tests for Flow Content Algorithm', {
    teardown: function(){
        fixture = document.getElementById('qunit-fixture')
        fixture.innerHTML = ''
    }
})

asyncTest("Whole Text was fitted", function(){
    setup("../playground/text-nodes/index-test.html", '500px')

    var iframe = document.getElementById('testframe')
    iframe.addEventListener("load", function(e){

        var win = iframe.contentWindow,
            polyfill = win.CSSRegions,
            regions = win.document.querySelectorAll('.myregions'),
            source = win.document.querySelectorAll('#source').item(3)

        start()
        //  ignore polyfill tests if there's native support
        if (polyfill.hasNativeSupport){
            expect(0)
        }
        else{
            var txtReg1 = regions.item(0).textContent.replace(/\s+/g,"")
            var txtReg2 = regions.item(1).textContent.replace(/\s+/g,"")
            var txtReg3 = regions.item(2).textContent.replace(/\s+/g,"")
            var txt = (txtReg1 + txtReg2 + txtReg3)
            var txt2 = source.textContent.replace(/\s+/g,"")

            var txtControl1 = "ThisisafunctionaltestfortheCSSRegionsPolyfill.Thefirsttworegionsarefixedwidthandheight.Thethirdonehasfixedwidthandauto-height.Usingthissetupwecantestthatthecontentflowing";
            var txtControl2 = "algorithmusedbythepolyfillworksasexpected.Itshouldn'tlooseanytextandthenodesshouldbesplitcorrectlybetweentheregions.Thecontentusedforthisexamplewhilenotverylongitisdecentlycomplextotestvariouspartsofthealgorithmlikesplittingthetextnodes/DOMelements";
            var txtControl3 = "betweenmultipleregionsorhandlingtextnodesandimageslikethis:Afteranychangeofthealgorithmweshouldrunthistesttomakesurethatthereweren'tintroducedanybugs.";

            equal(txt, txt2, "No text was lost")
            equal(txtReg1, txtControl1, "First region text is OK (not less not more)")
            equal(txtReg2, txtControl2, "Second region text is OK (not less not more)")
            equal(txtReg3, txtControl3, "Third region text is OK (not less not more)")

            // Tests for DOM order
            var reg1Dom = regions.item(0).innerHTML.replace(/\s+/g,"")
            var domControl1 = '<divid="source"><p>Thisisafunctionaltestforthe<spanclass="highlight">CSSRegionsPolyfill</span>.Thefirsttworegionsarefixedwidthandheight.Thethirdonehasfixedwidthandauto-height.<imgsrc="../content-folding/ads/2.jpg"></p><p>Usingthissetupwecantestthat<ahref="http://corlan.org"><spanclass="highlight">thecontentflowing</span></a></p></div>'
            var reg2Dom = regions.item(1).innerHTML.replace(/\s+/g,"")
            var domControl2 = '<divid="source"><p><ahref="http://corlan.org"><spanclass="highlight">algorithm</span>usedbythepolyfill</a>worksasexpected.</p><p>Itshouldn\'tlooseanytextandthenodesshouldbesplitcorrectlybetweentheregions.</p><p>Thecontentusedforthisexamplewhilenotverylongitisdecentlycomplextotestvariouspartsofthealgorithmlikesplitting<spanclass="highlight">thetextnodes/DOMelements</span></p></div>'
            var reg3Dom = regions.item(2).innerHTML.replace(/\s+/g,"")
            var domControl3 = '<divid="source"><p>betweenmultipleregionsorhandlingtextnodesandimageslikethis:<imgsrc="../content-folding/ads/1.jpg">Afteranychangeofthealgorithmweshouldrunthistesttomakesurethatthereweren\'tintroducedanybugs.</p></div>'
            equal(reg1Dom, domControl1, "DOM structure and content for first region is OK")
            equal(reg2Dom, domControl2, "DOM structure and content for first region is OK")
            equal(reg3Dom, domControl3, "DOM structure and content for first region is OK")
        }
    })
})
