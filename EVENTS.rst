Events
======

Here's a list of events that are emitted by the component along with a
description on what each one of them does.

**NOTE: This table is incomplete and is work in progress**

+-----------------------------------+-----------------------------------+-----------------------------------------------+
| Event Name                        | Callback Arguments                | Description                                   |
+===================================+===================================+===============================================+
| locator:searchResults             | - response ``{Object}``           | Emitted when search results are returned from |
|                                   |                                   | from the search endpoint                      |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:autoCompleteSearchResults | - response ``{Object}``           | Emitted when search results are returned from |
|                                   |                                   | the autocomplete endpoint                     |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:submitAutoCompleteSearch  | - searchTerm ``{String}``         | Emitted every time an autocomplete request is |
|                                   |                                   | made                                          |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:submitAutoCompleteLocation| - locationId ``{String}``         | Emitted when user has selected an item from   |
|                                   | - locationName ``{String}``       | the autocomplete results list                 |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:newsLocalRegions          | - response ``{Object}``           | Emitted when a location is returned from the  |
|                                   |                                   | the search endpoint and it the location has   |
|                                   |                                   | multiple news regions                         |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:geoLocation               | - position ``{Position}``         | Emitted after a successful request has been   |
|                                   |                                   | made to ``navigator.geolocation``             |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:locationOutOfContext      | - response ``{Object}``           | Emitted when a location is returned and it is |
|                                   |                                   | outside of context e.g. paris returned when   |
|                                   |                                   | international filter is turned off            |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:submitLocation            | - locationId ``{String}``         | This event is emitted after a user            |
|                                   | - newsLocalRegionId ``{String}``  | clicks on a search result                     |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:open                      | - selector ``{String}``           | Emitted when locator is first opened on a page|
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:close                     |                                   | Emitted when locator is closed                |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:error                     | - response ``{Object}``           | Emitted when an error has occurred during an  |
|                                   | - actionType ``{String}``         | XHR request                                   |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:renderChangePrompt        |                                   | Emitted after a location has been selected and|
|                                   |                                   | a call to ``Locator.open`` has been made      |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:changeLocationPrompt      |                                   |                                               |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:submitSearch              | - searchTerm ``{String}``         | Emitted when a search for a location has been |
|                                   | - offset ``{Number}``             | made                                          |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:submitLocation            | - locationId ``{String}``         | Emitted once a user has selected a location   |
|                                   | - newsRegionId ``{String}``       | from the results list                         |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:renderForm                |                                   | Emitted when the form is about to be displayed|
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:locationChanged           | - location ``{Object}``           | Emitted when the user has changed their       |
|                                   |                                   | location                                      |
+-----------------------------------+-----------------------------------+-----------------------------------------------+
| locator:renderWait                |                                   | Emitted when the "Please wait..." message     |
|                                   |                                   | is about to be displayed                      |
+-----------------------------------+-----------------------------------+-----------------------------------------------+