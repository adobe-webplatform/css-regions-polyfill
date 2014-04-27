# CSS Regions polyfill

Prototype library for using [CSS Regions](http://html.adobe.com/webstandards/cssregions/) features in browsers that don't have support for them.

**UPDATE, April 2014: This polyfill is obsolete.**

**[François Remy](https://github.com/FremyCompany) wrote an improved [CSS Regions polyfill](https://github.com/FremyCompany/css-regions-polyfill) with better browser support and broader feature coverage.**

## Usage

Include the polyfill script in your page
<pre>
&lt;script src='cssregions.js'&gt;&lt;/script&gt;
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


## Contributing

**DO NOT directly modify the `cssregions.js` or `cssregions.min.js` files in the project root.** These files are automatically built from components located under the `src/` directory.

The project uses [Grunt](http://gruntjs.com) to automate the build process.


Grunt depends on [Node.js](http://nodejs.org/) and [npm](https://npmjs.org/).


**Install Grunt**
```
npm install -g grunt
```

Tell Grunt to watch for changes and automatically build `cssregions.js` and `cssregions.min.js`:
```
cd ./path/to/polyfill/
grunt watch
```

While `grunt watch` is running, every time you make changes to components under `src/` the main files, `cssregions.js` and `cssregions.min.js`, are built and written to the project root.

To do a one-time build run:
```
grunt build
```

## Testing

The polyfill has a [QUnit](https://github.com/jquery/qunit)-driven test suite in the `/test/` folder. New code should include at least one test.

**Run the tests**

Open the `test/index.html` file in a browser. This runs the QUnit test suite. Refresh compulsively after making changes to project files. You can automatically run the test suite with other tools. See below.


### Optionals

[Testem](https://github.com/airportyh/testem) automatically runs the QUnit suite across browsers as you make changes to the files. A configuration is provided in `/testem.json`. Testem is optional, but [pretty cool](http://net.tutsplus.com/tutorials/javascript-ajax/make-javascript-testing-fun-with-testem/).

Testem depends on [NodeJS](http://nodejs.org/) and [npm](https://npmjs.org/).

**Install Testem**

```npm install testem -g```

**Run Testem**
```
cd ./path/to/polyfill/
testem
```
This command will open up the browsers specified in the `testem.json` config file and run the test suite located at `/test/index.html`. As you make changes to any of the files, Testem will re-run the tests.

Learn more from the [Testem docs](https://github.com/airportyh/testem/blob/master/README.md)


## License information

The code in this repository implies and respects different licenses. This is a quick overview. For details check each folder's corresponding LICENSE.md file.

- Apache 2 for CSS Regions polyfill
- Public Domain for tests, demos and docs
- Third party assets under their own licenses

See LICENSE.md for details.
