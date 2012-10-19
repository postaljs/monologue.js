describe( 'Removing Subscriptions', function () {

	var monologue = new Monologue();
	var sub;
	var events = [];

	beforeEach( function () {
		sub = monologue.on( "Some.Topic", function ( data ) {
			events.push( data );
		} );
	} );

	it( 'Calling unsubscribe should remove the SubscriptionDefinition', function () {
		expect( monologue._subscriptions["Some.Topic"][0] ).to.eql( sub );
		sub.unsubscribe();
		expect( monologue._subscriptions["Some.Topic"].length ).to.be( 0 );
	} );

	it( 'Calling monologue.off(sub) should remove the SubscriptionDefinition', function () {
		expect( monologue._subscriptions["Some.Topic"][0] ).to.eql( sub );
		monologue.off(sub);
		expect( monologue._subscriptions["Some.Topic"].length ).to.be( 0 );
	} );

	it( 'Calling monologue.off(topic) should remove the SubscriptionDefinition', function () {
		expect( monologue._subscriptions["Some.Topic"][0] ).to.eql( sub );
		monologue.off("Some.Topic");
		expect( monologue._subscriptions["Some.Topic"].length ).to.be( 0 );
	} );

} );