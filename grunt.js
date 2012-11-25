module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
      pkg: '<json:package.json>',
      
      concat: {
        dist: {
          src: ['playground/src/cssregions.js'],
          dest: '<%= pkg.name %>.js'
        }
      },
      
      min: {
          dist: {
              src: ['<%= concat.dist.dest %>'],
              dest: '<%= pkg.name %>.min.js'
          }
      },
      
      watch: {
          js: {
              files: ['playground/src/cssregions.js'],
              tasks: 'concat min'
          }
      }
    });
    
    grunt.registerTask('default', 'concat min');
    
};