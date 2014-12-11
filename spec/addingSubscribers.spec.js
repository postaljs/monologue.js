/*global describe,it,afterEach,beforeEach,Monologue */

describe( "Adding Subscriptions", function() {

	var monologue = new Monologue();
	var sub;
	var events = [];

	beforeEach( function() {
		sub = monologue.on( "Some.Topic", function( data ) {
			events.push( data );
		} );
	} );

	afterEach( function() {
		sub.unsubscribe();
	} );

	it( "It should return a SubscriptionDefinition instance", function() {
		sub.should.have.property( "topic" );
		sub.should.have.property( "callback" );
		sub.should.have.property( "context" );
		sub.should.have.property( "once" );
		sub.should.have.property( "disposeAfter" );
		sub.should.have.property( "defer" );
		sub.should.have.property( "context" );
	} );

	it( "It should add the SubscriptionDefinition to the monologue._subscriptions", function() {
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
	} );

} );
