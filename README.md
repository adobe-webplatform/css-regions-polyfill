# CSS Regions polyfill

Prototype library for using [CSS Regions](http://html.adobe.com/webstandards/cssregions/) features in browsers that don't have support for them. 

## Usage

Include the polyfill script in your page
<pre>
&lt;script src='playground/src/cssregions.js'&gt;&lt;/script&gt;
</pre>

Use standard CSS regions syntax on the same page.
<pre>
#content{             
    /* pull content into a named flow */
    flow-into: myflow; 
}

.region{
    /* flow the content into other boxes */
    flow-from: myFlow;
    
    width: 200px;
    height: 100px;
}
</pre>   

The `#content` will be extracted and split across `.region` elements. Regions should be block elements and have explicit dimensions for the polyfill to work.


## Testing

The polyfill has a [QUnit](https://github.com/jquery/qunit) test suite in the `/test/` folder. New code should include at least one test.

### Requirements

**QUnit git submodule** 

Open the polyfill directory and sync the QUnit git sumbmodule with:
```
cd ./path/to/polyfill/
git submodule update --init
```                          

### Optionals

[Testem](https://github.com/airportyh/testem) automatically runs the QUnit suite across browsers as you make changes. A configuration is provided in `/testem.json`. Testem is optional, but [pretty cool](http://net.tutsplus.com/tutorials/javascript-ajax/make-javascript-testing-fun-with-testem/).

Testem requires [NodeJS](http://nodejs.org/) and [npm](https://npmjs.org/). 

**Install Testem**

```npm install testem -g```

**Run Testem**        
```
cd ./path/to/polyfill/
testem
```     
This command will open up the browsers specified in the `testem.json` config file and run the test suite located at `/test/index.html`. As you make changes to any of the files, Testem will rerun the tests.

Learn more from the [Testem docs](https://github.com/airportyh/testem/blob/master/README.md)


## License information

- MIT for polyfill
- Public Domain for tests, demos and docs 

The code in this repository implies and respects different licenses. This is a quick overview.
For details check each folder's corresponding LICENSE.md file.

The code for the prototype, located under the playground/src/ folder, is available under the [MIT license](http://www.opensource.org/licenses/mit-license.php).

The samples code and content, test files and documentation, unless otherwise specified, are available under the [Public Domain License](http://creativecommons.org/publicdomain/zero/1.0/).

Third party assets are licensed accordingly in their respective folders.