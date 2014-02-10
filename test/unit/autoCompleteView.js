/*global require, module, test, expect, ok, equal, deepEqual, EventEmitter, jQuery, QUnit, sinon, document */
/*jslint undef: false */
require([
  "module/bootstrap",
  "locator/autoCompleteView"
], function(bootstrap, AutoCompleteView){

  var $,
      view,
      inputElement,
      resultFixtures,
      htmlFixtures,
      fixtureErrorFlagpoles;

  resultFixtures = {
    "no results" : {
      searchTerm: "no results",
      results: []
    },
    "car" : {
      searchTerm: "car",
      results: [
        { "id" : "2653836", "name" : "Caradal", "fullName" : "Caradal, Highland" },
        { "id" : "2653833", "name" : "Carbis Bay", "fullName" : "Carbis Bay, Cornwall"},
        { "id" : "2653835", "name" : "Cardiff", "fullName" : "Cardiff, Cardiff"}
      ]
    },
    "cara" : {
      searchTerm: "card",
      results: [
        { "id" : "2653836", "name" : "Caradal", "fullName" : "Caradal, Highland" }
      ]
    }
  };

  htmlFixtures = {
    resultList: "<ul id=\"locator-autocomplete-results\"><li id=\"test-search-result\">Search result</li></ul>",
    resultListItem: "<li id=\"test-search-result\">Search result</li>",
    resultListItemActive: "<li id=\"test-search-result\" class=\"active\">Search result</li>"
  };

  fixtureErrorFlagpoles = {
    flagpoles: {
      autoComplete: false
    }
  };

  $ = bootstrap.$;

  module("AutoCompleteView", {
    setup: function(){
      var html;
      html = "<input type=\"text\" id=\"locator-search-input\" />";
      $("body").append(html);
      view = new AutoCompleteView();
      inputElement = $("#locator-search-input");

      this.clock = sinon.useFakeTimers();
    },
    teardown: function() {
      inputElement.remove();
      $(document).off("keydown.locatorAutoCompleteSearchResults");
      $("#locator-autocomplete-results, #test-search-result").remove();

      // Unsubscribe events to prevent data bleed
      bootstrap.pubsub.off("locator:submitAutoCompleteSearch");
      bootstrap.pubsub.off("locator:submitAutoCompleteLocation");

      this.clock.restore();
    }
  });

  test("constructor disables browser native autocomplete", function(){
    var actualAutoComplete,
        expectedAutoComplete;

    expectedAutoComplete = "off";
    actualAutoComplete = inputElement.attr("autocomplete");

    equal(actualAutoComplete, expectedAutoComplete);
  });

  test("startInteraction is called on input focus", function(){
    this.stub(view, "startInteraction");
    inputElement.trigger("focus");
    ok(view.startInteraction.calledOnce);
  });

  test("stopInteraction is called on input blur", function(){
    this.stub(view, "stopInteraction");
    inputElement.trigger("focus").trigger("blur");
    ok(view.stopInteraction.calledOnce);
  });

  test("stopInteraction is not called on input blur if mouse button is down", function(){
    this.stub(view, "stopInteraction");
    view.hasMouseDown = true;
    inputElement.trigger("focus").trigger("blur");
    equal(view.stopInteraction.callCount, 0);
  });

  test("stopInteraction is called on locator:renderChangePrompt if inputHasFocus is true", function(){
    view.inputHasFocus = true;
    this.stub(view, "stopInteraction");
    bootstrap.pubsub.emit("locator:renderChangePrompt");
    ok(view.stopInteraction.calledOnce);
  });

  test("stopInteraction is called on locator:renderChangePrompt if inputHasFocus is false", function(){
    view.inputHasFocus = false;
    this.stub(view, "stopInteraction");
    bootstrap.pubsub.emit("locator:renderChangePrompt");
    equal(view.stopInteraction.callCount, 0);
  });

  /*
   * If currentSearchTerm is not reset then 5) will not happen as checkInput()
   * will return false.
   *
   * 1) enter 'llandaff'
   * 2) observe auto-complete results
   * 3) hit enter to perform regular search
   * 4) click change location
   * 5) observe auto-complete results
   */
  test("currentSearchTerm is set to null on locator:renderChangePrompt if inputHasFocus is true", function(){
    view.inputHasFocus = true;
    view.currentSearchTerm = "foo";
    bootstrap.pubsub.emit("locator:renderChangePrompt");
    equal(view.currentSearchTerm, null);
  });

  test("currentSearchTerm is set to null on locator:renderChangePrompt if inputHasFocus is false", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "foo";
    view.inputHasFocus = false;
    view.currentSearchTerm = expectedSearchTerm;
    this.stub(view, "stopInteraction");
    bootstrap.pubsub.emit("locator:renderChangePrompt");
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("stopWaitingForRequest is not called on locator:autoCompleteSearchResults if inputHasFocus is false", function(){
    this.stub(view, "stopWaitingForRequest");
    view.inputHasFocus = false;
    bootstrap.pubsub.emit(
      "locator:autoCompleteSearchResults",
      [resultFixtures.car]
    );
    equal(view.stopWaitingForRequest.callCount, 0);
  });

  test("stopWaitingForRequest is called on locator:autoCompleteSearchResults if inputHasFocus is true", function(){
    this.stub(view, "stopWaitingForRequest");
    view.inputHasFocus = true;
    bootstrap.pubsub.emit(
      "locator:autoCompleteSearchResults",
      [resultFixtures.car]
    );
    ok(view.stopWaitingForRequest.calledOnce);
  });

  test("renderSearchResults is not called on locator:autoCompleteSearchResults if inputHasFocus is false", function(){
    this.stub(view, "renderSearchResults");
    view.inputHasFocus = false;
    bootstrap.pubsub.emit(
      "locator:autoCompleteSearchResults",
      [resultFixtures.car]
    );
    equal(view.renderSearchResults.callCount, 0);
  });

  test("renderSearchResults is called on locator:autoCompleteSearchResults if inputHasFocus is true", function(){
    var expectedSearchResults;
    expectedSearchResults = resultFixtures.car;
    view.inputHasFocus = true;
    this.stub(view, "renderSearchResults");
    bootstrap.pubsub.emit(
      "locator:autoCompleteSearchResults",
      [expectedSearchResults]
    );
    ok(view.renderSearchResults.calledWith(expectedSearchResults));
  });

  test("stopWaitingForRequest is called on locator:error with actionType of autocomplete", function(){
    this.stub(view, "stopWaitingForRequest");
    bootstrap.pubsub.emit(
      "locator:error",
      [{}, "autocomplete"]
    );
    ok(view.stopWaitingForRequest.calledOnce);
  });

  test("stopWaitingForRequest is not called on locator:error with actionType != autocomplete", function(){
    this.stub(view, "stopWaitingForRequest");
    bootstrap.pubsub.emit(
      "locator:error",
      [{}, "not autocomplete"]
    );
    equal(view.stopWaitingForRequest.calledOnce, 0);
  });

  test("stopInteraction is called on locator:error when flagpoles.autoComplete is false", function(){
    this.stub(view, "stopInteraction");
    bootstrap.pubsub.emit(
      "locator:error",
      [fixtureErrorFlagpoles, "autocomplete"]
    );
    ok(view.stopInteraction.calledOnce);
  });

  test("input focus event is unbound on locator:error when flagpoles.autoComplete is false", function(){
    this.stub(view, "startInteraction");
    bootstrap.pubsub.emit(
      "locator:error",
      [fixtureErrorFlagpoles, "autocomplete"]
    );
    view.$input.trigger("focus");
    equal(view.startInteraction.callCount, 0);
  });

  test("input blur event is unbound on locator:error when flagpoles.autoComplete is false", function(){
    this.stub(view, "stopInteraction");
    bootstrap.pubsub.emit(
      "locator:error",
      [fixtureErrorFlagpoles, "autocomplete"]
    );
    view.$input.trigger("blur");

    // stop interaction will be called once due to the error
    // we do not expect it to be called a second time due to the blur
    equal(view.stopInteraction.callCount, 1);
  });


  /* checkInput */

  test("checkInput returns false if input is invalid", function(){
    var result;
    inputElement.val(" ");
    result = view.checkInput();
    equal(result, false);
  });

  test("checkInput sets currentSearchTerm if input is invalid", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "ab";
    view.currentSearchTerm = null;
    inputElement.val(expectedSearchTerm);
    view.checkInput();
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("checkInput calls clearInputChangedTimeout if input is invalid and $searchResults", function(){
    this.stub(view, "clearInputChangedTimeout");
    inputElement.val("a");
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");
    view.checkInput();
    ok(view.clearInputChangedTimeout.calledOnce);
  });

  test("checkInput calls clearSearchResults if input is invalid and $searchResults", function(){
    this.stub(view, "clearSearchResults");
    inputElement.val("a");
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");
    view.checkInput();
    ok(view.clearSearchResults.calledOnce);
  });

  test("checkInput returns false if input has not changed", function(){
    var result;
    inputElement.val("this is a valid input");
    view.checkInput();
    result = view.checkInput();
    equal(result, false);
  });

  test("checkInput returns false if highlightedSearchResultIndex is not null", function(){
    var result;
    inputElement.val("this is a valid input");
    view.highlightedSearchResultIndex = 1;
    result = view.checkInput();
    equal(result, false);
  });

  test("checkInput does not sets currentSearchTerm if highlightedSearchResultIndex is not null", function(){
    var expectedSearchTerm, unexpectedSearchTerm;
    expectedSearchTerm = "a valid term";
    unexpectedSearchTerm = "not expected";
    view.highlightedSearchResultIndex = 1;
    view.currentSearchTerm = expectedSearchTerm;
    inputElement.val(unexpectedSearchTerm);
    view.checkInput();
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("checkInput emits event after 500ms if input is valid", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "a valid search term";
    bootstrap.pubsub.on("locator:submitAutoCompleteSearch", function(actualSearchTerm){
        equal(actualSearchTerm, expectedSearchTerm);
      }
    );
    inputElement.val(expectedSearchTerm);
    view.checkInput();
    this.clock.tick(500);
  });

  test("checkInput calls startWaitingForRequest after 500ms if input is valid", function(){
    this.stub(view, "startWaitingForRequest");
    inputElement.val("a valid search term");
    view.checkInput();
    this.clock.tick(500);
    ok(view.startWaitingForRequest.calledOnce);
  });

  test("checkInput does not call check input instantly", function(){
    this.stub(bootstrap.pubsub, "emit");
    inputElement.val("a valid search term");
    view.checkInput();
    equal(bootstrap.pubsub.emit.callCount, 0);
  });

  test("checkInput sets currentSearchTerm if searchTerm is valid", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "a valid search term";
    view.currentSearchTerm = null;
    inputElement.val(expectedSearchTerm);
    view.checkInput();
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("checkInput sets currentSearchTerm to searchTerm if searchTerm is invalid", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "a";
    view.currentSearchTerm = "a valid search term";
    inputElement.val(expectedSearchTerm);
    view.checkInput();
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("checkInput calls clearInputChangedTimeout if searchTerm is valid", function(){
    this.stub(view, "clearInputChangedTimeout");
    inputElement.val("a valid search term");
    view.checkInput();
    ok(view.clearInputChangedTimeout.calledOnce);
  });

  test("checkInput - multiple calls in succession result in a single emit", function(){
    var expectedSearchTerm = "a valid search term abc";
    bootstrap.pubsub.on("locator:submitAutoCompleteSearch", function(actualSearchTerm){
      equal(actualSearchTerm, expectedSearchTerm);
    });
    inputElement.val("a valid search term");
    view.checkInput();
    inputElement.val("a valid search term a");
    view.checkInput();
    inputElement.val("a valid search term ab");
    view.checkInput();
    inputElement.val(expectedSearchTerm);
    view.checkInput();
    this.clock.tick(500);
  });

  /* prepareSearchTerm */

  test("prepareSearchTerm preserves valid characters", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "this is a valid string";
    equal(
      view.prepareSearchTerm(expectedSearchTerm), expectedSearchTerm
    );
  });

  test("prepareSearchTerm removes leading white space", function(){
    equal(view.prepareSearchTerm("   search term"), "search term");
  });

  test("prepareSearchTerm removes trailing white space", function(){
    equal(view.prepareSearchTerm("search term   "), "search term");
  });

  test("prepareSearchTerm removes leading and trailing white space", function(){
    equal(view.prepareSearchTerm("   search term   "), "search term");
  });

  /* isValidSearchTerm */

  test("isValidSearchTerm returns false if searchTerm is invalid", function(){
    var actualIsValidSearchTerm, expectedIsValidSearchTerm, dataProvider;
    dataProvider = [
      undefined, null, 12345, 1 + "  ", "a", " ",
      "    ", "  a ", "  a  ", "a   ", " a"
    ];
    expectedIsValidSearchTerm = false;

    dataProvider.forEach(function(searchTerm){
      actualIsValidSearchTerm = view.isValidSearchTerm(searchTerm);
      equal(actualIsValidSearchTerm, expectedIsValidSearchTerm, "Returns false for '" +searchTerm +"'");
    });
  });

  test("isValidSearchTerm returns true if searchTerm is valid", function(){
    var expectedIsValidSearchTerm,
        actualIsValidSearchTerm,
        dataProvider;

    dataProvider = [
      "valid search term", "cf10", "abc", 123 +" "
    ];
    expectedIsValidSearchTerm = true;

    dataProvider.forEach(function(searchTerm){
      actualIsValidSearchTerm = view.isValidSearchTerm(searchTerm);
      equal(actualIsValidSearchTerm, expectedIsValidSearchTerm, "Returns true for '" +searchTerm +"'");
    });
  });

  /* renderSearchResults */

  test("renderSearchResults does not render if no results", function(){
    var resultsList;
    view.renderSearchResults(resultFixtures["no results"]);
    resultsList = $("#locator-autocomplete-results");
    equal(resultsList.length, 0);
  });

  test("renderSearchResults sets $searchResults", function(){
    view.renderSearchResults(resultFixtures.car);

    equal(view.$searchResults.length, 1);
  });

  test("renderSearchResults renders results list as expected", function(){
    var resultsList;
    view.renderSearchResults(resultFixtures.car);

    resultsList = $("ul#locator-autocomplete-results");
    equal(resultsList.length, 1);
  });

  test("renderSearchResults does not render multiple lists", function(){
    var resultsList;
    view.renderSearchResults(resultFixtures.car);
    view.renderSearchResults(resultFixtures.cara);

    resultsList = $("ul#locator-autocomplete-results");
    equal(resultsList.length, 1);
  });

  test("renderSearchResults clears search results if there are zero results", function(){
    this.stub(view, "clearSearchResults");

    view.renderSearchResults(resultFixtures.car);
    view.renderSearchResults(resultFixtures["no results"]);

    ok(view.clearSearchResults.calledOnce);
  });

  test("renderSearchResults renders list with the expected number of items", function(){
    var resultsList,
        fixture;

    fixture = resultFixtures.car;
    view.renderSearchResults(fixture);

    resultsList = $("ul#locator-autocomplete-results li");

    equal(resultsList.length, fixture.results.length);
  });

  test("renderSearchResults uses fullName as item text", function(){
    var resultsList,
        fixture;
    fixture = resultFixtures.car;
    view.renderSearchResults(fixture);

    resultsList = $("ul#locator-autocomplete-results li");
    resultsList.each(function(index, element){
      equal($(element).text(), fixture.results[index].fullName);
    });
  });

  test("renderSearchResults calls positionSearchResults", function(){
    var fixture;
    fixture = resultFixtures.car;
    this.stub(view, "positionSearchResults");
    view.renderSearchResults(fixture);

    ok(view.positionSearchResults.calledOnce);
  });

  test("renderSearchResults calls addSearchResultClickListener", function(){
    var fixture;
    fixture = resultFixtures.car;
    this.stub(view, "addSearchResultClickListener");
    view.renderSearchResults(fixture);

    ok(view.addSearchResultClickListener.calledOnce);
  });

  test("renderSearchResults calls addSearchResultKeyHandler", function(){
    var fixture;
    fixture = resultFixtures.car;
    this.stub(view, "addSearchResultKeyHandler");
    view.renderSearchResults(fixture);
    ok(view.addSearchResultKeyHandler.calledOnce);
  });

  test("renderSearchResults does not call methods if $searchResults are not null", function(){
    var fixture;
    fixture = resultFixtures.car;
    this.stub(view, "positionSearchResults");
    this.stub(view, "addSearchResultClickListener");
    this.stub(view, "addSearchResultKeyHandler");

    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");
    view.renderSearchResults(fixture);

    equal(view.positionSearchResults.callCount, 0);
    equal(view.addSearchResultClickListener.callCount, 0);
    equal(view.addSearchResultKeyHandler.callCount, 0);
  });

  test("renderSearchResults <li> mouseover calls highlightSearchResultByIndex with expected index", function(){
    var expectedIndex,
        fixture,
        listElement,
        event;

    expectedIndex = 1;
    fixture = resultFixtures.car;
    this.stub(view, "highlightSearchResultByIndex");

    view.renderSearchResults(fixture);

    listElement = view.$searchResults.find("li")[expectedIndex];

    // jquery's trigger does not help us with events that use on() with a 
    // delegate so we must dispatch a native event 
    event = document.createEvent("HTMLEvents");
    event.initEvent("mouseover", true, true);
    listElement.dispatchEvent(event);

    // second argument must be false to prevent the input value from being 
    // updated
    ok(view.highlightSearchResultByIndex.calledWith(expectedIndex, false));
  });

  test("renderSearchResults <li> mouseout calls searchResultMouseOutHandler", function(){
    var listElement,
        event;

    this.stub(view, "searchResultMouseOutHandler");
    view.inputHasFocus = true;

    bootstrap.pubsub.emit(
        "locator:autoCompleteSearchResults",
        [resultFixtures.car]
    );

    listElement = view.$searchResults.find("li")[0];

    // jquery's trigger does not help us with events that use on() with a 
    // delegate so we must dispatch a native event 
    event = document.createEvent("HTMLEvents");
    event.initEvent("mouseout", true, true);
    listElement.dispatchEvent(event);

    ok(view.searchResultMouseOutHandler.calledWith(listElement));
  });

  /* clearSearchResults */

  test("clearSearchResults removes $searchResults from the dom", function(){
    $("body").append("<div id=\"test-should-be-removed\"></div>");
    view.$searchResults = $("#test-should-be-removed");
    view.clearSearchResults();

    equal($("#test-should-be-removed").length, 0);
  });

  test("clearSearchResults sets $searchResults to null", function(){
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");
    view.clearSearchResults();

    equal(view.$searchResults, null);
  });

  test("clearSearchResults sets searchResultsData to null", function(){
    view.searchResultsData = resultFixtures.car;

    view.clearSearchResults();

    equal(view.searchResultsData, null);
  });

  test("clearSearchResults calls removeSearchResultKeyHandler is $searchResults", function(){
    this.stub(view, "removeSearchResultKeyHandler");
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");
    view.clearSearchResults();
    ok(view.removeSearchResultKeyHandler.calledOnce);
  });

  test("clearSearchResults does not call removeSearchResultKeyHandler in $searchResults in null", function(){
    this.stub(view, "removeSearchResultKeyHandler");
    view.clearSearchResults();
    equal(view.removeSearchResultKeyHandler.callCount, 0);
  });

  test("clearSearchResults sets highlightedSearchResultIndex to null", function(){
    view.highlightedSearchResultIndex = 99;
    view.clearSearchResults();
    equal(view.highlightedSearchResultIndex, null);
  });

  /* addSearchResultKeyHandler */

  test("addSearchResultKeyHandler calls removeSearchResultKeyHandler", function(){
    this.stub(view, "removeSearchResultKeyHandler");
    view.addSearchResultKeyHandler();
    ok(view.removeSearchResultKeyHandler.calledOnce);
  });

  test("addSearchResultKeyHandler binds input keydown to keyDownHandler()", function(){
    this.stub(view, "keyDownHandler");
    view.addSearchResultKeyHandler();
    view.$input.trigger("keydown");
    equal(view.keyDownHandler.callCount, 1);
  });

  /* removeSearchResultKeyHandler */

  test("removeSearchResultKeyHandler unbinds input keydown from keyDownHandler()", function(){
    this.stub(view, "keyDownHandler");
    view.addSearchResultKeyHandler();
    view.removeSearchResultKeyHandler();
    view.$input.trigger("keydown");
    equal(view.keyDownHandler.callCount, 0);
  });

  /* keyDownHandler */

  test("keyDownHandler calls highlightNextSearchResult on down arrow", function(){
    this.stub(view, "highlightNextSearchResult");
    view.keyDownHandler({
      keyCode: view.keyCode.downArrow,
      preventDefault: function() {}
    });
    equal(view.highlightNextSearchResult.callCount, 1);
  });

  test("keyDownHandler calls highlightPrevSearchResult on up arrow", function(){
    this.stub(view, "highlightPrevSearchResult");
    view.keyDownHandler({
      keyCode: view.keyCode.upArrow,
      preventDefault: function() {}
    });
    equal(view.highlightPrevSearchResult.callCount, 1);
  });

  // preventDefault must be called on up key to stop the input caret from being 
  // positioned at the start of the input string
  test("keyDownHandler calls event.preventDefault on up arrow", function(){
    var event;
    event = {
      keyCode: view.keyCode.upArrow,
      preventDefault: function() {}
    };
    this.stub(event, "preventDefault");
    this.stub(view, "highlightPrevSearchResult");
    view.keyDownHandler(event);
    equal(event.preventDefault.callCount, 1);
  });

  test("keyDownHandler calls clearSearchResults on escape", function(){
    this.stub(view, "clearSearchResults");
    view.keyDownHandler({
      keyCode: view.keyCode.escape,
      preventDefault: function() {}
    });
    equal(view.clearSearchResults.callCount, 1);
  });

  test("keyDownHandler calls enterKeyHandler on enter", function(){
    var expectedEvent;
    expectedEvent = {keyCode: view.keyCode.enter};
    this.stub(view, "enterKeyHandler");
    view.keyDownHandler(expectedEvent);
    ok(view.enterKeyHandler.calledWith(expectedEvent));
  });

  /* escapeKeyHandler */

  test("escapeKeyHandler sets input value to currentSearchTerm if highlightedSearchResultIndex is not null", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "expected search term";
    view.highlightedSearchResultIndex = 1;
    view.currentSearchTerm = expectedSearchTerm;
    view.escapeKeyHandler();
    equal(view.$input.val(), expectedSearchTerm);
  });

  test("escapeKeyHandler calls clearSearchResults", function(){
    this.stub(view, "clearSearchResults");
    view.escapeKeyHandler();
    ok(view.clearSearchResults.calledOnce);
  });

  /* enterKeyHandler */

  test("enterKeyHandler calls clearSearchResults", function(){
    var event;
    event = { preventDefault: function(){} };
    view.highlightedSearchResultIndex = 1;
    view.searchResultsData = resultFixtures.car;
    this.stub(view, "clearSearchResults");
    view.enterKeyHandler(event);
    ok(view.clearSearchResults.calledOnce);
  });

  test("enterKeyHandler calls clearInputChangedTimeout", function(){
    var event;
    event = { preventDefault: function(){} };
    view.highlightedSearchResultIndex = 1;
    view.searchResultsData = resultFixtures.car;
    this.stub(view, "clearInputChangedTimeout");
    view.enterKeyHandler(event);
    ok(view.clearInputChangedTimeout.calledOnce);
  });

  test("enterKeyHandler calls submitSearchResultByIndex if highlightedSearchResultIndex is not null", function(){
    var event, expectedIndex;
    event = { preventDefault: function(){} };
    expectedIndex = 1;
    view.highlightedSearchResultIndex = expectedIndex;
    this.stub(view, "submitSearchResultByIndex");
    view.enterKeyHandler(event);
    ok(view.submitSearchResultByIndex.calledWith(expectedIndex));
  });

  test("enterKeyHandler cancels event default action if highlightedSearchResultIndex is not null", function(){
    var event;
    event = { preventDefault: function(){} };
    view.highlightedSearchResultIndex = 1;
    this.stub(event, "preventDefault");
    view.searchResultsData = resultFixtures.car;
    view.enterKeyHandler(event);
    ok(event.preventDefault.calledOnce);
  });

  test("enterKeyHandler does not call submitSearchResultByIndex if highlightedSearchResultIndex is null", function(){
    var event;
    event = { preventDefault: function(){} };
    view.highlightedSearchResultIndex = null;
    this.stub(view, "submitSearchResultByIndex");
    view.enterKeyHandler(event);
    equal(view.submitSearchResultByIndex.callCount, 0);
  });

  /*
   * clearSearchResults() must be called after submitSearchResultByIndex().
   * view.searchResultsData is required within submitSearchResultByIndex() and is
   * reset to null by clearSearchResults()
   */
  test("enterKeyHandler calls clearSearchResults after submitSearchResultByIndex if highlightedSearchResultIndex is not null", function(){
    var event,
        clearSearchResultsStub;
    event = { preventDefault: function(){} };
    view.highlightedSearchResultIndex = 1;
    this.stub(view, "submitSearchResultByIndex");
    clearSearchResultsStub = this.stub(view, "clearSearchResults");
    view.enterKeyHandler(event);
    ok(clearSearchResultsStub.calledOnce);
    ok(view.submitSearchResultByIndex.calledBefore(clearSearchResultsStub));
  });

  /* highlightNextSearchResult */

  test("highlightNextSearchResult calls highlightSearchResultByIndex with default index of 0", function(){
    view.highlightedSearchResultIndex = null;
    this.stub(view, "highlightSearchResultByIndex");
    view.highlightNextSearchResult();
    ok(view.highlightSearchResultByIndex.calledWith(0, true));
  });

  test("highlightNextSearchResult calls highlightSearchResultByIndex with incremented index", function(){
    view.highlightedSearchResultIndex = 1;
    this.stub(view, "highlightSearchResultByIndex");
    view.searchResultsData = resultFixtures.car;
    view.highlightNextSearchResult();
    ok(view.highlightSearchResultByIndex.calledWith(2, true));
  });

  test("highlightNextSearchResult calls removeSearchResultHighlight at the end of the list", function(){
    this.stub(view, "removeSearchResultHighlight");
    this.stub(view, "highlightSearchResultByIndex");

    view.renderSearchResults(resultFixtures.car);
    view.highlightedSearchResultIndex = 2;
    view.highlightNextSearchResult();

    ok(view.removeSearchResultHighlight.calledWith(true));

    // need to check this as it also calls removeSearchResultHighlight
    equal(view.highlightSearchResultByIndex.callCount, 0);
  });

  /* selectPrevSearchResult */

  test("highlightPrevSearchResult calls highlightSearchResultByIndex with default index of results.length", function(){
    var fixture;
    fixture = resultFixtures.car;
    view.highlightedSearchResultIndex = null;
    view.searchResultsData = fixture;
    this.stub(view, "highlightSearchResultByIndex");
    view.highlightPrevSearchResult();
    ok(view.highlightSearchResultByIndex.calledWith(fixture.results.length - 1, true));
  });

  test("highlightPrevSearchResult calls highlightSearchResultByIndex with decremented index", function(){
    view.highlightedSearchResultIndex = 1;
    this.stub(view, "highlightSearchResultByIndex");
    view.searchResultsData = resultFixtures.car;
    view.highlightPrevSearchResult();
    ok(view.highlightSearchResultByIndex.calledWith(0, true));
  });

  test("highlightPrevSearchResult calls removeSearchResultHighlight at the start of the list", function(){
    this.stub(view, "removeSearchResultHighlight");
    this.stub(view, "highlightSearchResultByIndex");

    view.renderSearchResults(resultFixtures.car);
    view.highlightedSearchResultIndex = 0;
    view.highlightPrevSearchResult();

    ok(view.removeSearchResultHighlight.calledWith(true));

    // need to check this as it also calls removeSearchResultHighlight
    equal(view.highlightSearchResultByIndex.callCount, 0);
  });

  /* removeSearchResultHighlight */

  test("removeSearchResultHighlight does not reset the input field value by default", function(){
    var expectedInputValue,
        actualInputValue;
    
    expectedInputValue = "some search result";

    view.currentSearchTerm = "foo";
    inputElement.val(expectedInputValue);
    view.renderSearchResults(resultFixtures.car);
    view.removeSearchResultHighlight();

    actualInputValue = inputElement.val();
    equal(actualInputValue, expectedInputValue);
  });

  test("removeSearchResultHighlight resets the input field value if updateInputValue is true", function(){
    var expectedInputValue,
        actualInputValue;
    
    expectedInputValue = "foo";

    view.currentSearchTerm = expectedInputValue;
    inputElement.val("a different value");
    view.renderSearchResults(resultFixtures.car);
    view.removeSearchResultHighlight(true);

    actualInputValue = inputElement.val();
    equal(actualInputValue, expectedInputValue);
  });

  test("removeSearchResultHighlight removes highlight class", function(){
    var expectedSearchResultIndex,
        searchResultElement;
    
    expectedSearchResultIndex = 2;

    view.renderSearchResults(resultFixtures.car);
    searchResultElement = view.$searchResults.find("li:nth-child(1)");
    searchResultElement.addClass("active");
    view.highlightedSearchResultIndex = null;
    view.removeSearchResultHighlight();
    equal(searchResultElement.hasClass("active"), false);
  });

  test("removeSearchResultHighlight sets highlightedSearchResultIndex to null", function(){
    var expectedSearchResultIndex;
    expectedSearchResultIndex = null;

    view.renderSearchResults(resultFixtures.car);
    view.highlightedSearchResultIndex = 2;
    view.removeSearchResultHighlight();
    equal(view.highlightedSearchResultIndex, expectedSearchResultIndex);
  });

  /* highlightSearchResultByIndex */

  test("highlightSearchResultByIndex sets highlightedSearchResultIndex", function(){
    var expectedSearchResultIndex;
    expectedSearchResultIndex = 2;

    view.renderSearchResults(resultFixtures.car);
    view.highlightedSearchResultIndex = null;
    view.highlightSearchResultByIndex(expectedSearchResultIndex);
    equal(view.highlightedSearchResultIndex, expectedSearchResultIndex);
  });

  test("highlightSearchResultByIndex calls removeSearchResultHighlight", function(){
    this.stub(view, "removeSearchResultHighlight");
    view.renderSearchResults(resultFixtures.car);

    view.highlightSearchResultByIndex(1);

    ok(view.removeSearchResultHighlight.calledOnce);
  });

  test("highlightSearchResultByIndex adds active class to correct search results", function(){
    view.renderSearchResults(resultFixtures.car);

    // view has a starting index of 0
    view.highlightSearchResultByIndex(1);

    // nth-child has a starting index of 1 
    equal(view.$searchResults.find("li:nth-child(2)").hasClass("active"), true);
  });

  test("highlightSearchResultByIndex sets the input text to the selected item", function(){
    var fixture,
        expectedValue;
    fixture = resultFixtures.car;
    expectedValue = fixture.results[1].fullName;
    view.renderSearchResults(fixture);

    // view has a starting index of 0
    view.highlightSearchResultByIndex(1, true);

    equal(inputElement.val(), expectedValue);
  });

  test("highlightSearchResultByIndex does not set the input text to the selected item by default", function(){
    var fixture,
        expectedValue;
    fixture = resultFixtures.car;
    expectedValue = "foo";
    inputElement.val(expectedValue);
    view.renderSearchResults(fixture);

    // view has a starting index of 0
    view.highlightSearchResultByIndex(1);

    equal(inputElement.val(), expectedValue);
  });

  /* addSearchResultClickListener */

  test("addSearchResultClickListener binds to list mousedown", function(){
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    view.addSearchResultClickListener();
    view.$searchResults.trigger("mousedown");

    ok(view.hasMouseDown);
  });

  test("addSearchResultClickListener then mouseup calls bodyMouseUpHandler())", function(){
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    this.stub(view, "bodyMouseUpHandler");

    view.hasMouseDown = true;
    view.addSearchResultClickListener();
    view.$searchResults.trigger("mousedown");
    bootstrap.$("body").trigger("mouseup");

    ok(view.bodyMouseUpHandler.calledOnce);
  });

  /* bodyMouseUpHandler */

  test("bodyMouseUpHandler sets hasMouseDown to false", function(){
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    view.hasMouseDown = true;
    view.bodyMouseUpHandler({target: null});
    equal(view.hasMouseDown, false);
  });

  test("bodyMouseUpHandler clears search results", function(){
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    this.stub(view, "clearSearchResults");
    view.bodyMouseUpHandler({target: null});
    ok(view.clearSearchResults.calledOnce);
  });

  test("bodyMouseUpHandler calls submitSearchResultByIndex() with correct index if e.target is a search result", function(){
    var expectedElement,
        expectedIndex;
    
    expectedIndex = 0;
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    this.stub(view, "submitSearchResultByIndex");

    expectedElement = view.$searchResults.find("#test-search-result");
    view.bodyMouseUpHandler({ target: expectedElement });

    ok(view.submitSearchResultByIndex.calledWith(expectedIndex));
  });

  test("bodyMouseUpHandler does not call submitSearchResultByIndex() if e.target is not a search result", function(){
    $("body").append(htmlFixtures.resultList +"<div id=\"test-non-search-result\"></div>");
    view.$searchResults = $("#locator-autocomplete-results");

    this.stub(view, "submitSearchResultByIndex");

    view.bodyMouseUpHandler({
      target: $("#test-non-search-result")
    });

    equal(view.submitSearchResultByIndex.callCount, 0);
  });

  /*
   * clearSearchResults() must be called after submitSearchResultByIndex().
   * view.searchResultsData is required within submitSearchResultByIndex() and is
   * reset to null by clearSearchResults()
   */
  test("bodyMouseUpHandler calls submitSearchResultByIndex() before clearing search results", function(){
    var submitSearchResultByIndexStub,
        clearSearchResultsStub;
    
    $("body").append(htmlFixtures.resultList);
    view.$searchResults = $("#locator-autocomplete-results");

    submitSearchResultByIndexStub = this.stub(view, "submitSearchResultByIndex");
    clearSearchResultsStub = this.stub(view, "clearSearchResults");

    view.bodyMouseUpHandler({
      target: $("#test-search-result")
    });

    ok(submitSearchResultByIndexStub.calledBefore(clearSearchResultsStub));
  });

  /* submitSearchResultByIndex */

  test("submitSearchResultByIndex emits expected locator:submitAutoCompleteLocation", function(){
    var fixture,
        expectedLocationId,
        expectedLocationName;

    fixture = resultFixtures.car;
    expectedLocationId = fixture.results[0].id;
    expectedLocationName = fixture.results[0].name;
    view.searchResultsData = fixture;

    bootstrap.pubsub.on("locator:submitAutoCompleteLocation", function(actualLocationId, actualLocationName){
      equal(actualLocationId, expectedLocationId);
      equal(actualLocationName, expectedLocationName);
    });

    view.submitSearchResultByIndex(0);
  });

  test("submitSearchResultByIndex sets the input value to the search results full name", function(){
    var fixture,
        expectedLocationFullName,
        actualLocationFullName;

    fixture = resultFixtures.car;
    expectedLocationFullName = fixture.results[0].fullName;
    view.searchResultsData = fixture;
    
    view.submitSearchResultByIndex(0);

    actualLocationFullName = inputElement.val();

    equal(actualLocationFullName, expectedLocationFullName);
  });

  /* positionSearchResults */

  test("positionSearchResults positions results adjacent to input", function(){
    var top,
        expectedLeft,
        expectedTop,
        actualLeft,
        actualTop,
        resultsBox;
    
    top = 200;
    expectedLeft = "100px";
    inputElement.css({
      position: "absolute",
      left: expectedLeft,
      top: top + "px",
      padding: 0,
      margin: 0
    });
    expectedTop = (top + inputElement.outerHeight()) +"px";

    $("body").append(htmlFixtures.resultList);

    view.$searchResults = $("#locator-autocomplete-results");
    view.positionSearchResults();

    resultsBox = document.getElementById("locator-autocomplete-results");

    actualLeft = resultsBox.style.left;
    actualTop = resultsBox.style.top;

    equal(actualLeft, expectedLeft, "Left position is set correctly");
    equal(actualTop, expectedTop, "Top position is set correctly");
  });

  /* searchResultMouseOutHandler */

  test("searchResultMouseOverHandler removes active class", function(){
    var $listElement;
    $("body").append(htmlFixtures.resultListItemActive);
    $listElement = $("#test-search-result");

    view.searchResultMouseOutHandler($listElement[0]);

    equal($listElement.hasClass("active"), false);
  });

  /* startInteraction */

  test("startInteraction sets inputHasFocus to true", function(){
    view.inputHasFocus = false;
    view.startInteraction();
    ok(view.inputHasFocus);
  });

  test("startInteraction - input keyup calls checkInput", function(){
    this.stub(view, "checkInput");
    view.startInteraction();
    view.$input.trigger("keyup");
    ok(view.checkInput.calledOnce);
  });

  /* stopInteraction */

  test("stopInteraction sets currentSearchTerm to the input value if highlightedSearchResultIndex is not null", function(){
    var expectedSearchTerm;
    expectedSearchTerm = "expected search term";
    view.currentSearchTerm = null;
    view.highlightedSearchResultIndex = 1;
    view.$input.val(expectedSearchTerm);
    view.stopInteraction();
    equal(view.currentSearchTerm, expectedSearchTerm);
  });

  test("stopInteraction sets inputHasFocus to false", function(){
    view.inputHasFocus = true;
    view.stopInteraction();
    equal(view.inputHasFocus, false);
  });

  test("stopInteraction unbinds checkInput from input keyup", function(){
    this.stub(view, "checkInput");
    view.startInteraction();
    view.stopInteraction();
    view.$input.trigger("keyup");
    equal(view.checkInput.callCount, 0);
  });

  test("stopInteraction calls clearSearchResults", function(){
    this.stub(view, "clearSearchResults");
    view.stopInteraction();
    ok(view.clearSearchResults.calledOnce);
  });

  test("stopInteraction calls stopWaitingForRequest", function(){
    this.stub(view, "stopWaitingForRequest");
    view.stopInteraction();
    ok(view.stopWaitingForRequest.calledOnce);
  });

  test("stopInteraction calls clearSearchResults", function(){
    this.stub(view, "clearSearchResults");
    view.stopInteraction();
    ok(view.clearSearchResults.calledOnce);
  });

  /* startWaitingForRequest */

  test("startWaitingForRequest adds waiting calss to $input", function(){
    view.startWaitingForRequest();
    ok(view.$input.hasClass("waiting"));
  });

  /* stopWaitingForRequest */

  test("stopWaitingForRequest removes waiting class from $input", function(){
    view.$input.addClass("waiting");
    view.stopWaitingForRequest();
    equal(view.$input.hasClass("waiting"), false);
  });

  /* clearInputChangedTimeout */

  test("clearInputChangedTimeout clears any existing interval", function(){
    view.inputChangedTimeoutId = 1234;
    view.clearInputChangedTimeout();
    equal(view.inputChangedTimeoutId, null);
  });
});

