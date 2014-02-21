Locator News Responsive JS
==========================

Locator News Responsive Javascript Bower component.


Developing
----------

To start development make sure node is installed and run:

    npm install


### QUnit Tests

To run the unit tests use:

    grunt test

This will copy the test dependencies using bower and start a local
web server, you can view the tests in your browers at the following:
http://localhost:8080/test


### Javascript Linting

To lint the javascipt files use:

    grunt jshint

This will run jshint with rules defined in the .jshintrc files.


### Distribution

To compile distribution files run:

    grunt

This will compile some vendorless files into the /dist directory.


### Quick Start

Once you have the component loaded onto your page, you can call it using an
AMD loader e.g.

    require(['locator/main'], function(Locator) {

        var locator = new Locator({
            //.. options
        });
    });

The constructor can be configured with the following options

#### Options

##### confirmLocationSelection
Type: `Boolean`
Default: `false`

This will alter the user flow so that they will be required to select a location
by mouse click/touch before the location selected event is fired.

##### persistLocation
Type: `Boolean`
Default: `false`

If this option is turned on, their location selection will be persisted to a
cookie.

##### enableReverseGeocode
Type: `Boolean`
Default: `true`

This will toggle the detect location button on/off.

##### enableAutoComplete
Type: `Boolean`
Default: `true`

This will toggle auto complete results on/off.

##### pubsub
Type: `Object`
Default: `undefined`

The component uses jQuery to bind and trigger events. You can override this by
providing a different object library that has the same method signature of
jQuery's.

##### host
Type: `String`
Default: `""`

This is used to prepend a different host to each API call XHR request.

#### API Methods

##### persistLocation

This method will persist a location in the client cookie.

    var locator = new Locator({
        //.. config
    })

    locator.persistLocation(12345, 'devon');

The method signature is flexible and provides three ways in which to use it.

```Locator.persistLocation()``` will used the last searched and selected
location.

```Locator.persistLocation(location)``` where ```location``` is a location
object passed as an argument in one of the emitted events.

```Locator.persistLocation(locationId, newsRegionId)``` by explicitly passing
in a location id and a news region id.