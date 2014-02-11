define([
    "module/bootstrap",
    "locator/locatorView",
    "locator/stats"
  ],
  function(bootstrap, LocatorView, Stats) {

    var Locator;
    var newsMap = {
      3  : "england/berkshire",
      4  : "england/birmingham_and_black_country",
      7  : "england/bristol",
      8  : "england/cambridgeshire",
      11 : "england/cornwall",
      12 : "england/coventry_and_warwickshire",
      13 : "england/cumbria",
      16 : "england/derbyshire",
      17 : "england/devon",
      18 : "england/dorset",
      19 : "scotland/edinburgh_east_and_fife",
      20 : "england/essex",
      22 : "scotland/glasgow_and_west",
      23 : "england/gloucestershire",
      26 : "world/europe/guernsey",
      27 : "england/hampshire",
      28 : "england/hereford_and_worcester",
      30 : "scotland/highlands_and_islands",
      31 : "england/humberside",
      32 : "world/europe/isle_of_man",
      33 : "world/europe/jersey",
      34 : "england/kent",
      35 : "england/lancashire",
      36 : "england/leeds_and_west_yorkshire",
      37 : "england/leicester",
      38 : "england/lincolnshire",
      39 : "england/merseyside",
      40 : "england/london",
      41 : "england/manchester",
      42 : "wales/mid_wales",
      43 : "england/norfolk",
      44 : "england/northamptonshire",
      45 : "scotland/north_east_orkney_and_shetland",
      46 : "wales/north_east_wales",
      21 : "northern_ireland",
      47 : "wales/north_west_wales",
      49 : "england/nottingham",
      50 : "england/oxford",
      57 : "england/south_yorkshire",
      51 : "england/shropshire",
      52 : "england/somerset",
      53 : "wales/south_east_wales",
      55 : "scotland/south_scotland",
      56 : "wales/south_west_wales",
      58 : "england/stoke_and_staffordshire",
      59 : "england/suffolk",
      66 : "england/surrey",
      60 : "england/sussex",
      61 : "scotland/tayside_and_central",
      62 : "england/tees",
      1  : "england/beds_bucks_and_herts",
      63 : "england/tyne_and_wear",
      65 : "england/wiltshire",
      48 : "england/york_and_north_yorkshire"
    };
    var newsRegionsMap = {
      56 : "South West Wales",
      28 : "Hereford &amp; Worcester",
      36 : "Leeds and Bradford",
      60 : "Sussex",
      61 : "Tayside &amp; Central Scotland",
      62 : "Tees",
      63 : "Tyne and Wear",
      35 : "Lancashire",
      66 : "Surrey",
      34 : "Kent",
      26 : "Guernsey",
      27 : "Hampshire",
      20 : "Essex",
      21 : "Northern Ireland",
      48 : "York &amp; North Yorkshire",
      49 : "Nottinghamshire",
      46 : "North East Wales",
      47 : "North West Wales",
      44 : "Northampton",
      45 : "North East Scotland Orkney &amp; Shetland",
      42 : "Mid Wales",
      43 : "Norfolk",
      40 : "London",
      41 : "Manchester",
      1  : "Beds Herts &amp; Bucks",
      3  : "Berkshire",
      4  : "Birmingham and Black Country",
      7  : "Bristol",
      8  : "Cambridgeshire",
      13 : "Cumbria",
      12 : "Coventry &amp; Warwickshire",
      30 : "Highlands &amp; Islands",
      58 : "Stoke &amp; Staffordshire",
      11 : "Cornwall",
      39 : "Liverpool",
      38 : "Lincolnshire",
      59 : "Suffolk",
      22 : "Glasgow &amp; West of Scotland",
      17 : "Devon",
      16 : "Derby",
      19 : "Edinburgh Fife &amp; East of Scotland",
      18 : "Dorset",
      31 : "Humberside",
      23 : "Gloucestershire",
      51 : "Shropshire",
      50 : "Oxford",
      53 : "South East Wales",
      52 : "Somerset",
      33 : "Jersey",
      55 : "South Scotland",
      37 : "Leicestershire",
      32 : "Isle of Man",
      57 : "Sheffield &amp; South Yorkshire",
      65 : "Wiltshire"
    };
    var newsTldMap = {
      56 : "southwestwales",
      42 : "midwales",
      50 : "oxford",
      60 : "sussex",
      61 : "taysideandcentralscotland",
      62 : "tees",
      63 : "tyne",
      49 : "nottingham",
      66 : "surrey",
      52 : "somerset",
      53 : "southeastwales",
      26 : "guernsey",
      27 : "hampshire",
      20 : "essex",
      21 : "northernireland",
      22 : "glasgowandwestscotland",
      23 : "gloucestershire",
      46 : "northeastwales",
      47 : "northwestwales",
      44 : "northampton",
      45 : "northeastscotlandnorthernisles",
      28 : "herefordandworcester",
      43 : "norfolk",
      40 : "london",
      41 : "manchester",
      1  : "threecounties",
      3  : "berkshire",
      4  : "birmingham",
      7  : "bristol",
      8  : "cambridgeshire",
      39 : "liverpool",
      38 : "lincolnshire",
      58 : "stoke",
      11 : "cornwall",
      51 : "shropshire",
      13 : "cumbria",
      12 : "coventry",
      59 : "suffolk",
      48 : "york",
      17 : "devon",
      16 : "derby",
      19 : "edinburghandeastscotland",
      18 : "dorset",
      31 : "humberside",
      30 : "highlandsandislands",
      37 : "leicester",
      36 : "leeds",
      35 : "lancashire",
      34 : "kent",
      33 : "jersey",
      55 : "southscotland",
      32 : "isleofman",
      57 : "sheffield",
      65 : "wiltshire"
    };
    var nationsMap = {
      e : "england",
      n : "northernireland",
      s : "scotland",
      w : "wales"
    };

    /**
     * Make a XHR
     * 
     * @param {String}   url        The URL to request
     * @param {Function} success    Function to call on a successful response
     * @param {String}   actionType The request type eg search, location, geolocate
     * @param {Function} complete   A callback function when request is complete
     */
    function doRequest(url, success, actionType, complete) {
      
      if (typeof complete === "function") {
        complete = function() {};
      }
      
      bootstrap.ajax({
        url      : url,
        dataType : "json",
        method   : "get",
        complete : complete,
        success  : success,
        error    : function(e) {
          var responseText;
          var response;
          
          responseText = e && e.responseText ? e.responseText : "{}";
          try {
            // Response JSON is parsed in a similar manner to reqwest
            response = window.JSON ? window.JSON.parse(responseText) : eval("(" + responseText + ")");
          } catch (err) {
            response = null;
          }
          bootstrap.pubsub.emit("locator:error", [response, actionType]);
        }
      });
    }

    /**
     * Normalise a coordinate to 3 decimal places
     *
     * @param {Number} value the coordinate
     * @returns {String}
     */
    function normaliseCoordinate(value) {
      var factor = 1000; // 10 ^ 3
      return String(Math.round(value * factor) / factor);
    }

    /**
     * Locator.
     *
     * @param {Object} options passing custom options e.g. assigning an
     *                         event emitter to `pubsub` will inject your own
     *                         pubsub object.
     * @constructor
     */
    Locator = function(options) {
      var self;
      var view;
      var state;
      var stats;

      self = this;
      state = false;
      options = options || {};
      this.host = options.host || "";
      this.getLocation();

      if (options.pubsub) {
        bootstrap.pubsub = options.pubsub;
      }

      this.persistLocation = options.persistLocation || false;

      stats = new Stats(bootstrap.pubsub);
      stats.applyEvents();

      bootstrap.pubsub.on("locator:open", function(selector) {
        if (!state) {
          state = true;
          view = new LocatorView(selector, {
            enableReverseGeocode : options.enableReverseGeocode !== false,
            enableAutoComplete   : options.enableAutoComplete !== false
          });

          if (self.location && options.persistLocation === true) {
            bootstrap.pubsub.emit("locator:renderChangePrompt");
          } else {
            bootstrap.pubsub.emit("locator:renderForm");
          }
          var newsRegions = self.getNewsRegionChoices();
          if (newsRegions.length > 1) {
            bootstrap.pubsub.emit("locator:renderForm");
            bootstrap.pubsub.emit("locator:newsLocalRegions", [{
              location : { id: self.location.id },
              regions  : newsRegions
            }]);
          }

          bootstrap.pubsub.on("locator:locationSelected", function() {
            view.resetForm();
          });
        }
      });

      bootstrap.pubsub.on("locator:close", function(selector) {
        if (state) {
          state = false;
          view.close();
          view = null;
        }
      });

      bootstrap.pubsub.on("locator:geoLocation", function(position) {
        self.geoLocate(position.coords.latitude, position.coords.longitude);
      });

      bootstrap.pubsub.on("locator:submitSearch", function(searchTerm, offset) {
        self.search(searchTerm, offset);
      });

      bootstrap.pubsub.on("locator:submitLocation", function(locationId, newsRegionId) {
        self.checkLocation(locationId, newsRegionId);
      });

      bootstrap.pubsub.on("locator:submitAutoCompleteSearch", function(searchTerm) {
        self.autoComplete(searchTerm);
      });

      bootstrap.pubsub.on("locator:submitAutoCompleteLocation", function(locationId, locationName) {
        self.checkLocation(locationId, null);
      });
    };

    /**
     * Open the locator widget by emitting the event and dom selector.
     *
     * @param {String} selector the dom selector
     * @return void
     */
    Locator.prototype.open = function(selector) {
      bootstrap.pubsub.emit("locator:open", [selector]);
    };

    /**
     * Close the locator widget by emitting the event
     *
     * @return void
     */
    Locator.prototype.close = function() {
      bootstrap.pubsub.emit("locator:close");
    };

    /**
     * Handles a location by emitting events and setting a cookie (if `cookie`
     * and `expires` properties exist.
     *
     * @param {Object} location a json object containing location information
     * @return void
     */
    Locator.prototype.handleLocation = function(location) {
      var cookieString;
      if (location.cookie && location.expires && this.persistLocation === true) {
        cookieString = "locserv=" + location.cookie +
                       "; expires=" + (new Date(location.expires * 1000)).toUTCString() +
                       "; path=/; domain=.bbc.co.uk";
        this.setCookieString(cookieString);
        this.hasParsedCoookie = false;
      }

      if (this.persistLocation === true) {
        bootstrap.pubsub.emit("locator:renderChangePrompt");
        bootstrap.pubsub.emit("locator:locationChanged", [this.getLocation()]);
      } else {
        bootstrap.pubsub.emit("locator:locationSelected", [location]);
      }
    };

    /**
     * Check the location by making an AJAX request to the service passing a
     * locationId and optionally, a news region id.
     *
     * @param {Number} locationId   location id
     * @param {Number} newsRegionId the news region id
     * @return void
     */
    Locator.prototype.checkLocation = function(locationId, newsRegionId) {
      bootstrap.pubsub.emit("locator:renderWait");
      var self = this;
      var url =  this.host + "/locator/news/responsive/location.json?id=" + locationId;
      
      if (newsRegionId) {
        url += "&newsRegion=" + newsRegionId;
      }
      doRequest(
        url,
        function(r) {
          self.handleResponse(r);
        },
        "location"
      );
    };

    /**
     * Emit different events based on response type.
     *
     * @param {Object} r the response object
     * @return void
     */
    Locator.prototype.handleResponse = function(r) {
      if ("search_results" === r.type) {
        bootstrap.pubsub.emit("locator:searchResults", [r]);
      } else if ("autocomplete_search_results" === r.type) {
        bootstrap.pubsub.emit("locator:autoCompleteSearchResults", [r]);
      } else if ("news_regions" === r.type) {
        bootstrap.pubsub.emit("locator:newsLocalRegions", [r]);
      } else if ("geolocation" === r.type) {
        if (!r.isWithinContext) {
          bootstrap.pubsub.emit("locator:locationOutOfContext", [r]);
        }
      } else if ("location" === r.type) {
        this.handleLocation(r);
      }
    };

    /**
     * Search for a location and return the news region, geoname id and cookie
     * info
     *
     * @param {String} searchTerm the search term
     * @param {Number} offset     an offset specified for the results
     */
    Locator.prototype.search = function(searchTerm, offset) {
      var url = this.host + "/locator/news/responsive/search.json?search=" + searchTerm;
      var self = this;

      if (offset) {
        url += "&offset=" + offset;
      }

      bootstrap.pubsub.emit("locator:renderWait");

      doRequest(
        url,
        function(r) {
          self.handleResponse(r);
        },
        "search"
      );
    };

    /**
     * Search for a location and return the news region, geoname id and cookie
     * info
     *
     * @param {String} searchTerm the search term
     * @param {Number} offset     an offset specified for the results
     */
    Locator.prototype.autoComplete = function(searchTerm) {
      var url = this.host + "/locator/news/responsive/autocomplete.json?search=" + searchTerm;
      var self = this;

      doRequest(
        url,
        function(r) {
          self.handleResponse(r);
        },
        "autocomplete");
    };

    /**
     * Perform a reverse geolocation lookup using longitude and latitude
     * coordinates
     *
     * @param {Number} latitude
     * @param {Number} longitude
     */
    Locator.prototype.geoLocate = function(latitude, longitude) {
      var url = this.host + "/locator/news/responsive/geolocate.json?" +
                "latitude=" + normaliseCoordinate(latitude) +
                "&longitude=" + normaliseCoordinate(longitude);
      var self = this;

      bootstrap.pubsub.emit("locator:renderWait");
      doRequest(
        url,
        function(r) {
          self.handleResponse(r);
        },
        "geolocate"
      );
    };

    /**
     * Get the current cookie string. This is primarily used for stubbing
     * during for test purposes.
     *
     * @return {String}
     */
    Locator.prototype.getCookieString = function() {
      return document.cookie;
    };

    /**
     * Does the current user have multiple regions in their cookie?
     *
     * @return {Array}
     */
    Locator.prototype.getNewsRegionChoices = function() {
      var _newsRegions;
      var cookie;
      var choices;
      var index;

      choices = [];
      cookie = this.getCookieString().match(/locserv=[\w\W]*?(r=([\d+\.?]+))[;|\s|$]?/);

      if (cookie) {
        _newsRegions = cookie[2].split(".");
        for (index = 0; index < _newsRegions.length; index++) {
          choices.push({
            id   : newsTldMap[_newsRegions[index]],
            name : newsRegionsMap[_newsRegions[index]]
          });
        }
      }

      return choices;

    };

    /**
     * Set the current cookie string. This is primarily used for stubbing
     * during for test purposes.
     *
     * @param {String} value The value to set the cookie to
     * @return void
     */
    Locator.prototype.setCookieString = function(value) {
      document.cookie = value;
    };

    /**
     * Get the current users location by accessing the cookie.
     *
     * @return {Object}
     */
    Locator.prototype.getLocation = function() {
      var cookie;
      var domains;
      var domain;
      var getValues;
      var index;
      
      if (this.hasParsedCoookie) {
        return this.location;
      }

      getValues = function(store) {
        var index;
        var name;
        var values;
        var value;
        var data = {};
        
        name = store.substr(0, 1);
        store = store.substr(3);
        values = store.split(":");
        for (index = 0; index < values.length; index++) {
          value = values[index].split("=");
          value[1] = value[1].replace(/\+/g, "%20");
          data[value[0]] = decodeURIComponent(value[1]);
        }

        return {
          name : name,
          data : data
        };
      };

      cookie = this.getCookieString().match("locserv=(.*?)(;|$)");
      if (!cookie || cookie.length < 2){
        return null;
      }

      this.location = {
        id      : null,
        name    : null,
        nation  : null,
        news    : null,
        weather : null
      };

      domains = cookie[1].substr(2).split("@");
      for (index = 0; index < domains.length; index++) {
        domain = getValues(domains[index]);
        if ("l" === domain.name) {
          this.location.id = domain.data.i;
          this.location.name = domain.data.n;
          if (domain.data.h) {
            this.location.nation = nationsMap[domain.data.h];
          }
        } else if ("w" === domain.name) {
          this.location.weather = {
            id   : domain.data.i,
            name : domain.data.p
          };
        } else if ("n" === domain.name) {
          this.location.news = {
            id   : domain.data.r,
            path : newsMap[domain.data.r]
          };
        }
      }

      this.hasParsedCoookie = true;

      return this.location;

    };

    return Locator;

  }
);
