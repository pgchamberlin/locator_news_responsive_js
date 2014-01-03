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
          out: "dist/locator/locator.js",
          paths: {
            "jquery": "empty:"
          },
          exclude: [
            "vendor/istats/istats",
            "vendor/events/pubsub.js"
          ],
          optimize: "none"
        }
      },
      desktop: {
        options: {
          baseUrl: "src",
          name: "build.desktop",
          out: "dist/locator-desktop/locator.desktop.js",
          paths: {
            "jquery": "empty:",
            "jquery-1": "empty:",
            "locator/bootstrap": "locator/bootstrap.desktop"
          },
          exclude: [
            "vendor/istats/istats",
            "vendor/events/pubsub.js"
          ],
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
          "dist/locator/locator.min.js": [ "dist/locator/locator.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator/locator.min.map",
          sourceMappingURL: "locator.min.map",
          beautify: {
            ascii_only: true
          },
          banner: "/*! Locator-js v<%= pkg.version %> | " +
                  "(c) 2014 British Broadcasting Corporation. */",
          compress: {
            hoist_funs: false,
            loops: false,
            unused: false
          }
        }
      },
      desktop: {
        files: {
          "dist/locator-desktop/locator.min.js": [ "dist/locator-desktop/locator.desktop.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator-desktop/locator.desktop.min.map",
          sourceMappingURL: "locator.desktop.min.map",
          beautify: {
            ascii_only: true
          },
          banner: "/*! Locator-js (Desktop Variant) v<%= pkg.version %> | " +
                  "(c) 2014 British Broadcasting Corporation. */",
          compress: {
            hoist_funs: false,
            loops: false,
            unused: false
          }
        }
      },
    }
  });

  require( "load-grunt-tasks" )( grunt );

  grunt.registerTask( "dev", [ "requirejs:*:*", "jshint", "uglify:*:*" ] );
  grunt.registerTask( "default", [ "clean", "dev" ] );

};
