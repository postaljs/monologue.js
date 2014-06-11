/*global describe,it,afterEach,beforeEach */
var Monologue = typeof window === "undefined" ? require("../lib/monologue.js") : window.Monologue;
var expect = typeof window === "undefined" ? require("expect.js") : window.expect;

describe("Adding Subscriptions", function() {

    var monologue = new Monologue();
    var sub;
    var events = [];

    beforeEach(function() {
        sub = monologue.on("Some.Topic", function(data) {
            events.push(data);
        });
    });

    afterEach(function() {
        sub.unsubscribe();
    });

    it("It should return a SubscriptionDefinition instance", function() {
        expect(sub).to.have.property("topic");
        expect(sub).to.have.property("callback");
        expect(sub).to.have.property("context");
        expect(sub).to.have.property("once");
        expect(sub).to.have.property("disposeAfter");
        expect(sub).to.have.property("defer");
        expect(sub).to.have.property("withContext");
    });

    it("It should add the SubscriptionDefinition to the monologue._subscriptions", function() {
        expect(monologue._subscriptions["Some.Topic"][0]).to.eql(sub);
    });

});