module.exports = function( grunt ) {
  "use strict";

  grunt.initConfig({
    build: {
      all: {
        dest: "dist/locator.js"
      }
    },
    jshint: {
      all: {
        src: [
          "src/**/*.js",
          "Gruntfile.js",
          "test/**/*.js"
        ],
        options: {
          jshintrc: true
        }
      },
      dist: {
        src: "dist/locator.js",
      }
    },
    uglify: {
      all: {
        files: {
          "dist/locator.min.js": [ "dist/locator.js" ]
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
            unsued: false
          }
        }
      }
    }

  });

  grunt.registerTask( "dev", [ "build:*:*", "jshint" ] );
  grunt.registerTask( "default", [ "dev", "uglify" ] );

}
