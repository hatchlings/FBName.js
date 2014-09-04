Our app recently started getting throttled by Facebook's API. We found out that the issue was actually that
it was possible for our app to get into a state where it repeatedly called `FB.XFBML.parse` in quick
succession. As [shown in this pastebin example](http://pastebin.com/Ung6Jt38)
(paste into [fbrell](https://www.fbrell.com/)) to test), Facebook's library does not cache
lookups so if you call `FB.XFBML.parse` multiple times it naively spams the API with requests.

This library also combines up to 50 name lookups into a single API request by using the `?ids=4,5,6` format
supported by the graph API (rather splitting it into a batch of 50 requests like the Official Facebook
JavaScript library does).

All in all this should result in a speedier, more efficient, more resilient implementation of a custom
tag name lookup.

Requirements
============

* [Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript)
* [Underscore.js](http://underscorejs.org/)
* [jQuery.js](http://jquery.com/)

Usage
=====

Add an `f:name` tag to the DOM like so:

    <f:name uid="4">Loading...</f:name>

Initialize the Facebook JS library then call `FBName.parse()`. This will automatically replace your `f:name` tags
with the name for the user ID pulled from Facebook's API.

The above HTML will be transformed to

    <f:name uid="4">Mark Zuckerburg</f:name>
