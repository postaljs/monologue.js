describe( 'Subscription Definition Options', function () {

	var monologue = new Monologue();
	var sub;

	describe( 'When calling defer()', function () {

		afterEach( function () {
			sub.unsubscribe();
		} );

		it( 'Should invoke the callback when the event loop is free', function ( done ) {
			sub = monologue.on( "Some.Topic",function ( data ) {
				expect( data ).to.be( "Hai" );
				done();
			} ).defer();
			monologue.emit( "Some.Topic", "Hai" );
		} );
	} );

	describe( 'When calling withContext()', function () {
		var obj = {
			name : "Paul"
		};
		afterEach( function () {
			sub.unsubscribe();
		} );

		it( 'Should invoke the callback with the provided context', function () {
			var nm;
			sub = monologue.on( "Some.Topic",function ( data ) {
				nm = this.name;
			} ).withContext( obj );
			monologue.emit( "Some.Topic", "Hai" );
			expect( nm ).to.be( "Paul" );
		} );
	} );

	describe( 'When calling disposeAfter()', function () {

		describe( 'disposing after 1 invocation', function () {
			var count = 0;
			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 1 invocation', function () {
				sub = monologue.on( "Some.Topic",function ( data ) {
					count++;
				} ).disposeAfter( 1 );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				expect( count ).to.be( 1 );
			} );

		} );

		describe( 'disposing after 3 invocations', function () {
			var count = 0;
			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 3 invocations', function () {
				sub = monologue.on( "Some.Topic",function ( data ) {
					count++;
				} ).disposeAfter( 3 );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				expect( count ).to.be( 3 );
			} );

		} );

	} );

	describe( 'When calling withContext() and disposeAfter()', function () {
		var obj = {
			name : "Paul"
		};
		afterEach( function () {
			sub.unsubscribe();
		} );

		it( 'Should invoke the callback with the provided context', function () {
			var nm, count = 0;
			sub = monologue.on( "Some.Topic",function ( data ) {
				nm = this.name;
				count++;
			} ).withContext( obj ).disposeAfter( 1 );
			monologue.emit( "Some.Topic", "Hai" );
			monologue.emit( "Some.Topic", "Hai" );
			expect( nm ).to.be( "Paul" );
			expect( count ).to.be( 1 );
		} );
	} );

	describe( 'When calling once()', function () {
		var count = 0;
		afterEach( function () {
			sub.unsubscribe();
		} );

		it( 'Should unsubscribe the callback after 1 invocation', function () {
			sub = monologue.on( "Some.Topic",function ( data ) {
				count++;
			} ).disposeAfter( 1 );
			monologue.emit( "Some.Topic", "Hai" );
			monologue.emit( "Some.Topic", "Hai" );
			expect( count ).to.be( 1 );
		} );
	} );

	describe( 'When calling distinctUntilChanged()', function () {
		var events = [];

		describe( 'When publishing a primitive', function () {
			beforeEach(function () {
				events = [];
				sub = monologue.on( "Some.Topic",function ( data ) {
					events.push(data);
				} ).distinctUntilChanged();
			});

			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 1 invocation', function () {
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				monologue.emit( "Some.Topic", "Hai" );
				expect( events.length ).to.be( 3 );
				expect( events[0] ).to.be( "Hai" );
				expect( events[1] ).to.be( "I SEZ HAI!" );
				expect( events[2] ).to.be( "Hai" );
			} );
		} );

		describe( 'When publishing an object', function () {
			beforeEach(function () {
				events = [];
				sub = monologue.on( "Some.Topic",function ( data ) {
					events.push(data);
				} ).distinctUntilChanged();
			});

			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 1 invocation', function () {
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "John Lennon" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				expect( events.length ).to.be( 3 );
				expect( events[0] ).to.eql( { name: "Paul McCartney" } );
				expect( events[1] ).to.eql( { name: "John Lennon" } );
				expect( events[2] ).to.eql( { name: "Paul McCartney" } );
			} );
		} );

	} );

	describe( 'When calling distinct()', function () {
		var events = [];

		describe( 'When publishing a primitive', function () {
			beforeEach(function () {
				events = [];
				sub = monologue.on( "Some.Topic",function ( data ) {
					events.push(data);
				} ).distinct();
			});

			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 1 invocation', function () {
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				monologue.emit( "Some.Topic", "Hai" );
				monologue.emit( "Some.Topic", "I SEZ HAI!" );
				expect( events.length ).to.be( 2 );
				expect( events[0] ).to.be( "Hai" );
				expect( events[1] ).to.be( "I SEZ HAI!" );
			} );
		} );

		describe( 'When publishing an object', function () {
			beforeEach(function () {
				events = [];
				sub = monologue.on( "Some.Topic",function ( data ) {
					events.push(data);
				} ).distinct();
			});

			afterEach( function () {
				sub.unsubscribe();
			} );

			it( 'Should unsubscribe the callback after 1 invocation', function () {
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "John Lennon" } );
				monologue.emit( "Some.Topic", { name: "Paul McCartney" } );
				monologue.emit( "Some.Topic", { name: "John Lennon" } );
				expect( events.length ).to.be( 2 );
				expect( events[0] ).to.eql( { name: "Paul McCartney" } );
				expect( events[1] ).to.eql( { name: "John Lennon" } );
			} );
		} );

	} );

});