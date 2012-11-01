describe('The CSS Regions polyfill', function(){
    
    it('should exist', function(){
        expect(window.CSSRegions).toBeDefined()
    }) 
    
    it('should have init method', function(){
        expect(window.CSSRegions.getNamedFlowRules).toBeDefined()
    }) 
    
    it('should have no rules', function(){
        expect(CSSRegions.namedFlowRules.length).toEqual(0)
    })
})

// describe('A named flow', function(){
//     var nf
//     
//     beforeEach(function(){
//         nf = new NamedFlow('flow')
//     })
//     
//     it('should exist', function(){
//         expect(nf).toBeDefined()
//     })
//     
//     it('should have an identifier', function(){
//         expect(nf.identifier).toEqual('flow')
//     })
//     
//     it('should have a region chain', function(){
//         expect(nf.getRegions()).toBeDefined()
//     })
// })