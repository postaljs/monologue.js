describe( 'Emitting Events', function () {

	var monologue = new Monologue();
	var subA, subB, subAFired, subBFired;
	var events, envs;

	describe('With plain topic matching', function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subBFired = false;
			subA = monologue.on( "Some.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
			subB = monologue.on( "Some.Other.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
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
			expect(envs[0].topic ).to.be("Some.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );

		it( 'Emitting Some.Other.Topic should invoke subB callback', function () {
			monologue.emit("Some.Other.Topic", "Hai, 2 U");
			expect(events.length ).to.be(1);
			expect(subAFired ).to.be(false);
			expect(subBFired ).to.be(true);
			expect(events[0] ).to.be("Hai, 2 U");
			expect(envs[0].topic ).to.be("Some.Other.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );
	});

	describe("With wildcards involving * at start of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "*.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
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
			expect(envs[0].topic ).to.be("Some.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );
	});

	describe("With wildcards involving * at middle of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "Some.*.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
		} );

		afterEach(function() {
			subA.unsubscribe();
		});

		it( 'Emitting Some.Topic should invoke subA callback', function () {
			monologue.emit("Some.Topic", "Hai");
			monologue.emit("Some.MOAR", "Hai 2");
			monologue.emit("Some.Other.Topic", "Hai 3");
			expect(events.length ).to.be(1);
			expect(subAFired ).to.be(true);
			expect(events[0] ).to.be("Hai 3");
			expect(envs[0].topic ).to.be("Some.Other.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );
	});


	describe("With wildcards involving * at end of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "Some.*", function ( data, env ) {
				events.push( data );
				envs.push( env );
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
			expect(envs[0].topic ).to.be("Some.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
			expect(envs[1].topic ).to.be("Some.MOAR");
			expect(envs[1].timeStamp instanceof Date ).to.be(true);
			expect(envs[1] ).to.have.property("data");
		} );
	});



	describe("With wildcards involving # at start of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "#.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
		} );

		afterEach(function() {
			subA.unsubscribe();
		});

		it( 'Emitting Some.Topic should invoke subA callback', function () {
			monologue.emit("Some.Topic", "Hai");
			monologue.emit("Some.MOAR", "Hai 2");
			monologue.emit("Some.Other.Topic", "Hai 3");
			expect(events.length ).to.be(2);
			expect(subAFired ).to.be(true);
			expect(events[0] ).to.be("Hai");
			expect(events[1] ).to.be("Hai 3");
			expect(envs[0].topic ).to.be("Some.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
			expect(envs[1].topic ).to.be("Some.Other.Topic");
			expect(envs[1].timeStamp instanceof Date ).to.be(true);
			expect(envs[1] ).to.have.property("data");
		} );
	});

	describe("With wildcards involving # at middle of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "Some.#.Topic", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
		} );

		afterEach(function() {
			subA.unsubscribe();
		});

		it( 'Emitting Some.Topic should invoke subA callback', function () {
			monologue.emit("Some.Topic", "Hai");
			monologue.emit("Some.MOAR", "Hai 2");
			monologue.emit("Some.Other.Topic", "Hai 3");
			expect(events.length ).to.be(1);
			expect(subAFired ).to.be(true);
			expect(events[0] ).to.be("Hai 3");
			expect(envs[0].topic ).to.be("Some.Other.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );
	});


	describe("With wildcards involving # at end of binding", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "Some.#", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
		} );

		afterEach(function() {
			subA.unsubscribe();
		});

		it( 'Emitting Some.Topic should invoke subA callback', function () {
			monologue.emit("Some.Topic", "Hai");
			monologue.emit("Some.MOAR", "Hai 2");
			monologue.emit("Some.Other.Topic", "Hai 3");
			expect(events.length ).to.be(3);
			expect(subAFired ).to.be(true);
			expect(events[0] ).to.be("Hai");
			expect(events[1] ).to.be("Hai 2");
			expect(events[2] ).to.be("Hai 3");
			expect(envs[0].topic ).to.be("Some.Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
			expect(envs[1].topic ).to.be("Some.MOAR");
			expect(envs[1].timeStamp instanceof Date ).to.be(true);
			expect(envs[1] ).to.have.property("data");
			expect(envs[2].topic ).to.be("Some.Other.Topic");
			expect(envs[2].timeStamp instanceof Date ).to.be(true);
			expect(envs[2] ).to.have.property("data");
		} );
	});

	describe("With wildcards matching only single word topics", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "*", function ( data, env ) {
				events.push( data );
				envs.push( env );
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
			expect(envs[0].topic ).to.be("Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
		} );
	});

	describe("With wildcards matching any length topic", function(){
		beforeEach( function () {
			events = [];
			envs = [];
			subAFired = false;
			subA = monologue.on( "#", function ( data, env ) {
				events.push( data );
				envs.push( env );
				subAFired = true;
			} );
		} );

		afterEach(function() {
			subA.unsubscribe();
		});

		it( 'Emitting Some.Topic should invoke subA callback', function () {
			monologue.emit("Topic", "Hai");
			monologue.emit("Some.MOAR", "Hai 2");
			monologue.emit("Some.Other.Topic", "Hai 3");
			expect(events.length ).to.be(3);
			expect(subAFired ).to.be(true);
			expect(events[0] ).to.be("Hai");
			expect(events[1] ).to.be("Hai 2");
			expect(events[2] ).to.be("Hai 3");
			expect(envs[0].topic ).to.be("Topic");
			expect(envs[0].timeStamp instanceof Date ).to.be(true);
			expect(envs[0] ).to.have.property("data");
			expect(envs[1].topic ).to.be("Some.MOAR");
			expect(envs[1].timeStamp instanceof Date ).to.be(true);
			expect(envs[1] ).to.have.property("data");
			expect(envs[2].topic ).to.be("Some.Other.Topic");
			expect(envs[2].timeStamp instanceof Date ).to.be(true);
			expect(envs[2] ).to.have.property("data");
		} );
	});

	describe("When customizing the envelope", function() {
		var monologue = new Monologue(), envelope, sub;

		it("The default envelope should return expected object", function() {
			var result = monologue.getEnvelope();
			expect(result ).to.have.property("timeStamp");
		});

		it("A customized envelope should return the expected object", function() {
			monologue.getEnvelope = function(topic, data){
				return {
					timeStamp: new Date(),
					senderId: 8675309
				}
			};
			sub = monologue.on("Anything", function(data, env){
				envelope = env;
			});
			monologue.emit("Anything", { msg: "Oh, hai" });
			expect(envelope ).to.have.property("timeStamp");
			expect(envelope.timeStamp instanceof Date ).to.be(true);
			expect(envelope ).to.have.property("senderId");
			expect(envelope.senderId ).to.be(8675309);
			expect(envelope ).to.have.property("data");
			expect(envelope.data ).to.eql({ msg: "Oh, hai" });
		});
	});
} );