/*global describe,it*/
var Monologue = typeof window === "undefined" ? require("../lib/monologue.js") : window.Monologue;
var expect = typeof window === "undefined" ? require("expect.js") : window.expect;
var riveter = typeof window === "undefined" ? require("riveter") : window.riveter;
describe("Extending From Monologue", function() {
    var MyStuff = Monologue.extend({
        prop: "some value",
        foo: function() {
            this.emit("bar");
        }
    });

    var instance = new MyStuff(),
        emitted = false;

    instance.on("bar", function() {
        emitted = true;
    });

    instance.foo();

    it("Child should extend from Monologue", function() {
        expect(instance).to.have.property("on");
        expect(instance).to.have.property("once");
        expect(instance).to.have.property("off");
        expect(instance).to.have.property("emit");
        expect(instance).to.have.property("getEnvelope");
        expect(instance).to.have.property("prop");
        expect(instance.prop).to.be("some value");
        expect(emitted).to.be(true);
    });

});

describe("Inheriting From Monologue via riveter", function() {
    var MyStuff = function() {
        this.prop = "some value";
    };

    MyStuff.prototype.foo = function() {
        this.emit("bar");
    };

    riveter(MyStuff);

    MyStuff.inherits(Monologue);

    var instance = new MyStuff(),
        emitted = false;

    instance.on("bar", function() {
        emitted = true;
    });

    instance.foo();

    it("Child should inherit Monologue", function() {
        expect(instance).to.have.property("on");
        expect(instance).to.have.property("once");
        expect(instance).to.have.property("off");
        expect(instance).to.have.property("emit");
        expect(instance).to.have.property("getEnvelope");
        expect(instance).to.have.property("prop");
        expect(instance.prop).to.be("some value");
        expect(emitted).to.be(true);
    });

});

describe("When calling Monologue.mixInto", function() {
    var MyStuff = function() {};

    MyStuff.prototype.emit = function() {
        return "Old Emit";
    };

    Monologue.mixInto(MyStuff);

    var instance = new MyStuff();

    it("MyStuff should have Monologue's methods.", function() {
        expect(instance.emit()).to.not.be.ok();
    });

});