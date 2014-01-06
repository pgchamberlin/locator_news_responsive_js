/*global require, module, test, expect, ok, equal, deepEqual, EventEmitter, jQuery, Qunit, sinon */
/*jslint undef: false */
require([
    'jquery',
    'module/bootstrap',
    'locator/main'
], function($, bootstrap, Locator){

    var locator, ee;

    module('Locator (main.js)', {
        setup: function(){
            var requests;
            this.requests = requests = [];
            this.xhr = sinon.useFakeXMLHttpRequest();
            this.xhr.onCreate = function(xhr) {
                requests.push(xhr);
            };
            ee = bootstrap.pubsub;
            locator = new Locator({pubsub: ee});
        },
        teardown: function() {
            this.xhr.restore();
            $('div#locator-info').remove();
            $('div#locator-container').remove();
            $('div#news-container').remove();

            $('#fixtures').append('<div id="locator-info" />')
                .append('<div id="locator-container" />')
                .append('<div id="news-container" />');

            // Restore pubsub events
            ee.off('locator:open');
            ee.off('locator:close');
            ee.off('locator:geoLocation');
            ee.off('locator:newsLocalRegions');
            ee.off('locator:submitSearch');
            ee.off('locator:submitLocation');
            ee.off('locator:submitAutoCompleteSearch');
            ee.off('locator:submitAutoCompleteLocation');

        }
    });

    test('constructor listens to correct events', function(){
        var locator;

        this.stub(ee, 'on');

        locator = new Locator({pubsub: ee});

        ok(ee.on.calledWith('locator:open'), 'listener for locator:open is attached');
        ok(ee.on.calledWith('locator:close'), 'listener for locator:close is attached');
    
        ee.on.restore();
    });

    test('locator:geoLocation is bound to geoLocate()', function(){
        var expectedPosition;

        expectedPosition = {
            coords: {
                latitude: 10,
                longitude: -20
            }
        };

        this.stub(locator, 'geoLocate');
        ee.emit('locator:geoLocation', [expectedPosition]);

        ok(
            locator.geoLocate.calledWith(
                expectedPosition.coords.latitude, 
                expectedPosition.coords.longitude
            ),
            'geoLocate() was called with expected arguments'
        );
    });

    test('locator:submitSearch is bound to search()', function(){
        var expectedSearchTerm, expectedOffset;

        expectedSearchTerm = 'foo';
        expectedOffset = 99;

        this.stub(locator, 'search');
        ee.emit('locator:submitSearch', [expectedSearchTerm, expectedOffset]);

        ok(
          locator.search.calledWith(expectedSearchTerm, expectedOffset),
          'search() was called with expected arguments'
        );
    });

    test('locator:submitLocation is bound to checkLocation()', function(){
        var expectedLocationId, expectedNewsRegion;

        expectedLocationId = 12349876;
        expectedNewsRegion = 'neverland';

        this.stub(locator, 'checkLocation');
        ee.emit('locator:submitLocation', [expectedLocationId, expectedNewsRegion]);

        ok(
          locator.checkLocation.calledWith(expectedLocationId, expectedNewsRegion),
          'checkLocation() was called with expected arguments'
        );
    });

    test('locator:submitAutoCompleteSearch is bound to autoComplete()', function(){
        var expectedSearchTerm;

        expectedSearchTerm = 'foo';

        this.stub(locator, 'autoComplete');
        ee.emit('locator:submitAutoCompleteSearch', [expectedSearchTerm]);

        ok(
          locator.autoComplete.calledWith(expectedSearchTerm),
          'search() was called with expected arguments'
        );
    });

    test('locator:submitAutoCompleteLocation is bound to checkLocation()', function(){
        var expectedLocationId, expectedLocationName, expectedNewsRegion;

        expectedLocationId = 666;
        expectedLocationName = 'neverland';
        expectedNewsRegion = null;

        this.stub(locator, 'checkLocation');
        ee.emit('locator:submitAutoCompleteLocation', [expectedLocationId, expectedLocationName]);

        ok(
          locator.checkLocation.calledWith(expectedLocationId, expectedNewsRegion),
          'checkLocation() was called with expected arguments'
        );
    });

    test('open() emits open event', function(){
        this.stub(ee, 'emit');
        locator.open('#locator-container');
        ok(ee.emit.calledOnce, 'EventEmitter called on open');
        ok(ee.emit.calledWith('locator:open', ['#locator-container']), 'event emitted with 2 arguments');
    
        ee.emit.restore();
    });

    test('we can specify custom host in constructor options', function(){
        var locator, expectedValue;

        expectedValue = 'foobar';
        locator = new Locator({host: expectedValue});
        equal(locator.host, expectedValue, 'Host was set correctly');
    });

    test('close() emits an event', function(){
        this.stub(ee, 'emit');
        locator.close();
        ok(ee.emit.calledOnce, 'EventEmitter called on close');
        ok(ee.emit.calledWith('locator:close'), 'event label is locator:close');
    
        ee.emit.restore();
    });

    test('handleLocation() emits events and sets location cookie', function(){
        var data;

        this.stub(ee, 'emit');
        this.stub(locator, 'getLocation');
        this.stub(locator, 'setCookieString');

        // mock data
        data = {
            cookie: "1#l1#i=6690828:n=Stoke+d%27Abernon:h=e@w1#i=4172:p=Dorking@d1#1=l:2=e:3=e:4=2.41@n1#r=66",
            expires: "1380098448"
        };

        locator.hasParsedCoookie = true;

        locator.handleLocation(data);

        ok(locator.hasParsedCoookie === false, 'Cookie has not been parsed yet');
        ok(ee.emit.calledTwice, 'two events were emitted');
        ok(ee.emit.calledWith('locator:renderChangePrompt'), 'event emitted for locator:renderChangePrompt');
        ok(ee.emit.calledWith('locator:locationChanged', [undefined]), 'event emitted for locator:locationChanged');
        ok(locator.setCookieString.calledOnce);
        ok(locator.getLocation.calledOnce, 'getLocation() was called');
    
        ee.emit.restore();
    });


    test('checkLocation() calls the correct url', function(){
        var expectedUrl, expectedLocationId, expectedNewsRegionId;

        expectedLocationId = 1234;
        expectedNewsRegionId = 5678;
        locator.checkLocation(expectedLocationId, expectedNewsRegionId);

        expectedUrl = '/locator/news/responsive/location.json?id=' + expectedLocationId + '&newsRegion=' + expectedNewsRegionId;
        equal(this.requests.length, 1, 'Only one request was made');
        equal(this.requests[0].url, expectedUrl, 'The correct url was requested');
    });

    test('handleResponse() emits correct events based on response object', function(){
        var response;

        this.stub(locator, 'handleLocation');
        this.stub(ee, 'emit');

        response = {type: 'search_results'};
        locator.handleResponse(response);
        ok(ee.emit.calledOnce, 'Event fired for search_results');
        ok(ee.emit.calledWith('locator:searchResults', [response]), 'with 2 arguments');

        response.type = 'news_regions';
        locator.handleResponse(response);
        ok(ee.emit.calledTwice, 'Event fired for news_regions');
        ok(ee.emit.calledWith('locator:newsLocalRegions', [response]), 'with 2 arguments');

        response.type = 'geolocation';
        response.isWithinContext = false;
        locator.handleResponse(response);
        ok(ee.emit.calledThrice, 'Event fired for geolocation');
        ok(ee.emit.calledWith('locator:locationOutOfContext', [response]), 'with 2 arguments');

        response.type = 'location';
        locator.handleResponse(response);
        ok(locator.handleLocation.calledOnce, 'handleLocation() was called');
        ok(locator.handleLocation.calledWith(response), 'handleLocation() was called with expected response');
    });

    test('search() makes expected request', function(){
        var expectedUrl, expectedSearchTerm;

        expectedSearchTerm = 'Foo';
        expectedUrl = '/locator/news/responsive/search.json?search=' + expectedSearchTerm;
        locator.search(expectedSearchTerm, 0);
        equal(this.requests.length, 1, 'Only one request was made');
        equal(this.requests[0].url, expectedUrl, 'The correct URL was requested');
    });

    test('search() makes expected request with expected offset', function(){
        var expectedSearchTerm, expectedOffset, expectedUrl;

        expectedSearchTerm = 'Foo';
        expectedOffset = 10;
        expectedUrl = '/locator/news/responsive/search.json?search=' + expectedSearchTerm +'&offset=' + expectedOffset;

        locator.search(expectedSearchTerm, expectedOffset);

        equal(this.requests.length, 1, 'Only one request was made');
        equal(this.requests[0].url, expectedUrl, 'The correct URL was requested');
    });

    test('search() emits renderWait', function(){
        var locator;

        this.stub(ee, 'emit');

        locator = new Locator({pubsub: ee});
        locator.search('Foo', 0);

        ok(ee.emit.called, 'event emitter fired');
        ok(ee.emit.calledWith('locator:renderWait'), 'event label is correct');
    
        ee.emit.restore();
    });

    test('geoLocate() constructs correct url', function(){
        var expectedUrl, expectedLatitude, expectedLongitude;

        expectedLatitude = 1234;
        expectedLongitude = 5678;

        this.stub(ee, 'emit');

        locator.geoLocate(expectedLatitude, expectedLongitude);
        expectedUrl = '/locator/news/responsive/geolocate.json?latitude=' + expectedLatitude + '&longitude=' + expectedLongitude;

        equal(this.requests.length, 1, 'Only one request was made');
        equal(this.requests[0].url, expectedUrl, 'The correct url was requested');
    
        ee.emit.restore();
    });

    test('geoLocate() rounds coordinate precision to 3 decimal places', function() {
        var expectedUrl, expectedLatitude, expectedLongitude;

        expectedLatitude = '12.413';
        expectedLongitude = '-3.468';
        expectedUrl = '/locator/news/responsive/geolocate.json?latitude=' + expectedLatitude + '&longitude=' + expectedLongitude;
        locator.geoLocate(12.413288012, -3.4675670);
        equal(this.requests.length, 1, 'One request has been made');
        equal(this.requests[0].url, expectedUrl, 'The correct url was requested with normalised coordinates');
    });

    test('getCookieString() does return a string', function(){
        equal(typeof locator.getCookieString(), 'string');
    });

    test('getLocation() returns null when locserv not present', function(){
        expect(1);
        locator.hasParsedCoookie = false;
        this.stub(locator, 'getCookieString').returns('foo');
        equal(locator.getLocation(), null);
    });

    test('getLocation() returns an object that is the location from a cookie', function(){
        var cookie, returnedObject, expectedName, expectedId, expectedNewsId, expectedNewsPath, expectedWeatherId;

        expectedName = 'Pontypridd';
        expectedId = '6690828';
        expectedNewsId = '66';
        expectedNewsPath = 'england/surrey';
        expectedWeatherId = '4172';

        cookie = 'locserv=1#l1#i=6690828:n=Pontypridd:h=e@w1#i=4172:p=Dorking@d1#1=l:2=e:3=e:4=2.41@n1#r=66';
        locator.hasParsedCoookie = false;
        this.stub(locator, 'getCookieString').returns(cookie);
        returnedObject = locator.getLocation();

        equal(returnedObject.name, expectedName);
        equal(returnedObject.id, expectedId);
        equal(returnedObject.news.id, expectedNewsId);
        equal(returnedObject.news.path, expectedNewsPath);
        equal(returnedObject.weather.id, expectedWeatherId);
    });

    test('getLocation() handles missing domains', function(){
        var cookie, returnedObject, expectedName, expectedId, expectedNews, expectedWeather;

        expectedName = 'Neverland';
        expectedId = '1234';
        expectedNews = null;
        expectedWeather = null;

        cookie = 'locserv=1#l1#i=1234:n=Neverland:h=e';
        locator.hasParsedCoookie = false;
        this.stub(locator, 'getCookieString').returns(cookie);
        returnedObject = locator.getLocation();

        equal(returnedObject.name, expectedName);
        equal(returnedObject.id, expectedId);
        equal(returnedObject.news, expectedNews);
        equal(returnedObject.weather, expectedWeather);
    });

    test('getNewsRegionChoices() returns an array on objects for multiple choices', function(){

        var cookie, newsRegions;

        cookie = 'locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11';
        this.stub(locator, 'getCookieString').returns(cookie);
        newsRegions = locator.getNewsRegionChoices();

        equal(newsRegions.length, 2, 'Two news regions exist for this cookie');

        // first news region
        equal(newsRegions[0].id, 'devon', 'First news region id is devon');
        equal(newsRegions[0].name, 'Devon', 'First news region name is Devon');

        // second news region
        equal(newsRegions[1].id, 'cornwall', 'Seconds news region id is cornwall');
        equal(newsRegions[1].name, 'Cornwall', 'Seconds news region name is Cornwall');
    });

    test('getNewsRegionChoices() returns an array on objects for single choices', function(){

        var cookie, newsRegions;

        cookie = 'locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17';
        this.stub(locator, 'getCookieString').returns(cookie);
        newsRegions = locator.getNewsRegionChoices();

        equal(newsRegions.length, 1, 'One news regions exist for this cookie');
        equal(newsRegions[0].id, 'devon', 'First news region id is devon');
        equal(newsRegions[0].name, 'Devon', 'First news region name is Devon');
    });

    test('locator:renderForm emitted when user has multiple news regions selected', function(){

        var cookie;

        cookie = 'locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11';
        this.stub(locator, 'getCookieString').returns(cookie);
        locator.getLocation();

        var spy = this.spy();
        ee.on('locator:renderForm', spy);
        
        ee.emit('locator:open', ['#locator-container']);
        ok(spy.calledOnce);
    });

    test('locator:newsLocalRegions event is emitted when multiple news regions selected', function(){

        var cookie, spy, expectedObject;

        cookie = 'locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11';
        this.stub(locator, 'getCookieString').returns(cookie);
        locator.getLocation();

        spy = this.spy();
        ee.on('locator:newsLocalRegions', spy);
        ee.emit('locator:open', ['#locator-container']);

        expectedObject = {
            location: {
                id: locator.location.id
            },
            regions: locator.getNewsRegionChoices()
        };

        ok(spy.calledOnce);
        ok(spy.calledWith(expectedObject));
    });
});

