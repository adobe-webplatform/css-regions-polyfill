module.exports = function(grunt) {
    
    // Project configuration.
    var project = {
          files: ['src/StyleLoader.js', 'src/cssregions.js']
    }
    
    grunt.initConfig({
      pkg: '<json:package.json>',
      
      concat: {
          dist: {
              src: project.files,
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
              files: project.files,
              tasks: 'concat min'
          }
      }
    });
    
    grunt.registerTask('default', 'concat min');
    grunt.registerTask('build', 'concat min');
    
};