/*global define */
define([
        "locator/bootstrap"
    ], function (
        bootstrap
    ) {

        var $,
            AutoCompleteView,
            numberOfCharactersBeforeDataRequestIsMade,
            durationBeforeInputIsChecked;

        $ = bootstrap.$;
        numberOfCharactersBeforeDataRequestIsMade = 2;
        durationBeforeInputIsChecked = 500; 

        /**
         * Prepare an instance of AutoCompleteView
         *
         * @constructor
         */
        AutoCompleteView = function() {
            var that = this;

            this.inputHasFocus = false;
            this.hasMouseDown = false;
            this.$searchResults = null;
            this.highlightedSearchResultIndex = null;

            this.input = document.getElementById('locator-search-input');
            this.$input = $('#locator-search-input');
            this.$input.attr('autocomplete', 'off');

            this.keyCode = {
                enter: 13,
                escape: 27,
                upArrow: 38,
                downArrow: 40
            };

            if (this.input) {
                this.$input.on('focus.locatorAutoCompleteInput', function(event){ 
                    that.startInteraction();
                    event.preventDefault();
                });

                this.$input.on('blur.locatorAutoCompleteInput', function(event){
                    if (!that.hasMouseDown) {
                        that.stopInteraction();
                    }
                    event.preventDefault();
                });
            }

            bootstrap.pubsub.on('locator:autoCompleteSearchResults', function(data){
                if (that.inputHasFocus) {
                    that.stopWaitingForRequest();
                    that.renderSearchResults(data);
                }
            });

            /*
             * After a regular search for a string with a single result, eg 
             * 'llandaff', the input field is not displayed but still has focus. 
             * Therefore it's blur event is not triggered. We listen for
             * locator:renderChangePrompt instead. Not ideal: this module should
             * not really be aware of this event.
             */ 
            bootstrap.pubsub.on('locator:renderChangePrompt', function(data){
                if (that.inputHasFocus) {
                    that.stopInteraction();
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
                     that.currentSearchTerm = null;
                }
            });

            bootstrap.pubsub.on('locator:error', function(data, actionType){
                if ('autocomplete' === actionType) {
                    that.stopWaitingForRequest();
                }

                if (data && data.flagpoles && !data.flagpoles.autoComplete) {
                    that.stopInteraction();
                    that.$input.off('focus.locatorAutoCompleteInput');
                    that.$input.off('blur.locatorAutoCompleteInput');
                }
            });
        };


        AutoCompleteView.prototype = {
            /**
             * Check if the current input field value is valid. Emit an event if it 
             * valid.
             *
             * @return null|false
             */
            checkInput: function() {
                var that, searchTerm, isValidSearchTerm;
                that = this;
                searchTerm = this.prepareSearchTerm(this.input.value);
                isValidSearchTerm = this.isValidSearchTerm(searchTerm);

                if(!isValidSearchTerm) {
                    if (this.$searchResults) {
                        this.clearInputChangedTimeout();
                        this.clearSearchResults();
                    }
                    this.currentSearchTerm = searchTerm;
                    return false;
                } else if(this.currentSearchTerm === searchTerm || null !== this.highlightedSearchResultIndex) {
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
                this.inputChangedTimeoutId = setTimeout(function() {
                    bootstrap.pubsub.emit('locator:submitAutoCompleteSearch', [searchTerm]);
                    that.startWaitingForRequest();
                }, durationBeforeInputIsChecked);
            },
            /**
             * Prepare a string for validation
             *
             * @param {string} searchTerm the string to prepare
             * @return {string} the prepared string
             */
            prepareSearchTerm: function(searchTerm) {
                return String(searchTerm).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            },
            /**
             * Validate a search term
             *
             * @param {string} searchTerm the string to validate
             * @return {boolean} is the search term valid
             */
            isValidSearchTerm: function(searchTerm) {
                var value, hasRequiredLength;
                if ('string' !== typeof searchTerm) {
                    return false;
                }
                value = this.prepareSearchTerm(searchTerm);
                hasRequiredLength = value.length >= numberOfCharactersBeforeDataRequestIsMade;

                if (!hasRequiredLength) {
                    return false;
                }

                return true;
            },
            /**
             * Render the response from an auto-complete json XHR as dom elements
             *
             * @param {object} searchResultsData the results to render
             * @return void
             */
            renderSearchResults: function(searchResultsData) {
                var that, html, searchResultIndex, noOfSearchResults;
                that = this;
                this.searchResultsData = searchResultsData;
                noOfSearchResults = searchResultsData.results.length;

                if (0 === noOfSearchResults) {
                    this.clearSearchResults();
                    return;
                }

                if (null === this.$searchResults) {
                    $('body').append('<ul id="locator-autocomplete-results"></ul>');
                    this.$searchResults = $('#locator-autocomplete-results');

                    this.$searchResults.on('mouseover', 'li', function(event){
                        that.highlightSearchResultByIndex($(this).index(), false);
                    }).on('mouseout', 'li', function(event){
                        that.searchResultMouseOutHandler(event.target);
                    });

                    this.positionSearchResults();
                    this.addSearchResultClickListener();
                    that.addSearchResultKeyHandler();
                }

                html = '';
                for (searchResultIndex = 0; searchResultIndex < noOfSearchResults; searchResultIndex++) {
                    html += '<li>' +searchResultsData.results[searchResultIndex].fullName +'</li>';
                }
                this.$searchResults.html(html);

            },
            /**
             * Clear rendered search results from the DOM
             *
             * @return void
             */
            clearSearchResults: function() {
                this.searchResultsData = null;
                this.highlightedSearchResultIndex = null;
                if (this.$searchResults) {
                    this.$searchResults.remove();
                    this.$searchResults = null;
                    this.removeSearchResultKeyHandler();
                }
            },
            /**
             * Add a key event handler to enable navigation and selection of 
             * displayed search results. Not the same as startInteraction().
             *
             * @return void
             */
            addSearchResultKeyHandler: function() {
                that = this;

                // is this actually needed? 
                // it should not be necessary
                this.removeSearchResultKeyHandler();

                $(document).on('keydown.locatorAutoCompleteSearchResults', function(e) {
                    that.keyDownHandler(e);
                });
            },
            /**
             * Remove key event handling for navigation of search results. Not the
             * same as stopInteraction().
             *
             * @return void
             */
            removeSearchResultKeyHandler: function() {
                $(document).off('keydown.locatorAutoCompleteSearchResults');
            },
            /**
             * Handle a key down event
             *
             * @param {object} event the key down event
             * @return void
             */
            keyDownHandler: function(event) {
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
            },
            /**
             * Handle an escape key event. Clear any displyaed results and reset the
             * input field text if required.
             *
             * @return void
             */
            escapeKeyHandler: function() {
                if (null !== this.highlightedSearchResultIndex) {
                    this.$input.val(this.currentSearchTerm);
                }
                this.clearSearchResults();
            },
            /**
             * Handle an enter key event. If the user has selected an autocomplete 
             * result then submit it. 
             *
             * @param {object} event the key event
             * @return void
             */
            enterKeyHandler: function(event) {
                if (null !== this.highlightedSearchResultIndex) {
                    event.preventDefault();
                    this.submitSearchResultByIndex(this.highlightedSearchResultIndex);
                }
                this.clearInputChangedTimeout();
                this.clearSearchResults();
            },
            /**
             * Select the next search result.
             *
             * @return void
             */
            highlightNextSearchResult: function() {
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
            },
            /**
             * Select the previous search result.
             *
             * @return void
             */
            highlightPrevSearchResult: function() {
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
            },
            /**
             * Select a search result by index.
             *
             * @param {int} index the index to select
             * @param {boolean} updateInputValue should the input field value be set 
             * @return void
             */
            highlightSearchResultByIndex: function(index, updateInputValue) {
                var searchResult;
                this.removeSearchResultHighlight();
                searchResult = this.searchResultsData.results[index];
                this.highlightedSearchResultIndex = index;
                $(this.$searchResults.find('li')[index]).addClass('active');

                if (updateInputValue) {
                    this.$input.val(searchResult.fullName);
                }
            },
            /**
             * Remove any highlighted search result 
             *
             * @param {boolean} updateInputValue should the input field value be set 
             * @return void
             */
            removeSearchResultHighlight: function(updateInputValue) {
                this.highlightedSearchResultIndex = null; 
                this.$searchResults.find('li.active').removeClass('active');

                if (updateInputValue) {
                    this.$input.val(this.currentSearchTerm);
                }
            },
            /**
             * Handle the mouse moving out of a search result
             *
             * @param {object} listElement the dom element the mouse has moved out of
             * @return void
             */
            searchResultMouseOutHandler: function(listElement) {
                $(listElement).removeClass('active');
            },
            /**
             * Attach mouse event handlers for clicks on search results
             *
             * @return void
             */
            addSearchResultClickListener: function() {
                var that, href, isSearchResultElement;
                that = this;
                this.$searchResults.on('mousedown', function(event) {
                    that.hasMouseDown = true;
                    bootstrap.$('body').one('mouseup', function(event){
                        that.bodyMouseUpHandler(event);
                    });
                });
            },
            /**
             * Handle a mouse up event somewhere within the document body
             *
             * @param {object} event the click event
             * @return void
             */
            bodyMouseUpHandler: function(event) {
                var listElement, searchResultIndex;
                this.hasMouseDown = false;

                // is the event target an element within 
                // #locator-autocomplete-results 
                if (this.$searchResults.find(event.target).length) {
                    searchResultIndex = $(event.target).index();
                    this.submitSearchResultByIndex(searchResultIndex);
                }

                this.clearSearchResults();
            },
            /**
             * Submit a search result by it's index. Causes an pubsub event to be 
             * emitted
             *
             * @param {int} index the search result index
             * @return void
             */
            submitSearchResultByIndex: function(index) {
                var searchResult;

                searchResult = this.searchResultsData.results[index];

                // update the input value
                this.$input.val(searchResult.fullName);

                // extract the full place name (without truncation)
                bootstrap.pubsub.emit('locator:submitAutoCompleteLocation', [searchResult.id, searchResult.name]);
            },
            /**
             * Position the search result dom element adjacent to the input field
             *
             * @return void
             */
            positionSearchResults: function() {
                var inputOffset;
                inputOffset = this.$input.offset();
                this.$searchResults.css({
                    left: parseInt(inputOffset.left, 0),
                    top: parseInt(inputOffset.top, 0) + this.$input.outerHeight()
                });
            },
            /**
             * Start user interaction with the input field
             *
             * @return void
             */
            startInteraction: function() {
                var that = this;
                this.inputHasFocus = true;

                this.$input.on('keyup', function(){
                    that.checkInput();
                });
            },
            /**
             * Stop user interaction with the input field
             *
             * @return void
             */
            stopInteraction: function() {
                var inputValue;

                inputValue = this.$input.val();
                if (null !== this.highlightedSearchResultIndex && inputValue !== this.currentSearchTerm) {
                    this.currentSearchTerm = inputValue;
                }

                this.clearInputChangedTimeout();
                this.clearSearchResults();
                this.stopWaitingForRequest();

                this.$input.off('keyup');

                this.inputHasFocus = false;
            },
            /**
             * Start waiting for an search request.
             *
             * @return void
             */
            startWaitingForRequest: function() {
                this.$input.addClass('waiting');
            },
            /**
             * Stop waiting for an search request.
             *
             * @return void
             */
            stopWaitingForRequest: function() {
                this.$input.removeClass('waiting');
            },
            /**
             * Clear the current input changed timeout.
             *
             * @return void
             */
            clearInputChangedTimeout: function() {
                if (this.inputChangedTimeoutId) {
                    clearTimeout(this.inputChangedTimeoutId);
                    this.inputChangedTimeoutId = null;
                }
            }
        };

    return AutoCompleteView;

});
