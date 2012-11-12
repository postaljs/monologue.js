describe( 'Inheriting From Monologue', function () {
  var MyStuff = function() {
    this.prop = "some value";
  };

  MyStuff.prototype.foo = function() {
    this.emit('bar');
  };

  Monologue.mixin(MyStuff);

  var instance = new MyStuff(), emitted = false;

  instance.on('bar', function() {
    emitted = true;
  });

  instance.foo();

  it( "Child should inherit Monologue and preserve it's own prototype", function () {
    expect(instance).to.have.property("on");
    expect(instance).to.have.property("once");
    expect(instance).to.have.property("off");
    expect(instance).to.have.property("emit");
    expect(instance).to.have.property("getEnvelope");
    expect(instance).to.have.property("prop");
    expect(instance.prop).to.be("some value");
    expect(emitted).to.be(true);
  } );

} );