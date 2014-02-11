Events
======

Here's a list of events that are emitted by the component along with a
description on what each one of them does.

**NOTE: This table is incomplete and is work in progress**

+-----------------------------------+-----------------------------------+------------------------------------+
| Event Name                        | Callback Arguments                | Description                        |
+===================================+===================================+====================================+
| locator:searchResults             |                                   |                                    |
+-----------------------------------+-----------------------------------+------------------------------------+
| locator:autoCompleteSearchResults |                                   |                                    |
+-----------------------------------+-----------------------------------+------------------------------------+
| locator:newsLocalRegions          |                                   |                                    |
+-----------------------------------+-----------------------------------+------------------------------------+
| locator:locationOutOfContext      |                                   |                                    |
+-----------------------------------+-----------------------------------+------------------------------------+
| locator:submitLocation            | - locationId {String}             | This event is emitted after a user |
|                                   | - newsLocalRegionId {String}      | clicks on a search result          |
+-----------------------------------+-----------------------------------+------------------------------------+