/*global describe,it,beforeEach*/
var Monologue = typeof window === "undefined" ? require("../lib/monologue.js") : window.Monologue;
var expect = typeof window === "undefined" ? require("expect.js") : window.expect;
describe("Removing Subscriptions", function() {

    var monologue = new Monologue();
    var sub;
    var events = [];

    beforeEach(function() {
        sub = monologue.on("Some.Topic", function(data) {
            events.push(data);
        });
    });

    it("Calling unsubscribe should remove the SubscriptionDefinition", function() {
        expect(monologue._subscriptions["Some.Topic"][0]).to.eql(sub);
        sub.unsubscribe();
        expect(monologue._subscriptions["Some.Topic"].length).to.be(0);
    });

    it("Calling monologue.off(sub) should remove the SubscriptionDefinition", function() {
        expect(monologue._subscriptions["Some.Topic"][0]).to.eql(sub);
        monologue.off(sub);
        expect(monologue._subscriptions["Some.Topic"].length).to.be(0);
    });

    it("Calling monologue.off(topic) should remove the SubscriptionDefinition", function() {
        expect(monologue._subscriptions["Some.Topic"][0]).to.eql(sub);
        monologue.off("Some.Topic");
        expect(monologue._subscriptions["Some.Topic"].length).to.be(0);
    });

    it("Calling monologue.off() should remove ALL Subscriptions", function() {
        var subB = monologue.on("Other.Topic", function(data) {
            events.push(data);
        });
        var subC = monologue.on("Other.Stuff", function(data) {
            events.push(data);
        });
        expect(monologue._subscriptions["Some.Topic"][0]).to.eql(sub);
        expect(monologue._subscriptions["Other.Topic"][0]).to.eql(subB);
        expect(monologue._subscriptions["Other.Stuff"][0]).to.eql(subC);
        monologue.off();
        expect(monologue._subscriptions).to.eql({});
    });

});