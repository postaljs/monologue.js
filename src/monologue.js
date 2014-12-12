/*global Monologue */
(function( root, factory ) {
	/* istanbul ignore if  */
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "lodash", "riveter" ], function( _, riveter ) {
			return factory( _, riveter, root );
		} );
	/* istanbul ignore else  */
	} else if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = factory( require( "lodash" ), require( "riveter" ) );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root.riveter, root );
	}
}( this, function( _, riveter, global, undefined ) {
	//import("bindingsResolver.js");
	//import("subscriptionDefinition.js");
	//import("monologue.ctor.js");
	return Monologue;
} ));
