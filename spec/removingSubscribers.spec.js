/*global describe,it,beforeEach,Monologue*/

describe( "Removing Subscriptions", function() {

	var monologue = new Monologue();
	var sub;
	var events = [];
	var ctx = {};

	beforeEach( function() {
		sub = monologue.on( "Some.Topic", function( data ) {
			events.push( data );
		} ).context( ctx );
	} );

	it( "Calling unsubscribe should remove the SubscriptionDefinition", function() {
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		sub.unsubscribe();
		monologue._subscriptions[ "Some.Topic" ].length.should.equal( 0 );
	} );

	it( "Calling monologue.off(sub) should remove the SubscriptionDefinition", function() {
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		monologue.off( sub );
		monologue._subscriptions[ "Some.Topic" ].length.should.equal( 0 );
	} );

	it( "Calling monologue.off(topic) should remove the SubscriptionDefinition", function() {
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		monologue.off( "Some.Topic" );
		monologue._subscriptions[ "Some.Topic" ].length.should.equal( 0 );
	} );

	it( "Calling monologue.off(context) should remove the SubscriptionDefinition", function() {
		sub.name = "MEH";
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		monologue.off( ctx );
		console.log( "********************" );
		console.log( monologue._subscriptions );
		console.log( "********************" );
		monologue._subscriptions[ "Some.Topic" ].length.should.equal( 0 );
	} );

	it( "Calling monologue.off(topic, context) should remove the SubscriptionDefinition", function() {
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		monologue.off( "Some.Topic", ctx );
		monologue._subscriptions[ "Some.Topic" ].length.should.equal( 0 );
	} );

	it( "Calling monologue.off() should remove ALL Subscriptions", function() {
		var subB = monologue.on( "Other.Topic", function( data ) {
			events.push( data );
		} );
		var subC = monologue.on( "Other.Stuff", function( data ) {
			events.push( data );
		} );
		monologue._subscriptions[ "Some.Topic" ][ 0 ].should.eql( sub );
		monologue._subscriptions[ "Other.Topic" ][ 0 ].should.eql( subB );
		monologue._subscriptions[ "Other.Stuff" ][ 0 ].should.eql( subC );
		monologue.off();
		monologue._subscriptions.should.eql( {} );
	} );

} );
