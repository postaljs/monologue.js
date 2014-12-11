/*global describe,it, Monologue, riveter*/

describe( "Extending From Monologue", function() {
	var MyStuff = Monologue.extend( {
		prop: "some value",
		foo: function() {
			this.emit( "bar" );
		}
	} );

	var instance = new MyStuff(),
		emitted = false;

	instance.on( "bar", function() {
		emitted = true;
	} );

	instance.foo();

	it( "Child should extend from Monologue", function() {
		instance.should.have.property( "on" );
		instance.should.have.property( "once" );
		instance.should.have.property( "off" );
		instance.should.have.property( "emit" );
		instance.should.have.property( "getEnvelope" );
		instance.should.have.property( "prop" );
		instance.prop.should.equal( "some value" );
		emitted.should.equal( true );
	} );

} );

describe( "Inheriting From Monologue via riveter", function() {
	var MyStuff = function() {
		this.prop = "some value";
	};

	MyStuff.prototype.foo = function() {
		this.emit( "bar" );
	};

	riveter( MyStuff );

	MyStuff.inherits( Monologue );

	var instance = new MyStuff(),
		emitted = false;

	instance.on( "bar", function() {
		emitted = true;
	} );

	instance.foo();

	it( "Child should inherit Monologue", function() {
		instance.should.have.property( "on" );
		instance.should.have.property( "once" );
		instance.should.have.property( "off" );
		instance.should.have.property( "emit" );
		instance.should.have.property( "getEnvelope" );
		instance.should.have.property( "prop" );
		instance.prop.should.equal( "some value" );
		emitted.should.equal( true );
	} );

} );

describe( "When calling Monologue.mixInto", function() {
	var MyStuff = function() {};

	MyStuff.prototype.emit = function() {
		return "Old Emit";
	};

	Monologue.mixInto( MyStuff );

	var instance = new MyStuff();

	it( "MyStuff should have Monologue's methods.", function() {
		instance.emit.should.equal( Monologue.prototype.emit );
	} );

} );
