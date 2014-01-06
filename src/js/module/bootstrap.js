/*global define */
define([
    "jquery",
    "vendor/events/pubsub"
  ],
  function(jquery) {
  
    var bootstrap = {
      pubsub: jquery,
      $: jquery,
      ajax: jquery.ajax
    };

    return bootstrap;
  
  }
);
