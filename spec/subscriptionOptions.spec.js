/*global describe,it,afterEach,beforeEach, Monologue */

function monoFactory() {
	return new Monologue();
}
describe( "Subscription Definition Options", function() {

	var sub;

	describe( "When calling defer()", function() {
		var monologue;
		beforeEach( function() {
			monologue = monoFactory();
		} );
		afterEach( function() {
			sub.unsubscribe();
		} );

		it( "Should invoke the callback when the event loop is free", function( done ) {
			sub = monologue.on( "Some.Topic", function( data ) {
				data.should.equal( "Hai**" );
				done();
			} ).defer();
			monologue.emit( "Some.Topic", "Hai**" );
		} );
	} );

	describe( "when subscribing with `logError`", function() {
		var monologue;
		beforeEach( function() {
			monologue = monoFactory();
		} );
		afterEach( function() {
			sub.unsubscribe();
		} );
		it( "should log exceptions to the console", function() {
			var _log = console.log;
			var _warn = console.warn;
			var err;
			console.log = function() {
				err = Array.prototype.slice.call( arguments, 0 ).join( " " );
			};
			console.warn = function() {
				err = Array.prototype.slice.call( arguments, 0 ).join( " " );
			};
			monologue.on( "Some.Topic", function() {
				throw new Error( "Oopsies" );
			} ).catch().logError();
			monologue.emit( "Some.Topic", "Hai**" );
			err.should.be.ok; //jshint ignore:line
			console.log = _log;
			console.warn = _warn;
		} );
		it( "should fallback to console.log if console.warn is undefined", function() {
			var _log = console.log;
			var _warn = console.warn;
			var err;
			console.log = function() {
				err = Array.prototype.slice.call( arguments, 0 ).join( " " );
			};
			console.warn = undefined;
			monologue.on( "Some.Topic", function() {
				throw new Error( "Oopsies" );
			} ).catch().logError();
			monologue.emit( "Some.Topic", "Hai**" );
			err.should.be.ok; //jshint ignore:line
			console.log = _log;
			console.warn = _warn;
		} );
	} );

	describe( "When calling context()", function() {
		var monologue;
		var obj = {
			name: "Paul"
		};
		beforeEach( function() {
			monologue = monoFactory();
		} );
		afterEach( function() {
			sub.unsubscribe();
		} );

		it( "Should invoke the callback with the provided context", function() {
			var nm;
			sub = monologue.on( "Some.Topic", function() {
				nm = this.name;
			} ).context( obj );
			monologue.emit( "Some.Topic", "Hai" );
			nm.should.equal( "Paul" );
		} );
	} );

	describe( "When calling disposeAfter()", function() {

		describe( "disposing after 1 invocation", function() {
			var monologue;
			var count = 0;
			beforeEach( function() {
				monologue = monoFactory();
			} );
			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				sub = monologue.on( "Some.Topic", function() {
					count++;
				} ).disposeAfter( 1 );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				count.should.equal( 1 );
			} );

		} );

		describe( "disposing after 3 invocations", function() {
			var monologue;
			var count = 0;
			beforeEach( function() {
				monologue = monoFactory();
			} );
			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 3 invocations", function() {
				sub = monologue.on( "Some.Topic", function() {
					count++;
				} ).disposeAfter( 3 );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				count.should.equal( 3 );
			} );

		} );

	} );

	describe( "When calling context() and disposeAfter()", function() {
		var monologue;
		var obj = {
			name: "Paul"
		};
		beforeEach( function() {
			monologue = monoFactory();
		} );
		afterEach( function() {
			sub.unsubscribe();
		} );

		it( "Should invoke the callback with the provided context", function() {
			var nm,
				count = 0;
			sub = monologue.on( "Some.Topic", function() {
				nm = this.name;
				count++;
			} ).context( obj ).disposeAfter( 1 );
			monologue.emit( "Some.Topic", "Hai" );
			monologue.emit( "Some.Topic", "Hai" );
			nm.should.equal( "Paul" );
			count.should.equal( 1 );
		} );
		it( "Should throw an exception if the disposeAfter argument is not a number", function() {
			try {
				monologue.on( "Some.Topic", function() {} ).context( obj ).disposeAfter( "fantastic" );
			} catch (ex) {
				ex.should.be.instanceOf( Error );
			}

		} );
	} );

	describe( "When calling once()", function() {
		describe( "On the SubscriptionDefinition", function() {
			var monologue;
			var count = 0;
			beforeEach( function() {
				monologue = monoFactory();
			} );
			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				sub = monologue.on( "Some.Topic", function() {
					count++;
				} ).once();
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				count.should.equal( 1 );
			} );
		} );
		describe( "On the Monologue instance", function() {
			var monologue;
			var count = 0;
			beforeEach( function() {
				monologue = monoFactory();
			} );
			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				sub = monologue.once( "Some.Topic", function() {
					count++;
				} );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				count.should.equal( 1 );
			} );
		} );
	} );

	describe( "When subscribing with catch()", function() {
		var monologue;
		beforeEach( function() {
			monologue = monoFactory();
		} );
		afterEach( function() {
			sub.unsubscribe();
		} );
		it( "should catch an exception thrown by a subscriber", function() {
			monologue.on( "Some.Topic", function() {
				throw new Error( "Oopsies" );
			} ).catch( function( e ) {
				( e instanceof Error ).should.equal( true );
			} );
			monologue.emit( "Some.Topic", "Hai" );
		} );
	} );

	describe( "When calling distinctUntilChanged()", function() {
		var events = [];

		describe( "When publishing a primitive", function() {
			var monologue;
			beforeEach( function() {
				events = [];
				monologue = monoFactory();
				sub = monologue.on( "Some.Topic", function( data ) {
					events.push( data );
				} ).distinctUntilChanged();
			} );

			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				monologue.emit( "Some.Topic", "Hai" );
				events.length.should.equal( 3 );
				events[ 0 ].should.equal( "Hai" );
				events[ 1 ].should.equal( "I SEZ HAI!" );
				events[ 2 ].should.equal( "Hai" );
			} );
		} );

		describe( "When publishing an object", function() {
			var monologue;
			beforeEach( function() {
				events = [];
				monologue = monoFactory();
				sub = monologue.on( "Some.Topic", function( data ) {
					events.push( data );
				} ).distinctUntilChanged();
			} );

			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "John Lennon"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				events.length.should.equal( 3 );
				events[ 0 ].should.eql( {
					name: "Paul McCartney"
				} );
				events[ 1 ].should.eql( {
					name: "John Lennon"
				} );
				events[ 2 ].should.eql( {
					name: "Paul McCartney"
				} );
			} );
		} );

	} );

	describe( "When calling distinct()", function() {
		var monologue;
		var events = [];

		describe( "When publishing a primitive", function() {
			beforeEach( function() {
				events = [];
				monologue = monoFactory();
				sub = monologue.on( "Some.Topic", function( data ) {
					events.push( data );
				} ).distinct();
			} );

			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				events.length.should.equal( 2 );
				events[ 0 ].should.equal( "Hai" );
				events[ 1 ].should.equal( "I SEZ HAI!" );
			} );
		} );

		describe( "When publishing an object", function() {
			var monologue;
			beforeEach( function() {
				events = [];
				monologue = monoFactory();
				sub = monologue.on( "Some.Topic", function( data ) {
					events.push( data );
				} ).distinct();
			} );

			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "John Lennon"
				} );
				monologue.emit( "Some.Topic", {
					name: "Paul McCartney"
				} );
				monologue.emit( "Some.Topic", {
					name: "John Lennon"
				} );
				events.length.should.equal( 2 );
				events[ 0 ].should.eql( {
					name: "Paul McCartney"
				} );
				events[ 1 ].should.eql( {
					name: "John Lennon"
				} );
			} );
		} );

		describe( "When publishing an array", function() {
			var monologue;
			beforeEach( function() {
				events = [];
				monologue = monoFactory();
				sub = monologue.on( "Some.Topic", function( data ) {
					events.push( data );
				} ).distinct();
			} );

			afterEach( function() {
				sub.unsubscribe();
			} );

			it( "Should unsubscribe the callback after 1 invocation", function() {
				monologue.emit( "Some.Topic", [ "Paul McCartney", "George Harrison" ] );
				monologue.emit( "Some.Topic", [ "Paul McCartney", "George Harrison" ] );
				monologue.emit( "Some.Topic", [ "John Lennon", "Ringo Starr" ] );
				monologue.emit( "Some.Topic", [ "Paul McCartney", "George Harrison" ] );
				monologue.emit( "Some.Topic", [ "John Lennon", "Ringo Starr" ] );
				monologue.emit( "Some.Topic", [ "Paul McCartney" ] );
				monologue.emit( "Some.Topic", [ "John Lennon" ] );
				monologue.emit( "Some.Topic", [ "John Lennon" ] );
				monologue.emit( "Some.Topic", [ "Paul McCartney" ] );
				events.length.should.equal( 4 );
				events.should.eql( [
					[ "Paul McCartney", "George Harrison" ],
					[ "John Lennon", "Ringo Starr" ],
					[ "Paul McCartney" ],
					[ "John Lennon" ]
				] );
			} );
		} );

	} );

	describe( "When calling constraint()", function() {
		var monologue;
		var events = [];
		var count = 0;
		beforeEach( function() {
			events = [];
			monologue = monoFactory();
			sub = monologue.on( "Some.Topic", function( data ) {
				events.push( data );
			} ).constraint( function() {
				var cnt = count;
				count += 1;
				return cnt === 0;
			} );
		} );

		afterEach( function() {
			sub.unsubscribe();
		} );

		it( "Should unsubscribe the callback after 1 invocation", function() {
			monologue.emit( "Some.Topic", {
				name: "Paul McCartney"
			} );
			monologue.emit( "Some.Topic", {
				name: "John Lennon"
			} );
			events.length.should.equal( 1 );
			events[ 0 ].should.eql( {
				name: "Paul McCartney"
			} );
		} );
		it( "should throw an exception if the value provided is not a function", function() {
			try {
				monologue.on( "Some.Topic", function() {} ).constraint( 123 );
			} catch (ex) {
				ex.should.be.instanceOf( Error );
			}
		} );
	} );

	describe( "When calling constraints()", function() {
		var monologue;
		var events = [];
		var count = 0;
		beforeEach( function() {
			events = [];
			monologue = monoFactory();
			sub = monologue.on( "Some.Topic", function( data ) {
				events.push( data );
			} ).constraints( [ function() {
					var cnt = count;
					count += 1;
					return cnt === 0;
			} ] );
		} );

		afterEach( function() {
			sub.unsubscribe();
		} );

		it( "Should unsubscribe the callback after 1 invocation", function() {
			monologue.emit( "Some.Topic", {
				name: "Paul McCartney"
			} );
			monologue.emit( "Some.Topic", {
				name: "John Lennon"
			} );
			events.length.should.equal( 1 );
			events[ 0 ].should.eql( {
				name: "Paul McCartney"
			} );
		} );
	} );

	describe( "When calling debounce", function() {
		var events;
		var monologue;

		beforeEach( function() {
			events = [];
			monologue = monoFactory();
			sub = monologue.on( "Debounced.Topic", function( data ) {
				events.push( data );
			} ).debounce( 600 );
		} );

		it( "should have only invoked debounced callback once", function( done ) {
			monologue.emit( "Debounced.Topic", {
				name: "Help!"
			} ); // starts the clock on debounce
			setTimeout( function() {
				monologue.emit( "Debounced.Topic", {
					name: "Paul McCartney"
				} );
			}, 20 ); // should not invoke callback
			setTimeout( function() {
				monologue.emit( "Debounced.Topic", {
					name: "John Lennon"
				} );
			}, 100 ); // should not invoke callback
			setTimeout( function() {
				monologue.emit( "Debounced.Topic", {
					name: "George Harrison"
				} );
			}, 150 ); // should not invoke callback
			setTimeout( function() {
				monologue.emit( "Debounced.Topic", {
					name: "Ringo Starkey"
				} );
			}, 750 ); // should not invoke callback
			setTimeout( function() {
				events[ 0 ].should.eql( {
					name: "Ringo Starkey"
				} );
				events.length.should.equal( 1 );
				sub.unsubscribe();
				done();
			}, 1500 );
		} );
		it( "should throw an exception if the value provided is not a number", function() {
			try {
				monologue.on( "Some.Topic", function() {} ).debounce( "bouncey bounce" );
			} catch (ex) {
				ex.should.be.instanceOf( Error );
			}
		} );
	} );

	describe( "When calling delay", function() {
		var events;
		var monologue;

		beforeEach( function() {
			events = [];
			monologue = monoFactory();
			sub = monologue.on( "Delayed.Topic", function( data ) {
				events.push( data );
			} ).delay( 300 );
		} );

		it( "should have only invoked debounced callback once", function( done ) {
			monologue.emit( "Delayed.Topic", {
				name: "Help!"
			} ); // starts the clock on debounce
			setTimeout( function() {
				events[ 0 ].should.eql( {
					name: "Help!"
				} );
				events.length.should.equal( 1 );
				sub.unsubscribe();
				done();
			}, 600 );
		} );
		it( "should throw an exception if the value provided is not a number", function() {
			try {
				monologue.on( "Some.Topic", function() {} ).delay( "wait a bit" );
			} catch (ex) {
				ex.should.be.instanceOf( Error );
			}
		} );
	} );

	describe( " When calling throttle", function() {
		var events;
		var monologue;

		beforeEach( function() {
			events = [];
			monologue = monoFactory();
			sub = monologue.on( "Throttled.Topic", function( data ) {
				events.push( data );
			} ).throttle( 500 );
		} );

		it( "should have only invoked throttled callback once", function( done ) {
			monologue.emit( "Throttled.Topic", {
				name: "Hey, Jude."
			} ); // starts clock on throttle
			events = [];
			var fn = function() {
				monologue.emit( "Throttled.Topic", {
					name: "Hey, Jude."
				} );
			};
			for (var i = 0; i < 10; i++) {
				fn();
			}
			setTimeout( function() {
				events.length.should.equal( 1 );
				done();
			}, 800 );
		} );
		it( "should throw an exception if the value provided is not a number", function() {
			try {
				monologue.on( "Some.Topic", function() {} ).throttle( "whoa buddy" );
			} catch (ex) {
				ex.should.be.instanceOf( Error );
			}
		} );
	} );

} );
