module.exports = function(grunt) {
    
    // Project configuration.
    var project = {
          files: ['src/shims.js', 'src/StyleLoader.js', 'src/cssparser.js', 'src/polyfill.js']
    }
    
    grunt.initConfig({
      pkg: '<json:package.json>',
      
      meta: {
          banner: '/*! Copyright 2012 <%= pkg.author.name %>;\n' +
                  '* Licensed under the Apache License, Version 2.0 (the "License");\n' +
                  '* you may not use this file except in compliance with the License.\n' +
                  '* You may obtain a copy of the License at\n\n' +
                  '* http://www.apache.org/licenses/LICENSE-2.0\n\n' +
                  '* Unless required by applicable law or agreed to in writing, software\n' +
                  '* distributed under the License is distributed on an "AS IS" BASIS,\n' +
                  '* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
                  '* See the License for the specific language governing permissions and\n' +
                  '* limitations under the License.\n'+
                  '*/'
      },
      
      concat: {
          dist: {
              src: project.files,
              dest: '<%= pkg.name %>.js'
          }
      },
      
      min: {
          dist: {
              // apply banner to minified file because Uglify removes all comments.
              src: ['<banner:meta.banner>','<%= concat.dist.dest %>'],
              dest: '<%= pkg.name %>.min.js'
          }
      },
      
      watch: {
          js: {
              files: project.files,
              tasks: 'concat min'
          }
      }
    });
    
    grunt.registerTask('default', 'concat min');
    grunt.registerTask('build', 'concat min');
    
};