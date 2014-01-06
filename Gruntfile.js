module.exports = function( grunt ) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),
    clean: [ "dist" ],
    requirejs: {
      all: {
        options: {
          baseUrl: "src/js",
          name: "locator/main",
          out: "dist/locator/locator.js",
          paths: {
            "jquery": "empty:",
          },
          exclude: [
            "vendor/istats/istats",
            "vendor/events/pubsub"
          ],
          optimize: "none"
        }
      },
      desktop: {
        options: {
          baseUrl: "src/js",
          name: "locator/main",
          out: "dist/locator-desktop/locator.desktop.js",
          paths: {
            "jquery": "empty:",
            "jquery-1": "empty:",
            "module/bootstrap": "module/bootstrap.desktop"
          },
          include: [
            "locator/autoCompleteView"
          ],
          exclude: [
            "vendor/istats/istats",
            "vendor/events/pubsub"
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
        options: {
          jshintrc: true,
          ignores: [
            "src/js/vendor/**/*.js"
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
    },
    bowercopy: {
      options: {
        clean: true
      },
      test: {
        options: {
          destPrefix: "test/libs"
        },
        files: {
          "curl/curl.js": "curl/dist/curl-with-js-and-domReady/curl.js",
          "jquery-2/jquery.js": "jquery-2/jquery.js",
          "qunit/qunit.css": "qunit/qunit/qunit.css",
          "qunit/qunit.js": "qunit/qunit/qunit.js",
          "sinon/sinon.js": "sinonjs/sinon.js",
          "sinon-qunit/sinon-qunit.js": "sinon-qunit/lib/sinon-qunit.js"
        }
      }
    },
    devserver: {
      options: {
        type: "http"
      },
      test: {
        options: {
          port: 8080,
          base: "."
        }
      }
    }
  });

  require( "load-grunt-tasks" )( grunt );

  // Alias bower
  grunt.registerTask( "bower", [ "bowercopy" ] );

  grunt.registerTask( "dev", [ "requirejs:*:*", "jshint", "uglify:*:*" ] );
  grunt.registerTask( "test", [ "bower:test", "devserver:test" ] );
  grunt.registerTask( "default", [ "clean", "dev" ] );

};
