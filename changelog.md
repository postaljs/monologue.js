## v0.3.3
* Fixed issue where cache array held undefined values (due to subscriber removal).
* Updated gulpfile to format prior to combining

## v0.3.2
* Fixed issue where downstream once() subscribers were breaking the iteration of a publish over a list of subscribers.
* Added JSCS formatting, updated gulp tasks.

## v0.3.1
* Fixed bug where listeners were incorrectly added to another topic's lookup cache when adding a new subscriber for an event that had already been published once.

## v0.3.0
* Ported postal's caching mechanisms (mostly) to monologue to optimize for emitting
* Ported postal's subscription definition prototype (mostly) to better align subscription configuration options
* Added tests & test coverage monitoring

## v0.2.1
* the `Monologue.mixInto` method now utilizes [riveter's](https://github.com/a2labs/riveter) `punch` call under the hood. This is a change from v0.2.0 when it used riveter's `mixin` call, which would NOT overwrite target methods with the same name as methods from Monologue's prototype. Now the `mixInto` call *will* overwite target methods with Monologue's.

## v0.2.0

* Updated the bindings resolver to match that of [postal.js](https://github.com/postaljs/postal.js) v0.10
* Now utilizing [riveter](https://github.com/a2labs/riveter) for inheritance/mixin concerns
* Replaced underscore dependency with lodash
* Converted build to gulp.js
* Removed the "lite" build option
