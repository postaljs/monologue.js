describe( 'Monologue', function () {

	var monologue = new Monologue();

	describe( 'When Adding Subscriptions', function () {

		var sub;
		var events = [];

		beforeEach( function () {
			sub = monologue.on( "Some.Topic", function ( data ) {
				events.push( data );
			} );
		} );

		afterEach( function () {
			sub.unsubscribe();
		} );

		it( 'It should return a SubscriptionDefinition instance', function () {
			expect( sub ).to.have.property( "topic" );
			expect( sub ).to.have.property( "callback" );
			expect( sub ).to.have.property( "context" );
			expect( sub ).to.have.property( "once" );
			expect( sub ).to.have.property( "disposeAfter" );
			expect( sub ).to.have.property( "defer" );
			expect( sub ).to.have.property( "withContext" );
		} );

		it( 'It should add the SubscriptionDefinition to the monologue._subscriptions', function () {
			expect( monologue._subscriptions["Some.Topic"][0] ).to.eql( sub );
		} );

	} );

	describe( 'When Removing Subscriptions', function () {

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

	describe( 'When Emitting Events', function () {

		var subA, subB, subAFired, subBFired;
		var events;

		describe('With plain topic matching', function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subBFired = false
				subA = monologue.on( "Some.Topic", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
				subB = monologue.on( "Some.Other.Topic", function ( data ) {
					events.push( data );
					subBFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
				subB.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(true);
				expect(subBFired ).to.be(false);
				expect(events[0] ).to.be("Hai");
			} );

			it( 'Emitting Some.Other.Topic should invoke subB callback', function () {
				monologue.emit("Some.Other.Topic", "Hai, 2 U");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(false);
				expect(subBFired ).to.be(true);
				expect(events[0] ).to.be("Hai, 2 U");
			} );
		});

		describe("With wildcards involving * at start of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "*.Topic", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
			} );
		});

		describe("With wildcards involving * at middle of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "Some.*.Topic", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai 3");
			} );
		});


		describe("With wildcards involving * at end of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "Some.*", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(2);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
				expect(events[1] ).to.be("Hai 2");
			} );
		});



		describe("With wildcards involving # at start of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "#.Topic", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(2);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
				expect(events[1] ).to.be("Hai 3");
			} );
		});

		describe("With wildcards involving # at middle of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "Some.#.Topic", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai 3");
			} );
		});


		describe("With wildcards involving # at end of binding", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "Some.#", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Some.Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(3);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
				expect(events[1] ).to.be("Hai 2");
				expect(events[2] ).to.be("Hai 3");
			} );
		});

		describe("With wildcards matching only single word topics", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "*", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(1);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
			} );
		});

		describe("With wildcards matching any length topic", function(){
			beforeEach( function () {
				events = [];
				subAFired = false;
				subA = monologue.on( "#", function ( data ) {
					events.push( data );
					subAFired = true;
				} );
			} );

			afterEach(function() {
				subA.unsubscribe();
			});

			it( 'Emitting Some.Topic should invoke subA callback', function () {
				monologue.emit("Topic", "Hai");
				monologue.emit("Some.MOAR", "Hai 2");
				monologue.emit("Some.UnMatching.Topic", "Hai 3");
				expect(events.length ).to.be(3);
				expect(subAFired ).to.be(true);
				expect(events[0] ).to.be("Hai");
				expect(events[1] ).to.be("Hai 2");
				expect(events[2] ).to.be("Hai 3");
			} );
		});
	} );

} );