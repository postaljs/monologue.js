/**
 * monologue.js - EventEmitter replacement with AMQP-style bindings and other advanced features. Compatible with postal.js's API.
 * Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 * Version: v0.2.1
 * Url: https://github.com/postaljs/monologue.js
 * License(s): MIT, GPL
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node, or CommonJS-Like environments
        module.exports = factory(require("lodash"), require("riveter"));
    } else if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["lodash", "riveter"], function (_, riveter) {
            return factory(_, riveter, root);
        });
    } else {
        // Browser globals
        root.Monologue = factory(root._, root.riveter, root);
    }
}(this, function (_, riveter, global, undefined) {
    var bindingsResolver = {
        cache: {},
        regex: {},
        compare: function (binding, topic) {
            var pattern, rgx, prevSegment, result = (this.cache[topic] && this.cache[topic][binding]);
            if (typeof result !== "undefined") {
                return result;
            }
            if (!(rgx = this.regex[binding])) {
                pattern = "^" + _.map(binding.split("."), function (segment) {
                    var res = "";
                    if ( !! prevSegment) {
                        res = prevSegment !== "#" ? "\\.\\b" : "\\b";
                    }
                    if (segment === "#") {
                        res += "[\\s\\S]*";
                    } else if (segment === "*") {
                        res += "[^.]+";
                    } else {
                        res += segment;
                    }
                    prevSegment = segment;
                    return res;
                }).join("") + "$";
                rgx = this.regex[binding] = new RegExp(pattern);
            }
            this.cache[topic] = this.cache[topic] || {};
            this.cache[topic][binding] = result = rgx.test(topic);
            return result;
        },
        reset: function () {
            this.cache = {};
            this.regex = {};
        }
    };
    var ConsecutiveDistinctPredicate = function () {
        var previous;
        return function (data) {
            var eq = false;
            if (_.isString(data)) {
                eq = data === previous;
                previous = data;
            }
            else {
                eq = _.isEqual(data, previous);
                previous = _.clone(data);
            }
            return !eq;
        };
    };
    var DistinctPredicate = function () {
        var previous = [];
        return function (data) {
            var isDistinct = !_.any(previous, function (p) {
                if (_.isObject(data) || _.isArray(data)) {
                    return _.isEqual(data, p);
                }
                return data === p;
            });
            if (isDistinct) {
                previous.push(data);
            }
            return isDistinct;
        };
    };
    var SubscriptionDefinition = function (topic, callback, emitter) {
        this.topic = topic;
        this.callback = callback;
        this.context = null;
        this.constraints = [];
        this.emitter = emitter;
    };
    _.extend(SubscriptionDefinition.prototype, {
        withContext: function (context) {
            this.context = context;
            return this;
        },
        unsubscribe: function () {
            this.emitter._subscriptions[this.topic] = _.without(this.emitter._subscriptions[this.topic], this);
        },
        disposeAfter: function (maxCalls) {
            if (_.isNaN(maxCalls) || maxCalls <= 0) {
                throw "The value provided to disposeAfter (maxCalls) must be a number greater than zero.";
            }
            var self = this;
            var dispose = _.after(maxCalls, function () {
                self.unsubscribe();
            });
            var fn = self.callback;
            self.callback = function () {
                fn.apply(self.context, arguments);
                dispose();
            };
            return self;
        },
        once: function () {
            return this.disposeAfter(1);
        }
    });
    SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;
    _.extend(SubscriptionDefinition.prototype, {
        defer: function () {
            var fn = this.callback;
            this.callback = function (data, env) {
                var self = this;
                setTimeout(function () {
                    fn.call(self, data, env);
                }, 0);
            };
            return this;
        },
        distinctUntilChanged: function () {
            this.withConstraint(new ConsecutiveDistinctPredicate());
            return this;
        },
        distinct: function () {
            this.withConstraint(new DistinctPredicate());
            return this;
        },
        withConstraint: function (predicate) {
            if (!_.isFunction(predicate)) {
                throw "Predicate constraint must be a function";
            }
            this.constraints.push(predicate);
            return this;
        },
        withConstraints: function (predicates) {
            var self = this;
            if (_.isArray(predicates)) {
                _.each(predicates, function (predicate) {
                    self.withConstraint(predicate);
                });
            }
            return self;
        },
        withDebounce: function (milliseconds) {
            if (_.isNaN(milliseconds)) {
                throw "Milliseconds must be a number";
            }
            var fn = this.callback;
            this.callback = _.debounce(fn, milliseconds);
            return this;
        },
        withDelay: function (milliseconds) {
            if (_.isNaN(milliseconds)) {
                throw "Milliseconds must be a number";
            }
            var fn = this.callback;
            this.callback = function (data) {
                setTimeout(function () {
                    fn(data);
                }, milliseconds);
            };
            return this;
        },
        withThrottle: function (milliseconds) {
            if (_.isNaN(milliseconds)) {
                throw "Milliseconds must be a number";
            }
            var fn = this.callback;
            this.callback = _.throttle(fn, milliseconds);
            return this;
        }
    });
    var Monologue = function () {};
    var fireSub = function (subscriber, envelope) {
        if (Monologue.resolver.compare(subscriber.topic, envelope.topic)) {
            if (_.all(subscriber.constraints, function (constraint) {
                return constraint(envelope.data, envelope);
            }) && (typeof subscriber.callback === "function")) {
                try {
                    subscriber.callback.apply(subscriber.context, [envelope.data, envelope]);
                } catch (ex) {
                    if (Monologue.debug && typeof console !== "undefined" && typeof console.log === "function") {
                        console.log("Monologue Emit Exception Caught");
                        console.log(ex);
                    }
                    subscriber.failed = true;
                    if (this._trackErrors) {
                        if (!this._yuno) {
                            this._yuno = [];
                        }
                        this._yuno.push({
                            def: subscriber,
                            env: envelope,
                            exception: ex
                        });
                    }
                }
            }
        }
    };
    Monologue.prototype = {
        on: function (topic, callback) {
            var self = this;
            self._subscriptions = self._subscriptions || {};
            self._subscriptions[topic] = self._subscriptions[topic] || [];
            self._subscriptions[topic].push(new SubscriptionDefinition(topic, callback, self));
            return self._subscriptions[topic][self._subscriptions[topic].length - 1];
        },
        once: function (topic, callback) {
            return this.on(topic, callback).once();
        },
        off: function (topic, context) {
            this._subscriptions = this._subscriptions || {};
            switch (arguments.length) {
            case 0:
                _.each(this._subscriptions, function (topic) {
                    _.each(topic, function (subDef) {
                        subDef.unsubscribe();
                    });
                });
                this._subscriptions = {};
                break;
            case 1:
                var type = Object.prototype.toString.call(topic) === "[object String]" ? "topic" : topic instanceof SubscriptionDefinition ? "def" : "context";
                switch (type) {
                case "topic":
                    if (this._subscriptions[topic]) {
                        while (this._subscriptions[topic].length) {
                            this._subscriptions[topic].pop().unsubscribe();
                        }
                    }
                    break;
                case "context":
                    _.each(this._subscriptions, function (subs) {
                        _.each(_.clone(subs), function (subDef, idx) {
                            if (subDef.context === topic) {
                                subDef.unsubscribe();
                                subs.splice(idx, 1);
                            }
                        });
                    });
                    break;
                default:
                    topic.unsubscribe();
                    break;
                }
                break;
            default:
                _.each(_.clone(this._subscriptions[topic]), function (subDef, idx) {
                    if (subDef.context === context) {
                        subDef.unsubscribe();
                        this._subscriptions[topic].splice(idx, 1);
                    }
                }, this);
                break;
            }
        },
        emit: function (topic, data) {
            var envelope = this.getEnvelope(topic, data);
            this._subscriptions = this._subscriptions || {};
            _.each(this._subscriptions, function (subscribers) {
                var idx = 0,
                    len = subscribers.length,
                    subDef;
                while (idx < len) {
                    if (subDef = subscribers[idx++]) {
                        fireSub.call(this, subDef, envelope);
                    }
                }
            }, this);
        },
        getEnvelope: function (topic, data) {
            return {
                topic: topic,
                timeStamp: new Date(),
                data: data
            };
        }
    };
    Monologue.resolver = bindingsResolver;
    Monologue.debug = false;
    Monologue.SubscriptionDefinition = SubscriptionDefinition;
    riveter(Monologue);
    Monologue.mixInto = function (target) {
        riveter.punch(target, Monologue.prototype);
    };
    return Monologue;
}));