require([
  "jquery",
  "module/bootstrap",
  "locator/stats",
  "locator/locatorView"
], function($, bootstrap, Stats, LocatorView) {

  var ee;
  var view;

  module("LocatorView", {
    setup    : function() {
      ee = bootstrap.pubsub;
      view = new LocatorView("#locator-container", { pubsub: ee });
    },
    teardown : function() {
      $("div#locator-info").remove();
      $("div#locator-container").remove();
      $("div#news-container").remove();

      $("#fixtures").append("<div id=\"locator-info\" />")
        .append("<div id=\"locator-container\" />")
        .append("<div id=\"news-container\" />");

      // Remove events from pubsub
      ee.off("locator:submitSearch");
      ee.off("locator:searchResults");
      ee.off("locator:newsLocalRegions");
      ee.off("locator:locationOutOfContext");
      ee.off("locator:renderForm");
      ee.off("locator:renderChangePrompt");
      ee.off("locator:renderWait");
      ee.off("locator:error");
    }
  });

  test("constructor appends html to selector dom element", function() {
    var parent;

    parent = $("div#locator");

    equal(parent.length, 1, "Parent <div> is on the page");
    equal(parent.find("a#locator-geolocation").length, 1, "Reverse Geolocation is on the page");
    equal(parent.children("form").length, 1, "There is 1 <form> element");
    equal(parent.find("#locator-search-input").length, 1, "The input element exists");
  });

  test("constructor sets autoCompleteEnabled to false by default", function() {
    equal(view.autoCompleteEnabled, false);
  });

  test("constructor sets autoCompleteEnabled to true if options.enableAutoComplete is true", function() {
    view = new LocatorView("#locator-container", { enableAutoComplete: true });
    equal(view.autoCompleteEnabled, true);
  });

  test("constructor sets autoCompleteEnabled to true if options.enableAutoComplete is false", function() {
    view = new LocatorView("#locator-container", { enableAutoComplete: false });
    equal(view.autoCompleteEnabled, false);
  });

  test("constructor does not create autoCompleteView if options.enableAutoComplete is false", function() {
    view = new LocatorView("#locator-container", { enableAutoComplete: false });
    equal(view.autoCompleteView, null);
  });

  test("HTML5 Geolocation prompt does not get added when you disable reverse geocoding", function() {
    var link;
    $("div#locator-container").html("");
    view = new LocatorView("#locator-container", { pubsub: ee, enableReverseGeocode: false });
    link = $("a#locator-geolocation");
    equal(link.length, 0);
  });

  test("constructor applied event listener to locator:searchResults", function() {
    var view;

    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });

    ok(ee.on.calledWith("locator:searchResults"), "event set for locator:searchResults");
    
    ee.on.restore();
  });

  test("constructor applied event listener to locator:newsLocalRegions", function() {
    var view;

    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:newsLocalRegions"), "event set for locator:newsLocalRegions");

    ee.on.restore();
  });

  test("constructor applied event listener to locator:locationOutOfContext", function() {
    var view;
    
    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:locationOutOfContext"), "event set for locator:locationOutOfContext");

    ee.on.restore();
  });

  test("constructor applied event listener to locator:renderForm", function() {
    var view;
    
    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:renderForm"), "event set for locator:renderForm");

    ee.on.restore();
  });

  test("constructor applied event listener to locator:renderChangePrompt", function() {
    var view;
    
    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:renderChangePrompt"), "event set for locator:renderChangePrompt");

    ee.on.restore();
  });

  test("constructor applied event listener to locator:renderWait", function() {
    var view;
    
    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:renderWait"), "event set for locator:renderWait");

    ee.on.restore();
  });

  test("constructor applied event listener to locator:error", function() {
    var view;
    
    this.stub(ee, "on");
    view = new LocatorView("#locator-container", { pubsub: ee });
    
    ok(ee.on.calledWith("locator:error"), "event set for locator:error");

    ee.on.restore();
  });

  test("constructor listeners calls methods when event fired", function() {
    this.stub(view, "renderSearchResults");
    this.stub(view, "renderNewsLocalRegions");
    this.stub(view, "setMessage");
    this.stub(view, "renderForm");
    this.stub(view, "renderStopWait");
    this.stub(view, "resetForm");
    this.stub(view, "renderChangePrompt");
    this.stub(view, "renderWait");
    this.stub(view, "renderError");

    ee.emit("locator:searchResults", [{}]);
    ok(view.renderSearchResults.calledOnce, "renderSearchResults() was called");
    ok(view.renderSearchResults.calledWith({}), "renderSearchResults() was called with expected arguments");

    ee.emit("locator:newsLocalRegions", [{}]);
    ok(view.renderNewsLocalRegions.calledOnce, "renderNewsLocalRegions() was called");
    ok(view.renderNewsLocalRegions.calledWith({}), "renderNewsLocalRegions() was called with expected arguments");

    ee.emit("locator:locationOutOfContext");
    ok(view.setMessage.calledTwice, "setMessage() was called");

    ee.emit("locator:renderForm");
    ok(view.renderForm.calledOnce, "renderForm() was called");

    ee.emit("locator:renderChangePrompt");
    ok(view.renderStopWait.calledOnce, "renderStopWait() was called");
    ok(view.resetForm.calledOnce, "resetForm() was called");
    ok(view.renderChangePrompt.calledOnce, "renderChangePrompt() was called");

    ee.emit("locator:renderWait");
    ok(view.renderWait.calledOnce, "renderWait() was called");

    ee.emit("locator:error", [{}, "ERROR"]);
    ok(view.renderError.calledOnce, "renderError() was called");
    ok(view.renderError.calledWith({}, "ERROR"), "renderError() was called with expected arguments");
  });

  /* formHandler */

  test("formHandler() sends search term and handles event", function() {
    var e;

    e = document.createEvent("HTMLEvents");
    e.initEvent("click", true, true);
    this.stub(e, "preventDefault");

    this.stub(view, "clearResults");
    this.stub(view, "sendSearchData");

    view.input.value = "Cardiff";

    ok(view.formHandler(e) === false, "Handler returns false");
    ok(e.preventDefault.calledOnce, "default form action is prevented");
    ok(view.clearResults.calledOnce, "results are cleared");
    ok(view.sendSearchData.calledOnce, "search data sent");
    ok(view.sendSearchData.calledWith("cardiff"), "search term is lowercased"); // lowercase
  });

  /*
   * In order to prevent the user from holding the enter button to repeat multiple requests
   * the formHandler function should remove focus from the search input field after
   * submission
   */
  test("formHandler() removes focus from search input field", function() {
    var e;

    view.input.focus();
    view.input.value = "Cardiff";

    e = document.createEvent("HTMLEvents");
    e.initEvent("click", true, true);

    view.formHandler(e);

    ok(view.input !== document.activeElement, "Search input field is not the active element");

  });

  /*
   * Results handler should remove focus from the element after it has been
   * fired in order to prevent multiple requests being fired if the enter
   * key is held down when the item has focus.
   */
  test("resultsHandler() removes focus from the target element", function() {
    var e;
    var anchor;
    var anchorDomElement;

    // In order to an element to receive focus it must be attached to the DOM
    anchor = $("<a href=\"/confirm/123456\">Test</a>");
    $("#locator-container").append(anchor);
    anchorDomElement = anchor.get(0);
    anchorDomElement.focus();

    e = {
      target         : anchorDomElement,
      preventDefault : function() {}
    };
    view.resultsHandler(e);

    notEqual(anchorDomElement, document.activeElement, "Target element passed to resultsHandler does not have focus");
  
  });

  /* moreResultsHandler */

  test("moreResultsHandler() removes results error element from the page", function() {
    var errorID;

    errorID = "#locator-results-error";

    $("#locator-container").append("<p id=\"locator-results-error\" />");
    equal($(errorID).length, 1);

    view.currentResults = {
      searchTerm : "Pontypridd",
      offset     : 0,
      limit      : 10
    };

    view.moreResultsEnabled = true;
    view.moreResultsHandler({ preventDefault: function() {}});

    equal($(errorID).length, 0);
  });

  test("moreResultsHandler() emits events", function() {
    var expectedSearchTerm;
    var expectedOffset;

    expect(3);

    expectedSearchTerm = "Pontypridd";
    expectedOffset = 10;

    view.currentResults = {
      searchTerm : expectedSearchTerm,
      offset     : 0,
      limit      : 10
    };

    ee.on("locator:submitSearch", function(actualSearchTerm, actualOffset) {
      ok(true, "Event was fired");
      equal(actualSearchTerm, expectedSearchTerm, "expected searchTerm as an argument");
      equal(actualOffset, expectedOffset, "expected offset as an argument");
    });

    view.moreResultsEnabled = true;
    view.moreResultsHandler({ preventDefault: function() {}});
  });

  test("sendSearchData() fires locator:submitLocation event", function() {
    var expectedSearchTerm;
    expectedSearchTerm = "Pontypridd";

    this.stub(ee, "emit");

    view.sendSearchData(expectedSearchTerm, 0);

    ok(ee.emit.calledOnce, "Event fired");
    ok(ee.emit.calledWith(
      "locator:submitSearch",
      [expectedSearchTerm, 0]),
      "With expected arguments"
    );

    ee.emit.restore();
  });

  test("sendLocationData() fires locator:submitLocation event", function() {
    this.stub(ee, "emit");
    view.sendLocationData(1234, 5678);

    ok(ee.emit.calledOnce, "emit was called");
    ok(ee.emit.calledWith("locator:submitLocation", [1234, 5678]), "with known arguments");

    ee.emit.restore();
  });

  test("close() removes locator", function() {
    view.close();
    equal($("#locator").length, 0, "locator removed from document");
  });

  test("clearResults() clears down results", function() {
    view.results.innerHTML = "foo";
    view.currentResults = "foo";
    view.moreResults.style.display = "foo";

    view.clearResults();

    equal(view.results.innerHTML, "", "html removed from page");
    equal(view.currentResults, null, "results set removed from locator object");
    equal(view.moreResults.style.display, "none", "more results link hidden");
  });

  test("clearResults() clears any messages", function() {
    this.stub(view, "setMessage");

    view.clearResults();

    ok(view.setMessage.calledTwice, "setMessage() was called");
    ok(view.setMessage.calledWith(view.geolocationMessage, null), "geolocationMessage set to null");
    ok(view.setMessage.calledWith(view.searchMessage, null), "searchMessage set to null");
  });

  test("renderSearchResults() renders results and displays message", function() {
    var data;
    var results;
    
    data = {
      type        : "search_results",
      searchTerm  : "Cardiff",
      noOfResults : 2,
      total       : 4,
      offset      : 0,
      limit       : 2,
      results     : [
        { id : 2653822, name : "Cardiff, Cardiff" },
        { id : 3345295, name : "Cardiff International Airport, Vale of Glamorgan" }
      ]
    };

    this.stub(view, "setMessage");

    view.renderSearchResults(data);

    ok(view.setMessage.calledWith(view.searchMessage, "Search results:"));
    equal($("#locator-results").children("li").length, 2, "Two results are shown");
  });

  test("renderSearchResults() when no results are returned", function() {
    var data;
    var results;

    data = {
      type        : "search_results",
      searchTerm  : "Cardiff",
      noOfResults : 2,
      total       : 0,
      offset      : 0,
      limit       : 2,
      results     : []
    };

    this.stub(view, "setMessage");
    this.stub(view, "setFocusOnFirstResult");

    view.renderSearchResults(data);

    ok(view.setMessage.calledWith(view.searchMessage, "There were no results for \"Cardiff\""));
    equal(view.results.innerHTML, "");
    equal($(view.moreResults).css("display"), "none", "Display style is set to none");
    ok(view.setFocusOnFirstResult.calledOnce);
  });

  test("renderSearchResults() when results are paginated", function() {
    var data;
    data = {
      type        : "search_results",
      searchTerm  : "Cardiff",
      noOfResults : 2,
      total       : 400,
      offset      : 0,
      limit       : 2,
      results     : [
        { id : 2653822, name : "Cardiff, Cardiff" },
        { id : 3345295, name : "Cardiff International Airport, Vale of Glamorgan" }
      ]
    };

    view.renderSearchResults(data);

    equal($(view.moreResults).css("display"), "block", "Display is set to block");
  });

  /**
   * After submitting the search form and receiving a successful result
   * we set focus on the first result, this is to enable improve accessbility
   * e.g for users using voiceover
   */
  test("renderSearchResults() sets focus to the first result", function() {
    var data;
    
    data = {
      type        : "search_results",
      searchTerm  : "Cardiff",
      noOfResults : 2,
      total       : 400,
      offset      : 0,
      limit       : 2,
      results     : [
        { id : 2653822, name : "Cardiff, Cardiff" },
        { id : 3345295, name : "Cardiff International Airport, Vale of Glamorgan" }
      ]
    };

    view.renderSearchResults(data);

    equal($("li a", view.results).get(0), document.activeElement, "First result has focus");

  });

  test("renderNewsLocalRegions() renders results on page", function() {
    view.renderNewsLocalRegions({
      component : "search",
      mode      : "news_local_region",
      location  : {
        id        : "2654971",
        name      : "Bradworthy",
        container : "Devon"
      },
      regions   : []
    });

    ok($("#locator-message-search").text().length > 10, "Error message is displayed");

  });

  /**
   * After submitting the search form and receiving a local news region
   * response, focus should be set to the first local news region as is
   * the case with search results
   */
  test("renderNewsLocalRegions() sets focus to the first local news region", function() {
    var data;

    data = {
      component : "search",
      mode      : "news_local_region",
      location  : {
        id        : "2654971",
        name      : "Bradworthy",
        container : "Devon"
      },
      regions   : [
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

    view.renderNewsLocalRegions(data);

    equal($("li a", view.results).get(0), document.activeElement, "First local news region has focus");

  });

  test("renderStopWait()", function() {
    view.currentResults = false;
    view.searchMessage.innerHTML = "Hello World";

    view.renderStopWait();
    equal(view.searchMessage.innerHTML, "");

    // inverse
    view.currentResults = true;
    view.searchMessage.innerHTML = "Hello World";

    view.renderStopWait();
    equal(view.searchMessage.innerHTML, "Hello World");

  });

  test("renderWait()", function() {
    view.currentResults = false;
    view.searchMessage.innerHTML = "Hello World";

    view.renderWait();
    equal(view.searchMessage.innerHTML, "Please wait...");

    // inverse
    view.currentResults = true;
    view.searchMessage.innerHTML = "Hello World";

    view.renderStopWait();
    equal(view.searchMessage.innerHTML, "Hello World");
  });

  test("renderError() shows message when locator flagpole set", function() {
    this.stub(view, "renderStopWait");
    this.stub(view, "clearResults");
    this.stub(view, "disableForm");
    this.stub(view, "disableGeolocation");
    this.stub(view, "setMessage");

    view.renderError({
      flagpoles : { locator : false }
    });

    ok(view.renderStopWait.calledOnce, "renderStopWait() was called");
    ok(view.clearResults.calledOnce, "clearResults() was called");
    ok(view.disableForm.calledOnce, "disableForm() was called");
    ok(view.disableGeolocation.calledOnce, "disableGeolocation() was called");
    ok(view.setMessage.calledOnce, "setMessage() was called");
    ok(view.setMessage.calledWith(view.searchMessage, "Sorry location setting is not currently available"));
  });

  test("renderError() does not call renderStopWait when the actionType is autocomplete", function() {
    view.currentResults = true;
    this.stub(view, "renderStopWait");

    view.renderError(null, "autocomplete");
    equal(view.renderStopWait.callCount, 0, "renderStopWait() was not called");
  });

  test("renderError() shows message when reverseGeocode flagpole set", function() {
    this.stub(view, "renderStopWait");
    this.stub(view, "disableGeolocation");
    this.stub(view, "setMessage");

    view.renderError({
      flagpoles : { reverseGeocode: false, locator: true }
    }, "geolocate");

    ok(view.renderStopWait.calledOnce, "renderStopWait() was called");
    ok(view.disableGeolocation.calledOnce, "disableGeolocation() was called");
    ok(view.setMessage.calledOnce, "setMessage() was called");

    ok(view.setMessage.calledWith(
      view.geolocationMessage,
      "Sorry the \"use my current location\" feature is not currently available"
    ), "Correct message was used");
  });

  test("renderError() shows message when actionType is geolocate", function() {
    view.currentResults = true;
    this.stub(view, "setMessage");

    view.renderError(null, "geolocate");
    ok(view.setMessage.calledOnce, "setMessage() was called");
    ok(view.setMessage.calledWith(
      view.geolocationMessage,
      "Sorry an error occurred trying to detect your location. Please try again"
    ), "The correct message was displayed");
  });

  test("renderError() shows paragraph message if actionType is search", function() {
    var error;

    error = $("p#locator-results-error");
    view.currentResults = true;

    equal(error.length, 0, "No error message exists");
    view.renderError(null, "search");
    equal($("p#locator-results-error").length, 1, "Error message now appears on page");
  });

  test("renderError() shows default message", function() {
    var error;

    error = $("p#locator-results-error");
    this.stub(view, "setMessage");
    view.currentResults = true;

    view.renderError(null, "blah");
    ok(view.setMessage.calledOnce, "setMessage() was called");
    ok(view.setMessage.calledWith(
      view.searchMessage,
      "Sorry an error has occurred, please try again"
    ), "default message is shown");
  });

  test("renderError() does not show a message when the actionType is autocomplete", function() {
    view.currentResults = true;
    this.stub(view, "setMessage");

    view.renderError(null, "autocomplete");
    equal(view.setMessage.callCount, 0, "setMessage() was not called");
  });

  test("setMessage() constructs a dom element", function() {
    var element;

    element = document.createElement("p");
    view.setMessage(element, "Hello World", "hello-world");

    equal(element.innerHTML, "Hello World", "innerHTML is correct");
    equal(element.style.display, "block", "element is visible");
    ok($(element).hasClass("hello-world"), ".class exists");
  });

  /* More Results */
  test("setMoreResultsDisplay() is a proxy to the elements style", function() {
    view.setMoreResultsDisplay("");
    equal(view.moreResults.style.display, "", "More results display style has been set to ''");
  });

  test("enableMoreResults() sets moreResultsEnabled to true", function() {
    view.moreResultsEnabled = false;
    view.enableMoreResults();

    ok(view.moreResultsEnabled);
  });

  test("enableMoreResults() removes 'active' class from  element", function() {
    $(view.moreResults).addClass("disabled");
    view.enableMoreResults();
    ok($(view.moreResults).hasClass("disabled") === false, "Element is now disabled");
  });

  test("disableMoreResults() adds 'disabled' class to moreResults element", function() {
    view.disableMoreResults();
    ok($(view.moreResults).hasClass("disabled"), "element is disabled");
  });

  test("disableMoreResults() sets moreResultsEnabled to false", function() {
    view.moreResultsEnabled = true;
    view.disableMoreResults();
    ok(view.moreResultsEnabled === false);
  });

  /* Geolocation */

  test("enableGeolocation() sets moreResultsEnabled to true", function() {
    view.geoLocationEnabled = false;
    view.enableGeolocation();

    ok(view.geoLocationEnabled);
  });

  test("enableGeolocation() removes 'active' class from geolocation element", function() {
    $(view.geolocation).addClass("active");
    view.enableGeolocation();
    ok($(view.geolocation).hasClass("active") === false);
  });

  test("disableGeolocation() adds 'disabled' class to geolocation element", function() {
    view.disableGeolocation();
    ok($(view.geolocation).hasClass("disabled"));
  });

  test("disableGeolocation() adds custom class to geolocation element", function() {
    var expectedClass = "foo";
    view.disableGeolocation(expectedClass);
    ok($(view.geolocation).hasClass(expectedClass));
  });

  test("disableGeolocation() sets geoLocationEnabled to false", function() {
    view.geoLocationEnabled = true;
    view.disableGeolocation();
    ok(view.geoLocationEnabled === false);
  });

  /* renderChangePrompt */

  test("renderChangePrompt() hides form", function() {
    this.stub(view, "setFormIsShown");
    view.renderChangePrompt();

    ok(view.setFormIsShown.calledOnce, "setFormIsShown() was called");
    ok(view.setFormIsShown.calledWith(false), "setFormIsShown() was called with false");
  });

  test("renderChangePrompt() shows prompt", function() {
    this.stub(view, "setChangePromptIsShown");
    view.renderChangePrompt();

    ok(view.setChangePromptIsShown.calledOnce, "setChangePromptIsShown() was called");
    ok(view.setChangePromptIsShown.calledWith(true), "setChangePromptIsShow() was called with true");
  });

  /* renderForm */

  test("renderForm() displays the form", function() {
    this.stub(view, "setFormIsShown");
    view.renderForm();

    ok(view.setFormIsShown.calledOnce, "setFormIsShown() was called");
    ok(view.setFormIsShown.calledWith(true), "setFormIsShown() was called with true");
  });

  test("renderForm() hides the prompt", function() {
    this.stub(view, "setChangePromptIsShown");
    view.renderForm();

    ok(view.setChangePromptIsShown.calledOnce, "setChangePromptIsShown() was called");
    ok(view.setChangePromptIsShown.calledWith(false), "setChangePromptIsShown() was called with false");
  });

  test("renderForm() calls resetForm())", function() {
    this.stub(view, "resetForm");
    view.renderForm();

    ok(view.resetForm.calledOnce, "resetForm() was called");
  });

  /* resetForm */

  test("resetForm() clears the form input value", function() {
    view.input.value = "foo";
    view.resetForm();

    equal(view.input.value, "");
  });

  test("resetForm() clears results", function() {
    this.stub(view, "clearResults");
    view.resetForm();

    ok(view.clearResults.calledOnce, "clearResults() was called");
  });

  test("resetForm() clears the search message", function() {
    this.stub(view, "setMessage");
    view.resetForm();

    ok(view.setMessage.calledWith(view.searchMessage, null), "setMessage() called with correct arguments");
  });

  test("resetForm() calls enableGeolocation()", function() {
    this.stub(view, "enableGeolocation");
    view.resetForm();

    ok(view.enableGeolocation.calledOnce);
  });

  /* disableForm */

  test("disableForm() rebinds form submit listener", function() {
    this.stub(view.form, "addEventListener");
    this.stub(view.form, "removeEventListener");

    view.disableForm();

    ok(view.form.addEventListener.calledOnce);
    ok(view.form.addEventListener.calledWith("submit"));

    ok(view.form.removeEventListener.calledOnce);
    ok(view.form.removeEventListener.calledWith("submit"));
  });

  test("disableForm() adds 'disabled' class to search input", function() {
    var element;
    element = $("#locator-search-container");

    ok(element.hasClass("disabled") === false);

    view.disableForm();

    ok(element.hasClass("disabled"));
  });

  test("disableForm() disables search input", function() {
    view.disableForm();
    ok(view.input.disabled);
  });

  test("setFormIsShown() sets the correct css display value", function() {

    equal(view.form.style.display, "");

    view.setFormIsShown(true);
    equal(view.form.style.display, "block");

    view.setFormIsShown(false);
    equal(view.form.style.display, "none");
  });

  test("setChangePromptIsShown() sets the correct css display value", function() {

    equal(view.changePrompt.style.display, "");

    view.setChangePromptIsShown(false);
    equal(view.changePrompt.style.display, "none");

    view.setChangePromptIsShown(true);
    equal(view.changePrompt.style.display, "block");
  });

});
