/*
 monologue.js
 Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
 Version 0.1.3
 */
(function ( root, factory ) {
	if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = function(_) {
			return factory( _ );
		}
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["underscore"], function ( _ ) {
			return factory( _, root );
		} );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root );
	}
}( this, function ( _, global, undefined ) {
	var bindingsResolver = {
	  cache : { },
	
	  compare : function ( binding, topic ) {
	    if ( this.cache[topic] && this.cache[topic][binding] ) {
	      return true;
	    }
	    var pattern = ("^" + binding.replace( /\./g, "\\." )            // escape actual periods
	      .replace( /\*/g, "[A-Z,a-z,0-9]*" ) // asterisks match any alpha-numeric 'word'
	      .replace( /#/g, ".*" ) + "$")       // hash matches 'n' # of words (+ optional on start/end of topic)
	      .replace( "\\..*$", "(\\..*)*$" )   // fix end of topic matching on hash wildcards
	      .replace( "^.*\\.", "^(.*\\.)*" );  // fix beginning of topic matching on hash wildcards
	    var rgx = new RegExp( pattern );
	    var result = rgx.test( topic );
	    if ( result ) {
	      if ( !this.cache[topic] ) {
	        this.cache[topic] = {};
	      }
	      this.cache[topic][binding] = true;
	    }
	    return result;
	  },
	
	  reset : function () {
	    this.cache = {};
	  }
	};
	var ConsecutiveDistinctPredicate = function () {
		var previous;
		return function ( data ) {
			var eq = false;
			if ( _.isString( data ) ) {
				eq = data === previous;
				previous = data;
			}
			else {
				eq = _.isEqual( data, previous );
				previous = _.clone( data );
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
	
	var SubscriptionDefinition = function ( topic, callback, emitter ) {
		this.topic = topic;
		this.callback = callback;
		this.context = null;
		this.constraints = [];
		this.emitter = emitter;
	};
	
	_.extend(SubscriptionDefinition.prototype, {
		withContext: function(context) {
			this.context = context;
			return this;
		},
	
		defer : function () {
			var fn = this.callback;
			this.callback = function ( data ) {
				setTimeout( fn, 0, data );
			};
			return this;
		},
	
		disposeAfter : function ( maxCalls ) {
			if ( _.isNaN( maxCalls ) || maxCalls <= 0 ) {
				throw "The value provided to disposeAfter (maxCalls) must be a number greater than zero.";
			}
			var self = this;
			var dispose = _.after( maxCalls, _.bind( function () {
				this.unsubscribe();
			}, this ) );
	
			var fn = self.callback;
			self.callback = function() {
				fn.apply(self.context, arguments);
				dispose();
			};
	
			return self;
		},
	
		once: function() {
			return this.disposeAfter(1);
		},
	
		distinctUntilChanged : function () {
			this.withConstraint( new ConsecutiveDistinctPredicate() );
			return this;
		},
	
		distinct : function () {
			this.withConstraint( new DistinctPredicate() );
			return this;
		},
	
		unsubscribe : function () {
			this.emitter._subscriptions[this.topic] = _.without(this.emitter._subscriptions[this.topic], this);
		},
	
		withConstraint : function ( predicate ) {
			if ( !_.isFunction( predicate ) ) {
				throw "Predicate constraint must be a function";
			}
			this.constraints.push( predicate );
			return this;
		},
	
		withConstraints : function ( predicates ) {
			var self = this;
			if ( _.isArray( predicates ) ) {
				_.each( predicates, function ( predicate ) {
					self.withConstraint( predicate );
				} );
			}
			return self;
		},
	
		withDebounce : function ( milliseconds ) {
			if ( _.isNaN( milliseconds ) ) {
				throw "Milliseconds must be a number";
			}
			var fn = this.callback;
			this.callback = _.debounce( fn, milliseconds );
			return this;
		},
	
		withDelay : function ( milliseconds ) {
			if ( _.isNaN( milliseconds ) ) {
				throw "Milliseconds must be a number";
			}
			var fn = this.callback;
			this.callback = function ( data ) {
				setTimeout( function () {
					fn( data );
				}, milliseconds );
			};
			return this;
		},
	
		withThrottle : function ( milliseconds ) {
			if ( _.isNaN( milliseconds ) ) {
				throw "Milliseconds must be a number";
			}
			var fn = this.callback;
			this.callback = _.throttle( fn, milliseconds );
			return this;
		}
	});
	
	SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;
	var Monologue = function () {};
	
	Monologue.prototype = {
		on : function ( topic, callback ) {
			var self = this;
			if ( !self._subscriptions ) {
				self._subscriptions = {};
			}
			var subDef = new SubscriptionDefinition( topic, callback, self );
			var subs = self._subscriptions[topic];
			if ( !subs ) {
				subs = self._subscriptions[topic] = [];
			}
			subs.push( subDef );
			return subDef;
		},
	
		once : function ( topic, callback ) {
			return this.on( topic, callback ).once();
		},
	
		off : function ( topic, context ) {
			if ( !this._subscriptions ) {
				this._subscriptions = {};
			}
			switch ( arguments.length ) {
				case 0:
					_.each( this._subscriptions, function ( topic ) {
						_.each( topic, function ( subDef ) {
							subDef.unsubscribe();
						} );
					} );
					this._subscriptions = {};
					break;
				case 1:
					var type = Object.prototype.toString.call( topic ) === "[object String]" ? "topic" : topic instanceof SubscriptionDefinition ? "def" : "context";
					switch ( type ) {
						case 'topic':
							if ( this._subscriptions[topic] ) {
								while ( this._subscriptions[topic].length ) {
									this._subscriptions[topic].pop().unsubscribe();
								}
							}
							break;
						case 'context':
							var toRemove = [];
							_.each( this._subscriptions, function ( subs ) {
								_.each( _.clone( subs ), function ( subDef, idx ) {
									if ( subDef.context === topic ) {
										toRemove.push( subDef.unsubscribe() );
										subs.splice( idx, 1 );
									}
								} );
							} );
							break;
						default:
							topic.unsubscribe();
							break;
					}
					break;
				default:
					_.each( _.clone( this._subscriptions[topic] ), function ( subDef, idx ) {
						if ( subDef.context === topic ) {
							toRemove.push( subDef.unsubscribe() );
							this._subscriptions[topic].splice( idx, 1 );
						}
					}, this );
					break;
			}
		},
	
		emit : function ( topic, data ) {
			var env = this.getEnvelope( topic, data );
			if ( !this._subscriptions ) {
				this._subscriptions = {};
			}
			_.each( _.clone( this._subscriptions ), function ( subDef, subTopic ) {
				if ( Monologue.resolver.compare( subTopic, topic ) ) {
					_.each( subDef, function ( subscriber ) {
						if ( _.all( subscriber.constraints, function ( constraint ) {
							return constraint( data, env );
						} ) && ( typeof subscriber.callback === 'function' ) ) {
							try {
								subscriber.callback.apply( subscriber.context, [data, env] );
							} catch ( ex ) {
								if(Monologue.debug && typeof console !== "undefined" && typeof console.log === 'function') {
									console.log("Monologue Emit Exception Caught");
									console.log(ex);
								}
								subscriber.failed = true;
								if ( this._trackErrors ) {
									if ( !this._yuno ) {
										this._yuno = [];
									}
									this._yuno.push( { def : subscriber, env : env, exception : ex} );
								}
							}
						}
					}, this );
				}
			}, this );
		},
	
		getEnvelope : function ( topic, data ) {
			return {
				topic : topic,
				timeStamp : new Date(),
				data : data
			};
		}
	};
	
	Monologue.resolver = bindingsResolver;
	Monologue.debug = false;
	Monologue.SubscriptionDefinition = SubscriptionDefinition;
	Monologue.mixin = function ( subc ) {
		if ( !subc ) {
			throw new Error( 'You have to provide a constructor function if you want to make it an emitter.' );
		}
		_.extend( subc.prototype, Monologue.prototype );
		subc.prototype.constructor = subc;
		subc.prototype.parent = Monologue.prototype;
		subc.prototype.parent.constructor = Monologue;
	};
	
	return Monologue;
} ));