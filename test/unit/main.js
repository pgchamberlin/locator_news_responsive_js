require([
  "jquery",
  "module/bootstrap",
  "locator/main"
], function($, bootstrap, Locator) {

  var locator;
  var ee;
  var location;

  location = {
    type    : "location",
    id      : "2654971",
    name    : "Bradworthy",
    news    : {
      id   : "devon",
      name : "Devon"
    },
    cookie  : "1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17",
    expires : "1423662577"
  };

  module("Locator (main.js)", {
    setup    : function() {
      var requests;
      this.requests = requests = [];
      this.xhr = sinon.useFakeXMLHttpRequest();
      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
      ee = bootstrap.pubsub;
      locator = new Locator({ pubsub: ee, persistLocation: true });
    },
    teardown : function() {
      this.xhr.restore();
      $("div#locator-info").remove();
      $("div#locator-container").remove();
      $("div#news-container").remove();

      $("#fixtures").append("<div id=\"locator-info\" />")
        .append("<div id=\"locator-container\" />")
        .append("<div id=\"news-container\" />");

      // Restore pubsub events
      ee.off("locator:open");
      ee.off("locator:close");
      ee.off("locator:geoLocation");
      ee.off("locator:newsLocalRegions");
      ee.off("locator:submitSearch");
      ee.off("locator:submitLocation");
      ee.off("locator:submitAutoCompleteSearch");
      ee.off("locator:submitAutoCompleteLocation");
    }
  });

  test("constructor listens to correct events", function() {
    var locator;

    this.stub(ee, "on");

    locator = new Locator({ pubsub: ee });

    ok(ee.on.calledWith("locator:open"), "listener for locator:open is attached");
    ok(ee.on.calledWith("locator:close"), "listener for locator:close is attached");

    ee.on.restore();
  });

  test("locator:geoLocation is bound to geoLocate()", function() {
    var expectedPosition;

    expectedPosition = {
      coords : {
        latitude  : 10,
        longitude : -20
      }
    };

    this.stub(locator, "geoLocate");
    ee.emit("locator:geoLocation", [expectedPosition]);

    ok(
      locator.geoLocate.calledWith(
        expectedPosition.coords.latitude,
        expectedPosition.coords.longitude
      ),
      "geoLocate() was called with expected arguments"
    );
  });

  test("locator:submitSearch is bound to search()", function() {
    var expectedSearchTerm;
    var expectedOffset;

    expectedSearchTerm = "foo";
    expectedOffset = 99;

    this.stub(locator, "search");
    ee.emit("locator:submitSearch", [expectedSearchTerm, expectedOffset]);

    ok(
      locator.search.calledWith(expectedSearchTerm, expectedOffset),
      "search() was called with expected arguments"
    );
  });

  test("locator:submitLocation is bound to checkLocation()", function() {
    var expectedLocationId;
    var expectedNewsRegion;

    expectedLocationId = 12349876;
    expectedNewsRegion = "neverland";

    this.stub(locator, "checkLocation");
    ee.emit("locator:submitLocation", [expectedLocationId, expectedNewsRegion]);

    ok(
      locator.checkLocation.calledWith(expectedLocationId, expectedNewsRegion),
      "checkLocation() was called with expected arguments"
    );
  });

  test("locator:submitAutoCompleteSearch is bound to autoComplete()", function() {
    var expectedSearchTerm;

    expectedSearchTerm = "foo";

    this.stub(locator, "autoComplete");
    ee.emit("locator:submitAutoCompleteSearch", [expectedSearchTerm]);

    ok(
      locator.autoComplete.calledWith(expectedSearchTerm),
      "search() was called with expected arguments"
    );
  });

  test("locator:submitAutoCompleteLocation is bound to checkLocation()", function() {
    var expectedLocationId;
    var expectedLocationName;
    var expectedNewsRegion;

    expectedLocationId = 666;
    expectedLocationName = "neverland";
    expectedNewsRegion = null;

    this.stub(locator, "checkLocation");
    ee.emit("locator:submitAutoCompleteLocation", [expectedLocationId, expectedLocationName]);

    ok(
      locator.checkLocation.calledWith(expectedLocationId, expectedNewsRegion),
      "checkLocation() was called with expected arguments"
    );
  });

  test("open() emits open event", function() {
    this.stub(ee, "emit");
    locator.open("#locator-container");
    ok(ee.emit.calledOnce, "EventEmitter called on open");
    ok(ee.emit.calledWith("locator:open", ["#locator-container"]), "event emitted with 2 arguments");

    ee.emit.restore();
  });

  test("we can specify custom host in constructor options", function() {
    var locator;
    var expectedValue;

    expectedValue = "foobar";
    locator = new Locator({ host: expectedValue });
    equal(locator.host, expectedValue, "Host was set correctly");
  });

  test("close() emits an event", function() {
    this.stub(ee, "emit");
    locator.close();
    ok(ee.emit.calledOnce, "EventEmitter called on close");
    ok(ee.emit.calledWith("locator:close"), "event label is locator:close");

    ee.emit.restore();
  });

  test("handleLocation() emits events and sets location cookie", function() {
    var data;

    this.stub(ee, "emit");
    this.stub(locator, "getLocation");
    this.stub(locator, "setCookieString");

    // mock data
    data = {
      cookie  : "1#l1#i=6690828:n=Stoke+d%27Abernon:h=e@w1#i=4172:p=Dorking@d1#1=l:2=e:3=e:4=2.41@n1#r=66",
      expires : "1380098448",
      type    : "location"
    };

    locator.hasParsedCoookie = true;

    locator.handleLocation(data);

    ok(locator.hasParsedCoookie === false, "Cookie has not been parsed yet");
    ok(ee.emit.calledTwice, "two events were emitted");
    ok(ee.emit.calledWith("locator:renderChangePrompt"), "event emitted for locator:renderChangePrompt");
    ok(ee.emit.calledWith("locator:locationChanged", [undefined]), "event emitted for locator:locationChanged");
    ok(locator.setCookieString.calledOnce);
    ok(locator.getLocation.calledOnce, "getLocation() was called");

    ee.emit.restore();
  });

  test("checkLocation() calls the correct url", function() {
    var expectedUrl;
    var expectedLocationId;
    var expectedNewsRegionId;

    expectedLocationId = 1234;
    expectedNewsRegionId = 5678;
    locator.checkLocation(expectedLocationId, expectedNewsRegionId);

    expectedUrl = "/locator/news/responsive/location.json?id=" + expectedLocationId + "&newsRegion=" + expectedNewsRegionId;
    equal(this.requests.length, 1, "Only one request was made");
    equal(this.requests[0].url, expectedUrl, "The correct url was requested");
  });

  test("handleResponse() emits correct events based on response object", function() {
    var response;

    this.stub(locator, "handleLocation");
    this.stub(ee, "emit");

    response = { type: "search_results" };
    locator.handleResponse(response);
    ok(ee.emit.calledOnce, "Event fired for search_results");
    ok(ee.emit.calledWith("locator:searchResults", [response]), "with 2 arguments");

    response.type = "news_regions";
    locator.handleResponse(response);
    ok(ee.emit.calledTwice, "Event fired for news_regions");
    ok(ee.emit.calledWith("locator:newsLocalRegions", [response]), "with 2 arguments");

    response.type = "geolocation";
    response.isWithinContext = false;
    locator.handleResponse(response);
    ok(ee.emit.calledThrice, "Event fired for geolocation");
    ok(ee.emit.calledWith("locator:locationOutOfContext", [response]), "with 2 arguments");

    response.type = "location";
    locator.handleResponse(response);
    ok(locator.handleLocation.calledOnce, "handleLocation() was called");
    ok(locator.handleLocation.calledWith(response), "handleLocation() was called with expected response");
  });

  test("search() makes expected request", function() {
    var expectedUrl;
    var expectedSearchTerm;

    expectedSearchTerm = "Foo";
    expectedUrl = "/locator/news/responsive/search.json?search=" + expectedSearchTerm;
    locator.search(expectedSearchTerm, 0);
    equal(this.requests.length, 1, "Only one request was made");
    equal(this.requests[0].url, expectedUrl, "The correct URL was requested");
  });

  test("search() makes expected request with expected offset", function() {
    var expectedSearchTerm;
    var expectedOffset;
    var expectedUrl;

    expectedSearchTerm = "Foo";
    expectedOffset = 10;
    expectedUrl = "/locator/news/responsive/search.json?search=" + expectedSearchTerm + "&offset=" + expectedOffset;

    locator.search(expectedSearchTerm, expectedOffset);

    equal(this.requests.length, 1, "Only one request was made");
    equal(this.requests[0].url, expectedUrl, "The correct URL was requested");
  });

  test("search() emits renderWait", function() {
    var locator;

    this.stub(ee, "emit");

    locator = new Locator({ pubsub: ee });
    locator.search("Foo", 0);

    ok(ee.emit.called, "event emitter fired");
    ok(ee.emit.calledWith("locator:renderWait"), "event label is correct");

    ee.emit.restore();
  });

  test("geoLocate() constructs correct url", function() {
    var expectedUrl;
    var expectedLatitude;
    var expectedLongitude;

    expectedLatitude = 1234;
    expectedLongitude = 5678;

    this.stub(ee, "emit");

    locator.geoLocate(expectedLatitude, expectedLongitude);
    expectedUrl = "/locator/news/responsive/geolocate.json?latitude=" + expectedLatitude + "&longitude=" + expectedLongitude;

    equal(this.requests.length, 1, "Only one request was made");
    equal(this.requests[0].url, expectedUrl, "The correct url was requested");

    ee.emit.restore();
  });

  test("geoLocate() rounds coordinate precision to 3 decimal places", function() {
    var expectedUrl;
    var expectedLatitude;
    var expectedLongitude;

    expectedLatitude = "12.413";
    expectedLongitude = "-3.468";
    expectedUrl = "/locator/news/responsive/geolocate.json?latitude=" + expectedLatitude + "&longitude=" + expectedLongitude;
    locator.geoLocate(12.413288012, -3.4675670);
    equal(this.requests.length, 1, "One request has been made");
    equal(this.requests[0].url, expectedUrl, "The correct url was requested with normalised coordinates");
  });

  test("getCookieString() does return a string", function() {
    equal(typeof locator.getCookieString(), "string");
  });

  test("getLocation() returns null when locserv not present", function() {
    expect(1);
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns("foo");
    equal(locator.getLocation(), null);
  });

  test("getLocation() returns an object that is the location from a cookie", function() {
    var cookie;
    var returnedObject;
    var expectedObject;

    expectedObject = {
      id      : "6690828",
      name    : "Pontypridd",
      nation  : "wales",
      news    : {
        id   : "66",
        path : "england/surrey"
      },
      weather : {
        id   : "4172",
        name : "Dorking"
      }
    };

    cookie = "locserv=1#l1#i=6690828:n=Pontypridd:h=w@w1#i=4172:p=Dorking@d1#1=l:2=e:3=e:4=2.41@n1#r=66";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();

    deepEqual(returnedObject, expectedObject);
  });

  test("getLocation() returns null nation if nation value is not in nation map", function() {
    var cookie;
    var returnedObject;
    var expectedNation;
    
    expectedNation = null;
    cookie = "locserv=1#l1#i=1234:n=Foo:h=invalid";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();
    equal(returnedObject.nation, expectedNation);
  });

  test("getLocation() returns england nation", function() {
    var cookie;
    var returnedObject;
    var expectedNation;
    
    expectedNation = "england";
    cookie = "locserv=1#l1#i=1234:n=Foo:h=e";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();
    equal(returnedObject.nation, expectedNation);
  });

  test("getLocation() returns northernireland nation", function() {
    var cookie;
    var returnedObject;
    var expectedNation;
    
    expectedNation = "northernireland";
    cookie = "locserv=1#l1#i=1234:n=Foo:h=n";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();
    equal(returnedObject.nation, expectedNation);
  });

  test("getLocation() returns scotland nation", function() {
    var cookie;
    var returnedObject;
    var expectedNation;

    expectedNation = "scotland";
    cookie = "locserv=1#l1#i=1234:n=Foo:h=s";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();
    equal(returnedObject.nation, expectedNation);
  });

  test("getLocation() returns wales nation", function() {
    var cookie;
    var returnedObject;
    var expectedNation;
    
    expectedNation = "wales";
    cookie = "locserv=1#l1#i=1234:n=Foo:h=w";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();
    equal(returnedObject.nation, expectedNation);
  });

  test("getLocation() handles missing domains", function() {
    var cookie;
    var returnedObject;
    var expectedObject;

    expectedObject = {
      id      : "1234",
      name    : "Neverland",
      nation  : "england",
      news    : null,
      weather : null
    };

    cookie = "locserv=1#l1#i=1234:n=Neverland:h=e";
    locator.hasParsedCoookie = false;
    this.stub(locator, "getCookieString").returns(cookie);
    returnedObject = locator.getLocation();

    deepEqual(returnedObject, expectedObject);
  });

  test("getNewsRegionChoices() returns an array on objects for multiple choices", function() {
    var cookie;
    var newsRegions;

    cookie = "locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11";
    this.stub(locator, "getCookieString").returns(cookie);
    newsRegions = locator.getNewsRegionChoices();

    equal(newsRegions.length, 2, "Two news regions exist for this cookie");

    // first news region
    equal(newsRegions[0].id, "devon", "First news region id is devon");
    equal(newsRegions[0].name, "Devon", "First news region name is Devon");

    // second news region
    equal(newsRegions[1].id, "cornwall", "Seconds news region id is cornwall");
    equal(newsRegions[1].name, "Cornwall", "Seconds news region name is Cornwall");
  });

  test("getNewsRegionChoices() returns an array on objects for single choices", function() {
    var cookie;
    var newsRegions;

    cookie = "locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17";
    this.stub(locator, "getCookieString").returns(cookie);
    newsRegions = locator.getNewsRegionChoices();

    equal(newsRegions.length, 1, "One news regions exist for this cookie");
    equal(newsRegions[0].id, "devon", "First news region id is devon");
    equal(newsRegions[0].name, "Devon", "First news region name is Devon");
  });

  test("locator:renderForm emitted when user has multiple news regions selected", function() {
    var cookie;
    var spy;

    cookie = "locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11";
    this.stub(locator, "getCookieString").returns(cookie);
    locator.getLocation();

    spy = this.spy();
    ee.on("locator:renderForm", spy);

    ee.emit("locator:open", ["#locator-container"]);
    ok(spy.calledOnce);
  });

  test("locator:newsLocalRegions event is emitted when multiple news regions selected", function() {
    var cookie;
    var spy;
    var expectedObject;

    cookie = "locserv=1#l1#i=2654971:n=Bradworthy:h=e@w1#i=2141:p=Bude@d1#1=sw:2=e:3=e:4=6.11@n1#r=17.11";
    this.stub(locator, "getCookieString").returns(cookie);
    locator.getLocation();

    spy = this.spy();
    ee.on("locator:newsLocalRegions", spy);
    ee.emit("locator:open", ["#locator-container"]);

    expectedObject = {
      location : {
        id : locator.location.id
      },
      regions  : locator.getNewsRegionChoices()
    };

    ok(spy.calledOnce);
    ok(spy.calledWith(expectedObject));
  });

  test("locator does not persist location by default", function() {
    locator = new Locator({ pubsub: bootstrap.pubsub });
    ok(!locator.persistLocation, "Locator not persisting location by default");
  });

  test("renderChangePrompt is not emitted when not persisting location selection", function() {
    var stub = sinon.stub(ee, "emit");

    ee = bootstrap.pubsub;
    locator = new Locator({ pubsub: ee, persistLocation: false });
    ok(!stub.calledWith("locator:renderChangePrompt"), "Change prompt not rendered");
    stub.restore();
  });

  test("location selected event emitted when not persisting cookie", function() {
    var stub;
    var loc;

    stub = sinon.stub(ee, "emit");
    loc = { foo: "bar" };
    locator = new Locator({ pubsub: ee, persistLocation: false });
    locator.handleLocation(loc);

    ok(stub.calledWith("locator:locationSelected", [loc]), "Location selected emitted with object");
    stub.restore();
  });

  test("confirmLocationSelection is false by default", function() {
    ok(!locator.confirmLocationSelection, "confirmLocationSelection is false by default");
  });

  test("locator:renderWait is not emitted when confirmLocationSelection is true", function() {
    var spy = sinon.spy(ee, "emit");
    
    locator = new Locator({ confirmLocationSelection: true });
    locator.checkLocation();
    ok(!spy.calledWith("locator:renderWait"), "renderWait is not emitted when confirmLocationSelection is true");
    spy.restore();
  });

  test("More results is hidden when on news region disambiguation page and confirmLocationSelection is true", function() {
    var response;
    var moreResults;

    response = {
      type     : "news_regions",
      location : {
        id   : "2654971",
        name : "Bradworthy"
      },
      regions  : [
        {
          id   : "devon",
          name : "Devon"
        },
        {
          id   : "cornwall",
          name : "Cornwall"
        }
      ]
    };
    locator = new Locator({ confirmLocationSelection: true, pubsub: ee });
    locator.open("#locator-container");
    ee.emit("locator:newsLocalRegions", [response]);

    moreResults = document.getElementById("locator-results-more");
    equal(moreResults.style.display, "none", "More results is hidden");
  });

  test("persistUserLocation() sends the correct request when location id and news are passed", function() {
    var expectedUrl;

    locator.persistLocation = true;
    locator.persistUserLocation(2654971, "devon");
    expectedUrl = "/locator/news/responsive/location.json?id=2654971&newsRegion=devon";
    equal(this.requests[0].url, expectedUrl, "Location URL is correct");
  });

  test("persistUserLocation() set the locserv cookie when locationId and newsRegionId passed", function() {
    var spy;
    spy = sinon.spy(locator, "setCookieString");
    locator.persistUserLocation(2654971, "devon");

    this.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify(location));
    ok(spy.calledOnce, "locserv cookie set");
  });

  test("persistUserLocation() doesn't send XHR when arguments look like locationSelection", function() {
    locator.handleLocation(location);
    locator.persistUserLocation(location.id, location.news.id);

    equal(this.requests.length, 0, "No XHR requests where made");
  });

  test("persistUserLocation() doesn't send XHR if locationSelection set and no arguments passed", function() {
    locator.handleLocation(location);
    locator.persistUserLocation();

    equal(this.requests.length, 0, "No XHR were made");
  });

  test("persistUserLocation() doesn't send XHR when location object passed that is the same as locationSelection", function() {
    locator.handleLocation(location);
    locator.persistUserLocation(location);

    equal(this.requests.length, 0, "No XHR requests were made");
  });

  test("persistUserLocation() doesn't make an XHR request when location object passed", function() {
    locator.persistUserLocation(location);
    equal(this.requests.length, 0, "No XHR was made");
  });

  test("persistUserLocation() sets the locserv cookie when location object passed", function() {
    var spy;
    
    spy = sinon.spy(locator, "setCookieString");
    locator.persistUserLocation(location);

    ok(spy.calledOnce, "Set the locserv cookie");
  });

  test("Wait message disappears when confirmLocationSelection is set", function(){

    var messageElement = $("#locator-message-search");

    locator.confirmLocationSelection = true;
    locator.open("#locator-container");
    ee.emit("locator:locationSelected");

    equal(messageElement.text(), "", "Message has been cleared");
  });

});
