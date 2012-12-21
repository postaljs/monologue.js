(function ( root, factory ) {
	if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = function(_) {
			return factory( _ );
		}
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["underscore"], function ( _ ) {
			return factory( _, root );
		} );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root );
	}
}( this, function ( _, global, undefined ) {
	//import("bindingsResolver.js");
	//import("subscriptionDefinition.js");
	//import("monologue.ctor.js");
	return Monologue;
} ));