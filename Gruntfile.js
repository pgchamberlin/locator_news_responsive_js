module.exports = function( grunt ) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),
    clean: [ "dist" ],
    requirejs: {
      all: {
        options: {
          baseUrl: "src",
          name: "locator/main",
          out: "dist/locator.js",
          paths: {
            "jquery": "empty:",
          },
          optimize: "none" 
        }
      }
    },
    jshint: {
      all: {
        src: [
          "src/**/*.js",
          "Gruntfile.js"
        ],
        ignores: [
          "src/vendor/**/*.js"
        ],
        options: {
          jshintrc: true,
          ignores: [
            "src/vendor/**/*.js"
          ]
        }
      }
    },
    uglify: {
      all: {
        files: {
          "dist/locator.min.js": [ "dist/locator.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator.min.map",
          sourceMappingURL: "locator.min.map",
          report: "min",
          beautify: {
            ascii_only: true
          },
          banner: "/*! Locator-js v<%= pkg.version %> | " +
                  "(c) 2014 British Broadcasting Corporation. | ",
          compress: {
            hoist_funs: false,
            loops: false,
            unused: false
          }
        }
      }
    }

  });

  require( "load-grunt-tasks" )( grunt );

  grunt.registerTask( "dev", [ "requirejs:*:*", "jshint" ] );
  grunt.registerTask( "default", [ "clean", "dev", "uglify" ] );

};
