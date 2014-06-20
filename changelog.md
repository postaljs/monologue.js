##v0.2.1
* the `Monologue.mixInto` method now utilizes [riveter's](https://github.com/a2labs/riveter) `punch` call under the hood. This is a change from v0.2.0 when it used riveter's `mixin` call, which would NOT overwrite target methods with the same name as methods from Monologue's prototype. Now the `mixInto` call *will* overwite target methods with Monologue's.

##v0.2.0

* Updated the bindings resolver to match that of [postal.js](https://github.com/postaljs/postal.js) v0.10
* Now utilizing [riveter](https://github.com/a2labs/riveter) for inheritance/mixin concerns
* Replaced underscore dependency with lodash
* Converted build to gulp.js
* Removed the "lite" build option