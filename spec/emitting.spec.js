describe( 'Emitting Events', function () {

	var monologue = new Monologue();
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