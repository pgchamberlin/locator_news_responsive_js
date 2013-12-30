/*global define */
/*jslint undef: false */
define([
        "locator/bootstrap"
    ], function (
        bootstrap
    ) {

    var locatorUrl, LocatorView, preventDefault;

    locatorUrl = '/locator/default/mobile/en-GB/confirm/';

    /**
     * Prevent default action for an event. This is to bridge the inconsistency
     * in IE's implementation of preventDefault|returnValue.
     *
     * @param {Object} event the event object
     * @return void
     */
    preventDefault = function(event) {

        if (!event) {
            return;
        }

        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }

    };

    /**
     * The view object for locator.
     *
     * @param {String} selector the element selector for the view container
     * @param {Object} options  object literal for passing options. Options include
     *                          pubsub: custom event emitter
     *
     * @constructor
     */
    LocatorView = function(selector, options) {

        options = options || {};

        var that = this,
            html = '<div id="locator">'
            + '<form id="locator-form" action="#">';

        if (typeof options.pubsub !== "undefined") {
            bootstrap.pubsub = options.pubsub;
        }

        this.inputPlaceholderMessage = 'Enter a UK town or postcode';

        this.autoCompleteEnabled = false;
        if (true === options.enableAutoComplete) {
            this.autoCompleteEnabled = true;
        }

        this.supportsGeoLocation = false;
        if ((typeof navigator.geolocation !== "undefined") && options.enableReverseGeocode !== false) {
            this.geoLocationEnabled = true;
            this.supportsGeoLocation = true;
        }

        if (this.supportsGeoLocation && window.locator && window.locator.disableGeoLocation) {
            this.supportsGeoLocation = false;
        }
        if (this.supportsGeoLocation) {
            html += '<a href="" id="locator-geolocation">'
                 + '<span class="link-text">Use my current location</span><span class="crosshair"></span>'
                 + '</a><p id="geolocation-error"></p>';
        }

        html += '<div id="locator-search-container"><span class="locator-search-input">'
            + '<label for="locator-search">Search Term</label>'
            + '<input id="locator-search-input" name="locator-search" type="text"/>'
            + '</span><input name="locator-submit" class="submit" type="submit" value="Search"/>'
            + '<button id="locator-submit" value="Search">Search <span class="magnifier"></span></button>'
            + '</div></form>'
            + '<p id="locator-message-search"/>'
            + '<ul id="locator-results"></ul>'
            + '<a id="locator-results-more" href="">Show More</a>'
            + '<a id="locator-prompt-change" href="">Change your location<span class="crosshair"></span></a>'
            + '</div>';

        bootstrap.$(selector).append(html);

        this.elm = document.getElementById('locator');
        this.form = document.getElementById('locator-form');
        this.searchMessage = document.getElementById('locator-message-search');
        this.changePrompt = document.getElementById('locator-prompt-change');
        this.input = document.getElementById('locator-search-input');
        this.results = document.getElementById('locator-results');
        this.moreResults = document.getElementById('locator-results-more');

        this.supportsPlaceholder = (typeof this.input.placeholder !== "undefined");
        if (this.supportsPlaceholder) {
            this.input.placeholder = this.inputPlaceholderMessage;
        } else {
            this.inputFocusHandler = function(e) {
                if (that.inputPlaceholderMessage === that.input.value) {
                    that.input.value = '';
                }
            };
            this.inputBlurHandler = function(e) {
                if ('' === that.input.value) {
                    that.input.value = that.inputPlaceholderMessage;
                }
            };
            this.createEventListener(this.input, 'focus', this.inputFocusHandler, false);
            this.createEventListener(this.input, 'blur', this.inputBlurHandler, false);
        }

        this.autoCompleteView = null;
        if (this.autoCompleteEnabled) {
            require(["locator/autoCompleteView"], function(AutoCompleteView) {
                that.autoCompleteView = new AutoCompleteView();
            });
        }

        this.geolocation = null;
        if (this.supportsGeoLocation) {
            this.geolocation = bootstrap.$('#locator-geolocation')[0];
            this.geolocationMessage = bootstrap.$('p#geolocation-error')[0];
        }

        this.formHandler = function(e) {
            var searchTerm = that.input.value;
            if (0 < searchTerm.length) {
                that.input.blur();
                that.clearResults();
                that.sendSearchData(
                    searchTerm.toLowerCase(),
                    0
                );
            }
            preventDefault(e);
            return false;
        };

        // handle form submission
        this.createEventListener(this.form, 'submit', this.formHandler, false);
        
        this.resultsHandler = function(e) {

            var target, url, locationId, newsLocalRegionId;

            preventDefault(e);
            
            target = (e.target || e.srcElement);
            target.blur();

            url = target.href;
            
            if (url && 0 < url.length) {
                var matches = url.match(/confirm\/(\w{0,2}\d+)\/?(\w+)?/);
                if (3 === matches.length) {
                    newsLocalRegionId = matches[2];
                }
                if (2 <= matches.length) {
                    locationId = matches[1];
                    that.sendLocationData(locationId, newsLocalRegionId);
                }
            }
            return false;
        };

        // handle result click events
        this.createEventListener(this.results, 'click', this.resultsHandler, false);

        this.moreResultsHandler = function(e) {

            preventDefault(e);

            if (that.moreResultsEnabled) {
                bootstrap.$('#locator-results-error').remove();
                that.disableMoreResults();
                that.sendSearchData(
                    that.currentResults.searchTerm,
                    that.currentResults.offset + that.currentResults.limit
                );
            }
        };
        this.createEventListener(this.moreResults, 'click', this.moreResultsHandler, false);

        // handle geolocation link click
        if (this.supportsGeoLocation) {

            this.geolocationClickHandler = function(e) {
                preventDefault(e);
                if (that.geoLocationEnabled) {
                    that.clearResults();
                    that.disableGeolocation('active');
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            bootstrap.pubsub.emit('locator:geoLocation', [position]);
                        },
                        function(error) {
                            var message = "We were unable to detect your location."; 

                            if (error.code === error.PERMISSION_DENIED) {
                                message = "Please enable Location Services in your device settings or browser";
                            }
                            
                            that.setMessage(that.geolocationMessage, message, 'error');
                            that.enableGeolocation(); 
                        },
                        {
                            enableHighAccuracy: true,
                            maximumAge: 60,
                            timeout: 10000
                        }
                    );
                }
            };

            this.createEventListener(this.geolocation, 'click', this.geolocationClickHandler, false);
        }

        this.createEventListener(this.changePrompt, 'click', function(e){
            // dropping line to fix sync issue
            bootstrap.pubsub.emit('locator:changeLocationPrompt');
            that.renderForm();
            preventDefault(e);
        }, false);

        bootstrap.pubsub.on('locator:searchResults', function(data){
            that.renderSearchResults(data);
        });

        bootstrap.pubsub.on('locator:newsLocalRegions', function(data){
            that.renderNewsLocalRegions(data);
        });

        bootstrap.pubsub.on('locator:locationOutOfContext', function(data){
            that.setMessage(that.searchMessage, null);
            that.setMessage(
                that.geolocationMessage,
                'Sorry, location setting is not available for your location',
                'error'
            );
        });
        
        bootstrap.pubsub.on('locator:renderForm', function(){
            that.renderForm();
        });

        bootstrap.pubsub.on('locator:renderChangePrompt', function(){
            that.renderStopWait();
            that.resetForm();
            that.renderChangePrompt();
        });

        bootstrap.pubsub.on('locator:renderWait', function(){
            that.renderWait();
        });

        bootstrap.pubsub.on('locator:error', function(data, actionType){
            that.renderError(data, actionType);
        });
    };

    LocatorView.prototype = {
        /**
         * Fire off an event to get search results
         *
         * @param {String} searchTerm the search term
         * @return void
         */
        sendSearchData: function(searchTerm, offset) {
            bootstrap.pubsub.emit(
                'locator:submitSearch', 
                [searchTerm, offset]
            );
        },
        /**
         * Fire off an event to send location data
         *
         * @param {Number} locationId        the location id
         * @param {Number} newsLocalRegionId the news region id
         * @return void
         */
        sendLocationData: function(locationId, newsLocalRegionId) {
            bootstrap.pubsub.emit(
                'locator:submitLocation', 
                [locationId, newsLocalRegionId]
            );
        },
        /**
         * Close the locator widget by removing child element
         *
         * @return void
         */
        close: function() {
            this.elm.parentNode.removeChild(this.elm);
        },
        /**
         * Clear all search results from DOM.
         *
         * @return void
         */
        clearResults: function() {
            this.setMessage(this.searchMessage, null);
            this.setMessage(this.geolocationMessage, null);
            this.currentResults = null;
            this.results.innerHTML = '';
            this.moreResults.style.display = 'none';
        },
        renderChangePrompt: function() {
            this.setFormIsShown(false);
            this.setChangePromptIsShown(true);
        },
        /**
         * Render the form to its initial state
         *
         * @return void
         */
        renderForm: function() {
            this.setFormIsShown(true);
            this.setChangePromptIsShown(false);
            this.resetForm();
        },
        /**
         * Reset the form to its initial state
         *
         * @return void
         */
        resetForm: function() {
            this.input.value = this.supportsPlaceholder ? '' : this.inputPlaceholderMessage;
            this.clearResults();
            this.setMessage(this.searchMessage, null);
            this.enableGeolocation();
        },
        /**
         * Disable the search form.
         *
         * @return void
         */
        disableForm: function() {
            this.destroyEventListener(this.form, 'submit', this.formHandler);
            this.createEventListener(this.form, 'submit', function(e) {
                preventDefault(e);
                return false;
            }, false);
            bootstrap.$('#locator-search-container').addClass('disabled');
            bootstrap.$(this.input).attr('disabled', true);
        },
        /**
         * Show/Hide the form.
         *
         * @param {Boolean} isShown
         * @return void
         */
        setFormIsShown: function(isShown) {
            var display;
            display = isShown ? 'block' : 'none';
            this.form.style.display = display;
        },
        setChangePromptIsShown: function(isShown) {
            this.changePrompt.style.display = isShown ? 'block' : 'none';
        },
        enableMoreResults: function() {
            this.moreResultsEnabled = true;
            bootstrap.$(this.moreResults).removeClass('disabled');
        },
        disableMoreResults: function() {
            this.moreResultsEnabled = false;
            bootstrap.$(this.moreResults).addClass('disabled');
        },
        enableGeolocation: function() {
            this.geoLocationEnabled = true;
            bootstrap.$(this.geolocation).removeClass('active');
        },
        disableGeolocation: function(className) {
            this.geoLocationEnabled = false;
            className = className || 'disabled';
            bootstrap.$(this.geolocation).addClass(className);
        },
        /**
        * Prepare a HTMLElement for message display by adding properties.
        *
        * @param {HTMLElement} element      the dom element
        * @param {String}      value        the innerHTML
        * @param {String}      elementClass the class attribute
        * @return void
        */
        setMessage: function(element, value, elementClass) {

            if (element) {

                if (typeof elementClass === "string" && elementClass.length > 0) {
                    element.className = elementClass;
                }

                element.style.display
                    = (null === value || '' === value) ? 'none' : 'block';
                element.innerHTML = value;
            }
        },
        /**
         * Render an error on the page.
         *
         * @param {Object} data       configuration object literal
         * @param {String} actionType the message category
         * @return void
         */
        renderError: function(data, actionType){
            var defaultMessage = 'Sorry an error has occurred, please try again';

            if ('autocomplete' !== actionType) {
                this.renderStopWait();
            }

            if (data && data.flagpoles) {
                if (!data.flagpoles.locator) {
                    this.clearResults();
                    this.disableForm();
                    this.disableGeolocation();
                    this.setMessage(
                        this.searchMessage,
                        'Sorry location setting is not currently available',
                        'error'
                    );
                    return;
                } else if (!data.flagpoles.reverseGeocode) {
                    this.disableGeolocation();
                    this.setMessage(
                        this.geolocationMessage,
                        'Sorry the "use my current location" feature is not currently available',
                        'error'
                    );
                    if ('geolocate' === actionType) {
                        return;
                    }
                }
            }

            if ('geolocate' === actionType) {
                this.setMessage(
                    this.geolocationMessage,
                    'Sorry an error occurred trying to detect your location. Please try again',
                    'error'
                );
                this.enableGeolocation();
            } else if ('search' === actionType && this.currentResults) {
                bootstrap.$(this.moreResults).after('<p id="locator-results-error" class="error">'  +defaultMessage +'</p>');
            } else if ('autocomplete' !== actionType) {
                this.setMessage(this.searchMessage, defaultMessage, 'error');
            }
        },
        /**
         * Render the wait message
         *
         * @return void
         */
        renderWait: function(){
            if (!this.currentResults) {
                this.setMessage(this.searchMessage, 'Please wait...');
            }
        },
        renderStopWait: function(){
            if (!this.currentResults) {
                this.setMessage(this.searchMessage, null);
            }
        },
        /**
         * Render search results.
         *
         * @param {Object} data json object from the service API
         * @return void
         */
        renderSearchResults: function(data) {
            var result, index, html = '',
                url = locatorUrl,
                qs = '?ptrt=' +window.location,
                displayMoreResults = false;

            this.currentResults = data;

            this.renderStopWait();
            this.enableGeolocation();

            if (0 === data.results.length) {
                this.setMessage(
                    this.searchMessage,
                    'There were no results for "' +data.searchTerm +'"'
                );
            } else {
                this.setMessage(
                    this.searchMessage,
                    'Search results:'
                );
                for(index=0; index<data.results.length; index++) {
                    result = data.results[index];
                    html += '<li><a href="' +url +result.id +qs +'">' +result.name +'</a></li>';
                }
            }

            this.results.style.display = '';

            if (0 === data.offset) {
                this.results.innerHTML = html;
                this.setFocusOnFirstResult();
                displayMoreResults = data.limit < data.total;
            } else {
                bootstrap.$(this.results).append(html);
                displayMoreResults = data.offset + data.limit < data.total;
            }

            this.moreResults.style.display = displayMoreResults ? 'block' : 'none';

            if (displayMoreResults) {
                this.enableMoreResults();
            }
        },
        /**
         * Render the local region results
         *
         * @param {Object} data the json object returned from the service API
         * @return void
         */
        renderNewsLocalRegions: function(data) {
            var region, index, html = '',
                url = locatorUrl + data.location.id +'/',
                qs = '?ptrt=' +window.location;

            this.renderStopWait();
            this.enableGeolocation();

            this.setMessage(this.searchMessage, 'Your chosen location falls between two News Regions. To set your location, please select one of the regions below.');

            for(index=0; index<data.regions.length; index++) {
                region = data.regions[index];
                html += '<li><a href="' +url +region.id +qs +'">' +region.name +'</a></li>';
            }
            this.results.style.display = '';
            this.results.innerHTML = html;
            this.setFocusOnFirstResult();
        },
        /**
         * Set focus on the first search result
         *
         * @return void
         */
        setFocusOnFirstResult: function() {
            var resultsList;
            resultsList = bootstrap.$('#locator-results li a');
            if (resultsList.length > 0) {
                resultsList[0].focus();
            }
        },
        /**
         * Create a cross-browser event listener
         *
         * @return void
         */
         createEventListener: function(element, eventType, handler, useCapture) {
            if (element.addEventListener) {
                element.addEventListener(eventType, handler, useCapture);
            } else if (element.attachEvent) {
                element.attachEvent('on'+eventType, handler);
            }
         },
        /**
         * Destroy a cross-browser event listener
         *
         * @return void
         */
         destroyEventListener: function(element, eventType, handler, useCapture) {
            if (element.removeEventListener) {
                element.removeEventListener(eventType, handler, useCapture);
            } else if (element.detachEvent) {
                element.detachEvent('on'+eventType, handler);
            }
         }

    };

    return LocatorView;

});
