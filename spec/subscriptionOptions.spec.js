/*global describe,it,afterEach,beforeEach*/
var Monologue = typeof window === "undefined" ? require("../lib/monologue.js") : window.Monologue;
var expect = typeof window === "undefined" ? require("expect.js") : window.expect;
describe("Subscription Definition Options", function() {

    var monologue = new Monologue();
    var sub;

    describe("When calling defer()", function() {

        afterEach(function() {
            sub.unsubscribe();
        });

        it("Should invoke the callback when the event loop is free", function(done) {
            sub = monologue.on("Some.Topic", function(data) {
                expect(data).to.be("Hai**");
                done();
            }).defer();
            monologue.emit("Some.Topic", "Hai**");
        });
    });

    describe("When calling withContext()", function() {
        var obj = {
            name: "Paul"
        };
        afterEach(function() {
            sub.unsubscribe();
        });

        it("Should invoke the callback with the provided context", function() {
            var nm;
            sub = monologue.on("Some.Topic", function() {
                nm = this.name;
            }).withContext(obj);
            monologue.emit("Some.Topic", "Hai");
            expect(nm).to.be("Paul");
        });
    });

    describe("When calling disposeAfter()", function() {

        describe("disposing after 1 invocation", function() {
            var count = 0;
            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 1 invocation", function() {
                sub = monologue.on("Some.Topic", function() {
                    count++;
                }).disposeAfter(1);
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                expect(count).to.be(1);
            });

        });

        describe("disposing after 3 invocations", function() {
            var count = 0;
            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 3 invocations", function() {
                sub = monologue.on("Some.Topic", function() {
                    count++;
                }).disposeAfter(3);
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                expect(count).to.be(3);
            });

        });

    });

    describe("When calling withContext() and disposeAfter()", function() {
        var obj = {
            name: "Paul"
        };
        afterEach(function() {
            sub.unsubscribe();
        });

        it("Should invoke the callback with the provided context", function() {
            var nm, count = 0;
            sub = monologue.on("Some.Topic", function() {
                nm = this.name;
                count++;
            }).withContext(obj).disposeAfter(1);
            monologue.emit("Some.Topic", "Hai");
            monologue.emit("Some.Topic", "Hai");
            expect(nm).to.be("Paul");
            expect(count).to.be(1);
        });
    });

    describe("When calling once()", function() {
        var count = 0;
        afterEach(function() {
            sub.unsubscribe();
        });

        it("Should unsubscribe the callback after 1 invocation", function() {
            sub = monologue.on("Some.Topic", function() {
                count++;
            }).disposeAfter(1);
            monologue.emit("Some.Topic", "Hai");
            monologue.emit("Some.Topic", "Hai");
            expect(count).to.be(1);
        });
    });

    describe("When calling distinctUntilChanged()", function() {
        var events = [];

        describe("When publishing a primitive", function() {
            beforeEach(function() {
                events = [];
                sub = monologue.on("Some.Topic", function(data) {
                    events.push(data);
                }).distinctUntilChanged();
            });

            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 1 invocation", function() {
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "I SEZ HAI!");
                monologue.emit("Some.Topic", "Hai");
                expect(events.length).to.be(3);
                expect(events[0]).to.be("Hai");
                expect(events[1]).to.be("I SEZ HAI!");
                expect(events[2]).to.be("Hai");
            });
        });

        describe("When publishing an object", function() {
            beforeEach(function() {
                events = [];
                sub = monologue.on("Some.Topic", function(data) {
                    events.push(data);
                }).distinctUntilChanged();
            });

            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 1 invocation", function() {
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "John Lennon"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                expect(events.length).to.be(3);
                expect(events[0]).to.eql({
                    name: "Paul McCartney"
                });
                expect(events[1]).to.eql({
                    name: "John Lennon"
                });
                expect(events[2]).to.eql({
                    name: "Paul McCartney"
                });
            });
        });

    });

    describe("When calling distinct()", function() {
        var events = [];

        describe("When publishing a primitive", function() {
            beforeEach(function() {
                events = [];
                sub = monologue.on("Some.Topic", function(data) {
                    events.push(data);
                }).distinct();
            });

            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 1 invocation", function() {
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "I SEZ HAI!");
                monologue.emit("Some.Topic", "Hai");
                monologue.emit("Some.Topic", "I SEZ HAI!");
                expect(events.length).to.be(2);
                expect(events[0]).to.be("Hai");
                expect(events[1]).to.be("I SEZ HAI!");
            });
        });

        describe("When publishing an object", function() {
            beforeEach(function() {
                events = [];
                sub = monologue.on("Some.Topic", function(data) {
                    events.push(data);
                }).distinct();
            });

            afterEach(function() {
                sub.unsubscribe();
            });

            it("Should unsubscribe the callback after 1 invocation", function() {
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "John Lennon"
                });
                monologue.emit("Some.Topic", {
                    name: "Paul McCartney"
                });
                monologue.emit("Some.Topic", {
                    name: "John Lennon"
                });
                expect(events.length).to.be(2);
                expect(events[0]).to.eql({
                    name: "Paul McCartney"
                });
                expect(events[1]).to.eql({
                    name: "John Lennon"
                });
            });
        });

    });

    describe("When calling withConstraint()", function() {
        var events = [];
        var count = 0;
        beforeEach(function() {
            events = [];
            sub = monologue.on("Some.Topic", function(data) {
                events.push(data);
            }).withConstraint(function() {
                var cnt = count;
                count += 1;
                return cnt === 0;
            });
        });

        afterEach(function() {
            sub.unsubscribe();
        });

        it("Should unsubscribe the callback after 1 invocation", function() {
            monologue.emit("Some.Topic", {
                name: "Paul McCartney"
            });
            monologue.emit("Some.Topic", {
                name: "John Lennon"
            });
            expect(events.length).to.be(1);
            expect(events[0]).to.eql({
                name: "Paul McCartney"
            });
        });

    });

    describe("When calling withDebounce", function() {
        var events;

        beforeEach(function() {
            events = [];
            sub = monologue.on("Debounced.Topic", function(data) {
                events.push(data);
            }).withDebounce(600);
        });

        it("should have only invoked debounced callback once", function(done) {
            monologue.emit("Debounced.Topic", {
                name: "Help!"
            }); // starts the clock on debounce
            setTimeout(function() {
                monologue.emit("Debounced.Topic", {
                    name: "Paul McCartney"
                });
            }, 20); // should not invoke callback
            setTimeout(function() {
                monologue.emit("Debounced.Topic", {
                    name: "John Lennon"
                });
            }, 100); // should not invoke callback
            setTimeout(function() {
                monologue.emit("Debounced.Topic", {
                    name: "George Harrison"
                });
            }, 150); // should not invoke callback
            setTimeout(function() {
                monologue.emit("Debounced.Topic", {
                    name: "Ringo Starkey"
                });
            }, 750); // should not invoke callback
            setTimeout(function() {
                expect(events[0]).to.eql({
                    name: "Ringo Starkey"
                });
                expect(events.length).to.be(1);
                sub.unsubscribe();
                done();
            }, 1500);
        });
    });

    describe("When calling withDelay", function() {
        var events;

        beforeEach(function() {
            events = [];
            sub = monologue.on("Delayed.Topic", function(data) {
                events.push(data);
            }).withDelay(300);
        });

        it("should have only invoked debounced callback once", function(done) {
            monologue.emit("Delayed.Topic", {
                name: "Help!"
            }); // starts the clock on debounce
            setTimeout(function() {
                expect(events[0]).to.eql({
                    name: "Help!"
                });
                expect(events.length).to.be(1);
                sub.unsubscribe();
                done();
            }, 600);
        });
    });

    describe(" When calling withThrottle", function() {
        var events;

        beforeEach(function() {
            events = [];
            sub = monologue.on("Throttled.Topic", function(data) {
                events.push(data);
            }).withThrottle(500);
        });

        it("should have only invoked throttled callback once", function(done) {
            monologue.emit("Throttled.Topic", {
                name: "Hey, Jude."
            }); // starts clock on throttle
            events = [];
            var fn = function() {
                monologue.emit("Throttled.Topic", {
                    name: "Hey, Jude."
                });
            };
            for (var i = 0; i < 10; i++) {
                fn();
            }
            setTimeout(function() {
                expect(events.length).to.be(1);
                done();
            }, 800);
        });
    });

});