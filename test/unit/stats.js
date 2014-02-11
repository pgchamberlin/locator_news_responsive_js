require([
  "module/bootstrap",
  "locator/stats"
], function (bootstrap, Stats) {

  var ee, stats;

  module("Stats", {

    setup: function () {
      ee = bootstrap.pubsub;
    },

    teardown: function () {

      if (stats) {
        stats.logEvent = undefined;
      }

      // Remove events from pubsub
      ee.off("locator:open");
      ee.off("locator:changeLocationPrompt");
      ee.off("locator:geoLocation");
      ee.off("locator:searchResults");
      ee.off("locator:submitAutoCompleteSearch");
      ee.off("locator:submitAutoCompleteLocation");
      ee.off("locator:error");
      ee.off("locator:locationChanged");
      ee.off("locator:newsLocalRegions");
    }
  });

  test("is a function", function () {
    equal(typeof Stats, "function", "Stats is a function");
    equal(typeof Stats.prototype.applyEvents, "function", "applyEvents is a function");
  });

  test("locator:open sends istats event to log browser geolocation availability", function () {
    var supported;

    expect(2);

    supported = (typeof navigator.geolocation !== "undefined") ? 1 : 0;

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "open", "The action type was 'open'");
      equal(actualLabels.supports_geolocation, supported, "Geolocation support is passed as a label");
    });
    stats.applyEvents();

    ee.emit("locator:open", []);
  });

  test("locator:open sends istats event to log users cookie usage", function () {
    var hasLocServCookie;

    expect(2);

    hasLocServCookie = Stats.hasLocation();

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "open", "The action type was 'open'");
      equal(actualLabels.has_locserv_cookie, hasLocServCookie, "Locserv cookie usage is passed as a label");
    });
    stats.applyEvents();

    ee.emit("locator:open", []);
  });

  test("locator:changeLocationPrompt", function () {
    expect(2);

    stats = new Stats(ee, function (actualActionType) {
      equal(actualActionType, "open", "open event triggered");
      equal(arguments.length, 1, "It has 1 argument");
    });
    stats.applyEvents();

    ee.emit("locator:changeLocationPrompt");
  });

  test("locator:geoLocation", function () {
    var position, expectedLatitude, expectedLongitude;

    expect(4);

    expectedLongitude = 123;
    expectedLatitude = 456;

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      var expectedActionType;
      expectedActionType = "geo_location";
      equal(actualActionType, expectedActionType, "geo_location event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(actualLabels.longitude, expectedLongitude);
      equal(actualLabels.latitude, expectedLatitude);
    });
    stats.applyEvents();

    position = {
      coords: {
        longitude: expectedLongitude,
        latitude: expectedLatitude
      }
    };

    ee.emit("locator:geoLocation", [position]);
  });

  test("locator:searchResults", function () {
    var expectedSearchTerm;

    expect(4);

    expectedSearchTerm = "pontypridd";

    stats = new Stats(ee, function (actualActionType, expectedLabels) {
      var expectedActionType;
      expectedActionType = "search";
      equal(actualActionType, expectedActionType, "search event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(expectedLabels.ns_search_term, expectedSearchTerm);
      equal(expectedLabels.offset, 0);
    });
    stats.applyEvents();
    ee.emit("locator:searchResults", [
      {
        offset: 0,
        limit: 10,
        searchTerm: expectedSearchTerm
      }
    ]);
  });

  test("locator:searchResults registers more results", function () {
    expect(4);

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "more_results", "search event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(actualLabels.ns_search_term, "pontypridd");
      equal(actualLabels.page_num, 2);
    });
    stats.applyEvents();

    ee.emit("locator:searchResults", [
      {
        offset: 10,
        limit: 10,
        searchTerm: "pontypridd"
      }
    ]);
  });

  test("locator:submitAutoCompleteSearch", function () {
    var expectedSearchTerm;
    expectedSearchTerm = "neverland";

    expect(3);

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "autocomplete_search", "autocomplete search event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(actualLabels.ns_search_term, expectedSearchTerm);
    });
    stats.applyEvents();

    ee.emit("locator:submitAutoCompleteSearch", [expectedSearchTerm]);
  });

  test("locator:submitAutoCompleteLocation", function () {
    var expectedLocationId, expectedLocationName;
    expectedLocationId = 666;
    expectedLocationName = "neverland";

    expect(4);

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "autocomplete_click", "autocomplete location click event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(actualLabels.location_id, expectedLocationId);
      equal(actualLabels.location_name, expectedLocationName);
    });
    stats.applyEvents();

    ee.emit("locator:submitAutoCompleteLocation", [expectedLocationId, expectedLocationName]);
  });

  test("locator:error", function () {
    expect(2);

    stats = new Stats(ee, function (actualActionType) {
      equal(actualActionType, "http_error", "open event triggered");
      equal(arguments.length, 1, "It has 1 arguments");
    });
    stats.applyEvents();

    ee.emit("locator:error");
  });

  test("locator:locationChanged", function () {
    var location;

    expect(5);

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "confirm", "open event triggered");
      equal(arguments.length, 2, "It has 2 arguments");
      equal(actualLabels.location_id, 123);
      equal(actualLabels.location_name, "Pontypridd");
      equal(actualLabels.news_region, "South East Wales");
    });
    stats.applyEvents();

    location = {
      id: 123,
      name: "Pontypridd",
      local_region: "South East Wales"
    };

    ee.emit("locator:locationChanged", [location]);
  });

  test("locator:newsLocalRegions", function () {
    var response;

    expect(5);

    stats = new Stats(ee, function (actualActionType, actualLabels) {
      equal(actualActionType, "news_local_regions", "open event triggered");
      equal(arguments.length, 2, "It has 1 arguments");
      equal(actualLabels.location_id, 123);
      equal(actualLabels.location_name, "Pontypridd");
      equal(actualLabels.location_regions, "Cardiff, Pontypridd");
    });
    stats.applyEvents();

    response = {
      location: {
        id: 123,
        name: "Pontypridd"
      },
      regions: [
        { id: 123, name: "Cardiff" },
        { id: 123, name: "Pontypridd" }
      ]
    };

    ee.emit("locator:newsLocalRegions", [response]);
  });

  test("isMDot returns true for valid hostnames", 8, function () {

    var hostnames, i;

    hostnames = [
      "m.bbc.co.uk",
      "m.sandbox.dev.bbc.co.uk",
      "m.int.bbc.co.uk",
      "m.test.bbc.co.uk",
      "m.stage.bbc.co.uk",
      "m.live.bbc.co.uk",
      "m.bbc.com",
      "m.some.blah.bbc.com"
    ];

    for (i in hostnames) {
      if (hostnames.hasOwnProperty(i)) {
        ok(Stats.isMDot(hostnames[i]), "isMDot is true for " + hostnames[i]);
      }
    }
  });

  test("isMDot returns false for invalid hostnames", 4, function () {

    var hostnames, i;

    hostnames = [
      "m.bc.co.uk",
      "m.sandbox.dev.bbcdf.co.uk",
      "m.int.bbc.net",
      "m.test.co.uk"
    ];

    for (i in hostnames) {
      if (hostnames.hasOwnProperty(i)) {
        ok(!Stats.isMDot(hostnames[i]), "isMDot is false for " + hostnames[i]);
      }
    }
  });

  test("hasLocation returns false when locserv cookie is present", function () {
    var stub = sinon.stub(Stats, "getCookie").returns("");

    ok(!Stats.hasLocation());
    stub.restore();
  });

  test("hasLocation returns true when locserv cookie is present", function () {
    var stub = sinon.stub(Stats, "getCookie").returns(
      "locserv=1#l1#i=2653822:n=Cardiff:h=w@w1#i=4:p=Cardiff@d1#1=wa:2=w:3=w:4=9.44@n1#r=53"
    );

    ok(Stats.hasLocation());
    stub.restore();
  });

  test("stats are logged when there are no search results", function(){
    var spy, stats, expectedType, expectedLabels;

    spy = sinon.spy();
    stats = new Stats(bootstrap.pubsub, spy);
    stats.applyEvents();
    expectedType = "no_search_results";
    expectedLabels = { ns_search_term: "pontypridd" };

    ee.emit("locator:searchResults", [{total: 0, searchTerm: "pontypridd"}]);

    ok(spy.calledWith(expectedType, expectedLabels), "No search results logged");
  });
});
