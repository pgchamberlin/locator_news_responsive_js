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
      },
      vendorless: {
        options: {
          baseUrl: "src",
          name: "locator/main",
          out: "dist/locator.vendorless.js",
          paths: {
            "jquery": "empty:",
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
          out: "dist/locator.desktop.js",
          paths: {
            "jquery": "empty:",
            "jquery-1": "empty:",
            "locator/bootstrap": "locator/bootstrap_desktop"
          },
          optimize: "none"
        }
      },
      desktop_vendorless: {
        options: {
          baseUrl: "src",
          name: "build.desktop",
          out: "dist/locator.desktop_vendorless.js",
          paths: {
            "jquery": "empty:",
            "jquery-1": "empty:",
            "locator/bootstrap": "locator/bootstrap_desktop"
          },
          exclude: [
            "vendor/istats/istats",
            "vendor/events/pubsub.js"
          ],
          optimize: "none"
        }
      },
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
      },
      vendorless: {
        files: {
          "dist/locator.vendorless.min.js": [ "dist/locator.vendorless.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator.vendorless.min.map",
          sourceMappingURL: "locator.vendorless.min.map",
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
      },
      desktop: {
        files: {
          "dist/locator.desktop.min.js": [ "dist/locator.desktop.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator.desktop.min.map",
          sourceMappingURL: "locator.desktop.min.map",
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
      },
      desktop_vendorless: {
        files: {
          "dist/locator.desktop_vendorless.min.js": [ "dist/locator.desktop_vendorless.js" ],
        },
        options: {
          preserveComments: false,
          sourceMap: "dist/locator.desktop_vendorless.min.map",
          sourceMappingURL: "locator.desktop_vendorless.min.map",
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
