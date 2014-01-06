/*global define */
define([
    "vendor/istats/istats"
  ],
  function (istats) {

    var Stats,
        ee;

    /**
     * Stats class
     *
     * @param {Object} pubsub an instance of EventEmitter that will have further
     *                        events attached to it
     * @param {Object} logger an optional parameter for injecting the log function
     * @constructor
     */
    Stats = function(pubsub, logger) {
      // keep the event emitter private to this module
      ee = pubsub;

      // inject the logger by passing it as a second parameter
      if (typeof logger === "function") {
        this.logEvent = logger;
      }
    };

    /**
     * Log a event with iStats
     *
     * @return void
     */
    Stats.prototype.logEvent = function(actionType, labels) {
      labels = labels || {};
      labels.screen = Stats.isMDot(document.location.hostname) ? "mobile" : "desktop";

      istats.log(actionType, "locator", labels);
    };

    /**
     * Apply event callbacks to log stats
     *
     * @return void
     */
    Stats.prototype.applyEvents = function() {

      var that;

      that = this;

      // log browser support for html5 geolocation and cookie usage
      ee.on("locator:open", function(){
        that.logEvent("open", {
          supports_geolocation: (typeof navigator.geolocation !== "undefined") ? 1 : 0,
          has_locserv_cookie: Stats.hasLocation()
        });
      });

      // user has opted to change their location
      ee.on("locator:changeLocationPrompt", function(){
        that.logEvent("open");
      });

      // when user confirms location using HTML5 geolocation api
      ee.on("locator:geoLocation", function(position){
        that.logEvent("geo_location", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      });

      // user has submitted search query and results are returned
      ee.on("locator:searchResults", function(r){
        var labels;

        if (typeof r.offset === "undefined") {
          r.offset = 0;
        }

        if (typeof r.limit === "undefined") {
          r.limit = 10;
        }

        labels = {
          ns_search_term: r.searchTerm,
          offset: r.offset,
          page_num: (r.offset + r.limit) / r.limit
        };

        if (labels.page_num > 1) {
          that.logEvent("more_results", labels);
        } else {
          that.logEvent("search", labels);
        }
      });

      // user has submitted an auto complete search request
      ee.on("locator:submitAutoCompleteSearch", function(searchTerm){
        var labels;
        labels = {
          ns_search_term: searchTerm
        };
        that.logEvent("autocomplete_search", labels);
      });

      // user has clicked on an auto complete result
      ee.on("locator:submitAutoCompleteLocation", function(locationId, locationName){
        var labels;
        labels = {
          location_id : locationId,
          location_name : locationName
        };
        that.logEvent("autocomplete_click", labels);
      });

      // when an application error occurs
      ee.on("locator:error", function(){
        that.logEvent("http_error");
      });

      // when the location has changed
      ee.on("locator:locationChanged", function(location){
        var labels;

        // when geolocation fails, location is null
        if (location === null) {
          return;
        }

        labels = {
          location_id: location.id,
          location_name: location.name
        };
        if (location.local_region) {
          labels.news_region = location.local_region;
        }
        that.logEvent("confirm", labels);
      });

      // when the search results land between more than one news regions
      ee.on("locator:newsLocalRegions", function(response){
        var labels,
            _ref,
            regions;

        labels = {
          location_id: response.location.id,
          location_name: response.location.name
        };

        regions = [];
        for (_ref in response.regions) {
          if (response.regions.hasOwnProperty(_ref)) {
            regions.push(response.regions[_ref].name);
          }
        }

        labels.location_regions = regions.join(", ");
        that.logEvent("news_local_regions", labels);
      });
    };


    /**
     * Check that the hostname is MDot. This helper function expects the hostname
     * ONLY i.e. no protocol or path/query string. This will work on all
     * *.bbc.co.uk and *.bbc.com domains.
     *
     * @param {String} hostname
     */
    Stats.isMDot = function(hostname) {
      return !!hostname.match(/^m\.([a-z\.]*)?bbc(\.co\.uk|\.com)$/);
    };


    /**
     * Get the current cookie string.
     *
     * @return string
     */
    Stats.getCookie = function() {
      return document.cookie;
    };


    /**
     * Check if a user has a location set
     * 
     * @return {boolean}
     */
    Stats.hasLocation = function() {
      cookie = this.getCookie().match("locserv=(.*?)(;|$)");
      if(!cookie || cookie.length < 2){
        return false;
      } else {
        return true;
      }
    };

    return Stats;

  }
);
