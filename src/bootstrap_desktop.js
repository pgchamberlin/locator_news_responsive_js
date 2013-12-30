/*global define */
/*jslint undef: false */
// This gives us flexibility to change dependencies with a common API e.g. Bonzo --> jQuery
define([
  'jquery-1', 
  'vendor/events/pubsub'
], function(
  jquery
){

    var bootstrap = {
        pubsub: jquery,
        $: jquery,
        ajax: jquery.ajax
    };

    return bootstrap;
});
