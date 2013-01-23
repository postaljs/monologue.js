(function ( root, factory ) {
	if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = function(_, riveter) {
			return factory( _, riveter );
		}
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["underscore", "riveter"], function ( _, riveter ) {
			return factory( _, root );
		} );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root.riveter, root );
	}
}( this, function ( _, riveter, global, undefined ) {
  //import("../bindingsResolver.js");
  //import("../subscriptionDefinition.js");
  //import("../monologue.ctor.js");
	return Monologue;
} ));