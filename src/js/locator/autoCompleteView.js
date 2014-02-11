define([
    "module/bootstrap"
  ],
  function(bootstrap) {
    var $;
    var AutoCompleteView;
    var numberOfCharactersBeforeDataRequestIsMade;
    var durationBeforeInputIsChecked;

    $ = bootstrap.$;
    numberOfCharactersBeforeDataRequestIsMade = 2;
    durationBeforeInputIsChecked = 500;

    /**
     * Prepare an instance of AutoCompleteView
     *
     * @constructor
     */
    AutoCompleteView = function() {
      var self = this;

      this.inputHasFocus = false;
      this.hasMouseDown = false;
      this.$searchResults = null;
      this.highlightedSearchResultIndex = null;

      this.input = document.getElementById("locator-search-input");
      this.$input = $("#locator-search-input");
      this.$input.attr("autocomplete", "off");

      this.keyCode = {
        enter     : 13,
        escape    : 27,
        upArrow   : 38,
        downArrow : 40
      };

      if (this.input) {
        
        this.$input.on("focus.locatorAutoCompleteInput", function(event) {
          self.startInteraction();
          event.preventDefault();
        });

        this.$input.on("blur.locatorAutoCompleteInput", function(event) {
          if (!self.hasMouseDown) {
            self.stopInteraction();
          }
          event.preventDefault();
        });

      }

      bootstrap.pubsub.on("locator:autoCompleteSearchResults", function(data) {
        if (self.inputHasFocus) {
          self.stopWaitingForRequest();
          self.renderSearchResults(data);
        }
      });

      /*
       * After a regular search for a string with a single result, eg 
       * 'llandaff', the input field is not displayed but still has focus. 
       * Therefore it's blur event is not triggered. We listen for
       * locator:renderChangePrompt instead. Not ideal: this module should
       * not really be aware of this event.
       */
      bootstrap.pubsub.on("locator:renderChangePrompt", function(data) {
        if (self.inputHasFocus) {
          self.stopInteraction();
          /*
           * If currentSearchTerm is not reset then 6) will not happen as 
           * checkInput() will return false.
           *
           * 1) enter 'llandaff'
           * 2) observe auto-complete results
           * 3) hit enter to perform regular search
           * 4) click change location
           * 5) enter 'llandaff'
           * 6) observe auto-complete results
           *
           * We do not want to set currentSearchTerm to null on blur or 
           * stopInteraction as 6) would not happen:
           *
           * 1) focus on input
           * 2) enter a string with auto-omplet results eg 'car'
           * 3) tab to next element (submit button)
           * 4) observe auto-complete results are removed
           * 5) reverse tab back to input
           * 6) no auto-complete results displayed
           */
          self.currentSearchTerm = null;
        }
      });

      bootstrap.pubsub.on("locator:error", function(data, actionType) {
        if ("autocomplete" === actionType) {
          self.stopWaitingForRequest();
        }

        if (data && data.flagpoles && !data.flagpoles.autoComplete) {
          self.stopInteraction();
          self.$input.off("focus.locatorAutoCompleteInput");
          self.$input.off("blur.locatorAutoCompleteInput");
        }
      });

    };

    /**
     * Check if the current input field value is valid. Emit an event if it 
     * valid.
     *
     * @return null|false
     */
    AutoCompleteView.prototype.checkInput = function() {
      var self;
      var searchTerm;
      var isValidSearchTerm;
      
      self = this;
      searchTerm = this.prepareSearchTerm(this.input.value);
      isValidSearchTerm = this.isValidSearchTerm(searchTerm);

      if (!isValidSearchTerm) {
        
        if (this.$searchResults) {
          this.clearInputChangedTimeout();
          this.clearSearchResults();
        }
        
        this.currentSearchTerm = searchTerm;
        
        return false;
      
      } else if (this.currentSearchTerm === searchTerm || null !== this.highlightedSearchResultIndex) {
        return false;
      }

      this.currentSearchTerm = searchTerm;

      /*
       * @todo we could search within the current searchResultsData, 
       * rather than making an additional request, if:
       * 
       * 1) The new searchTerm is an extension to the previous search term
       * eg 'car' followed by 'card'
       *
       * 2) The current searchResultsData contains all of the results for 
       * the previous term (not a single page of results)
       */

      // Wait 500ms before emiting an event. Prevents multiple requests 
      // from being made as a user enters a search term
      this.clearInputChangedTimeout();
      this.inputChangedTimeoutId = setTimeout(
          function() {
            bootstrap.pubsub.emit("locator:submitAutoCompleteSearch", [searchTerm]);
            self.startWaitingForRequest();
          },
          durationBeforeInputIsChecked
      );
    };

    /**
     * Prepare a string for validation
     *
     * @param {string} searchTerm the string to prepare
     * @return {string} the prepared string
     */
    AutoCompleteView.prototype.prepareSearchTerm = function(searchTerm) {
      return String(searchTerm).replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    };

    /**
     * Validate a search term
     *
     * @param {string} searchTerm the string to validate
     * @return {boolean} is the search term valid
     */
    AutoCompleteView.prototype.isValidSearchTerm = function(searchTerm) {
      var value;
      var hasRequiredLength;
          
      if ("string" !== typeof searchTerm) {
        return false;
      }

      value = this.prepareSearchTerm(searchTerm);
      hasRequiredLength = value.length >= numberOfCharactersBeforeDataRequestIsMade;

      if (!hasRequiredLength) {
        return false;
      }

      return true;
    };
                       
    /**
     * Render the response from an auto-complete json XHR as dom elements
     *
     * @param {object} searchResultsData the results to render
     * @return void
     */
    AutoCompleteView.prototype.renderSearchResults = function(searchResultsData) {
      var self;
      var html;
      var searchResultIndex;
      var noOfSearchResults;
          
      self = this;
      this.searchResultsData = searchResultsData;
      noOfSearchResults = searchResultsData.results.length;

      if (0 === noOfSearchResults) {
        this.clearSearchResults();
        return;
      }

      if (null === this.$searchResults) {
        $("body").append("<ul id=\"locator-autocomplete-results\"></ul>");
        this.$searchResults = $("#locator-autocomplete-results");

        this.$searchResults.on("mouseover", "li", function(event) {
          self.highlightSearchResultByIndex($(this).index(), false);
        }).on("mouseout", "li", function(event) {
          self.searchResultMouseOutHandler(event.target);
        });

        this.positionSearchResults();
        this.addSearchResultClickListener();
        self.addSearchResultKeyHandler();
      }

      html = "";
      for (searchResultIndex = 0; searchResultIndex < noOfSearchResults; searchResultIndex++) {
        html += "<li>" + searchResultsData.results[searchResultIndex].fullName + "</li>";
      }
      this.$searchResults.html(html);

    };
    
    /**
     * Clear rendered search results from the DOM
     *
     * @return void
     */
    AutoCompleteView.prototype.clearSearchResults = function() {
      this.searchResultsData = null;
      this.highlightedSearchResultIndex = null;
      if (this.$searchResults) {
        this.$searchResults.remove();
        this.$searchResults = null;
        this.removeSearchResultKeyHandler();
      }
    };

    /**
     * Add a key event handler to enable navigation and selection of 
     * displayed search results. Not the same as startInteraction().
     *
     * @return void
     */
    AutoCompleteView.prototype.addSearchResultKeyHandler = function() {
      var self;
      
      // is this actually needed? it should not be necessary
      this.removeSearchResultKeyHandler();
      self = this;
      
      $(document).on("keydown.locatorAutoCompleteSearchResults", function(e) {
        self.keyDownHandler(e);
      });
    };

    /**
     * Remove key event handling for navigation of search results. Not the
     * same as stopInteraction().
     *
     * @return void
     */
    AutoCompleteView.prototype.removeSearchResultKeyHandler = function() {
      $(document).off("keydown.locatorAutoCompleteSearchResults");
    };

    /**
     * Handle a key down event
     *
     * @param {object} event the key down event
     * @return void
     */
    AutoCompleteView.prototype.keyDownHandler = function(event) {
      
      switch (event.keyCode) {
        
        case this.keyCode.escape:
          this.escapeKeyHandler();
          break;
        
        case this.keyCode.enter:
          this.enterKeyHandler(event);
          break;
        
        case this.keyCode.upArrow:
          // preventDefault must be called to stop the input caret 
          // from being positioned at the start of the input string
          event.preventDefault();
          this.highlightPrevSearchResult();
          break;
        
        case this.keyCode.downArrow:
          this.highlightNextSearchResult();
          break;
        
        default:
          break;
      }

    };
                    
    /**
     * Handle an escape key event. Clear any displyaed results and reset the
     * input field text if required.
     *
     * @return void
     */
    AutoCompleteView.prototype.escapeKeyHandler = function() {
      if (null !== this.highlightedSearchResultIndex) {
        this.$input.val(this.currentSearchTerm);
      }
      this.clearSearchResults();
    };

    /**
     * Handle an enter key event. If the user has selected an autocomplete 
     * result then submit it. 
     *
     * @param {object} event the key event
     * @return void
     */
    AutoCompleteView.prototype.enterKeyHandler = function(event) {
      if (null !== this.highlightedSearchResultIndex) {
        event.preventDefault();
        this.submitSearchResultByIndex(this.highlightedSearchResultIndex);
      }
      this.clearInputChangedTimeout();
      this.clearSearchResults();
    };

    /**
     * Select the next search result.
     *
     * @return void
     */
    AutoCompleteView.prototype.highlightNextSearchResult = function() {
      var index;
      
      index = this.highlightedSearchResultIndex;
      
      if (null === index) {
        index = 0;
      } else {
        index++;
        if (this.searchResultsData.results.length <= index) {
          this.removeSearchResultHighlight(true);
          return;
        }
      }

      this.highlightSearchResultByIndex(index, true);
    };

    /**
     * Select the previous search result.
     *
     * @return void
     */
    AutoCompleteView.prototype.highlightPrevSearchResult = function() {
      var index;
      
      index = this.highlightedSearchResultIndex;

      if (null === index) {
        index = this.searchResultsData.results.length - 1;
      } else {
        index--;
        if (0 > index) {
          this.removeSearchResultHighlight(true);
          return;
        }
      }

      this.highlightSearchResultByIndex(index, true);
    };

    /**
     * Select a search result by index.
     *
     * @param {int} index the index to select
     * @param {boolean} updateInputValue should the input field value be set 
     * @return void
     */
    AutoCompleteView.prototype.highlightSearchResultByIndex = function(index, updateInputValue) {
      var searchResult;

      this.removeSearchResultHighlight();
      searchResult = this.searchResultsData.results[index];
      this.highlightedSearchResultIndex = index;
      $(this.$searchResults.find("li")[index]).addClass("active");

      if (updateInputValue) {
        this.$input.val(searchResult.fullName);
      }

    };

    /**
     * Remove any highlighted search result 
     *
     * @param {boolean} updateInputValue should the input field value be set 
     * @return void
     */
    AutoCompleteView.prototype.removeSearchResultHighlight = function(updateInputValue) {
      this.highlightedSearchResultIndex = null;
      this.$searchResults.find("li.active").removeClass("active");

      if (updateInputValue) {
        this.$input.val(this.currentSearchTerm);
      }

    };

    /**
      * Handle the mouse moving out of a search result
      *
      * @param {object} listElement the dom element the mouse has moved out of
      * @return void
      */
    AutoCompleteView.prototype.searchResultMouseOutHandler = function(listElement) {
      $(listElement).removeClass("active");
    };

    /**
     * Attach mouse event handlers for clicks on search results
     *
     * @return void
     */
    AutoCompleteView.prototype.addSearchResultClickListener = function() {
      var self;
      var href;
      var isSearchResultElement;

      self = this;
      this.$searchResults.on("mousedown", function(event) {
        self.hasMouseDown = true;
        bootstrap.$("body").one("mouseup", function(event) {
          self.bodyMouseUpHandler(event);
        });
      });

    };

    /**
     * Handle a mouse up event somewhere within the document body
     *
     * @param {object} event the click event
     * @return void
     */
    AutoCompleteView.prototype.bodyMouseUpHandler = function(event) {
      var listElement;
      var searchResultIndex;
      
      this.hasMouseDown = false;

      // is the event target an element within 
      // #locator-autocomplete-results 
      if (this.$searchResults.find(event.target).length) {
        searchResultIndex = $(event.target).index();
        this.submitSearchResultByIndex(searchResultIndex);
      }

      this.clearSearchResults();
    };

    /**
     * Submit a search result by it's index. Causes an pubsub event to be 
     * emitted
     *
     * @param {int} index the search result index
     * @return void
     */
    AutoCompleteView.prototype.submitSearchResultByIndex = function(index) {
      var searchResult;

      searchResult = this.searchResultsData.results[index];

      // update the input value
      this.$input.val(searchResult.fullName);

      // extract the full place name (without truncation)
      bootstrap.pubsub.emit("locator:submitAutoCompleteLocation", [searchResult.id, searchResult.name]);
    };

    /**
     * Position the search result dom element adjacent to the input field
     *
     * @return void
     */
    AutoCompleteView.prototype.positionSearchResults = function() {
      var inputOffset;
      
      inputOffset = this.$input.offset();
      this.$searchResults.css({
        left : parseInt(inputOffset.left, 0),
        top  : parseInt(inputOffset.top, 0) + this.$input.outerHeight()
      });
    };
                           
    /**
     * Start user interaction with the input field
     *
     * @return void
     */
    AutoCompleteView.prototype.startInteraction = function() {
      var self = this;
      
      this.inputHasFocus = true;

      this.$input.on("keyup", function() {
        self.checkInput();
      });
    };

    /**
     * Stop user interaction with the input field
     *
     * @return void
     */
    AutoCompleteView.prototype.stopInteraction = function() {
      var inputValue;

      inputValue = this.$input.val();
      if (null !== this.highlightedSearchResultIndex && inputValue !== this.currentSearchTerm) {
        this.currentSearchTerm = inputValue;
      }

      this.clearInputChangedTimeout();
      this.clearSearchResults();
      this.stopWaitingForRequest();

      this.$input.off("keyup");

      this.inputHasFocus = false;
    };

    /**
     * Start waiting for an search request.
     *
     * @return void
     */
    AutoCompleteView.prototype.startWaitingForRequest = function() {
      this.$input.addClass("waiting");
    };

    /**
     * Stop waiting for an search request.
     *
     * @return void
     */
    AutoCompleteView.prototype.stopWaitingForRequest = function() {
      this.$input.removeClass("waiting");
    };

    /**
     * Clear the current input changed timeout.
     *
     * @return void
     */
    AutoCompleteView.prototype.clearInputChangedTimeout = function() {
      if (this.inputChangedTimeoutId) {
        clearTimeout(this.inputChangedTimeoutId);
        this.inputChangedTimeoutId = null;
      }
    };

    return AutoCompleteView;

  }
);
