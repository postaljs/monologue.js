/**
 * monologue.js - EventEmitter replacement with AMQP-style bindings and other advanced features. Compatible with postal.js's API.
 * Author: Jim Cowart (http://ifandelse.com)
 * Version: v0.3.5
 * Url: https://github.com/postaljs/monologue.js
 * License(s): MIT, GPL
 */

( function( root, factory ) {
	/* istanbul ignore if  */
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "lodash", "riveter" ], function( _, riveter ) {
			return factory( _, riveter, root );
		} );
	/* istanbul ignore else  */
	} else if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = factory( require( "lodash" ), require( "riveter" ) );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root.riveter, root );
	}
}( this, function( _, riveter, global, undefined ) {
	
var keyDelimiter = "|";
var bindingsResolver = {
	cache: {},
	regex: {},

	compare: function compare( binding, topic ) {
		var pattern;
		var rgx;
		var prevSegment;
		var result = ( this.cache[ topic + keyDelimiter + binding ] );
		// result is cached?
		if ( result === true ) {
			return result;
		}
		// plain string matching?
		if ( binding.indexOf( "#" ) === -1 && binding.indexOf( "*" ) === -1 ) {
			result = this.cache[ topic + keyDelimiter + binding ] = ( topic === binding );
			return result;
		}
		// ah, regex matching, then
		if ( !( rgx = this.regex[ binding ] ) ) {
			pattern = "^" + _.map( binding.split( "." ), function mapTopicBinding( segment ) {
					var res = "";
					if ( !!prevSegment ) {
						res = prevSegment !== "#" ? "\\.\\b" : "\\b";
					}
					if ( segment === "#" ) {
						res += "[\\s\\S]*";
					} else if ( segment === "*" ) {
						res += "[^.]+";
					} else {
						res += segment;
					}
					prevSegment = segment;
					return res;
				} ).join( "" ) + "$";
			rgx = this.regex[ binding ] = new RegExp( pattern );
		}
		result = this.cache[ topic + keyDelimiter + binding ] = rgx.test( topic );
		return result;
	},

	reset: function reset() {
		this.cache = {};
		this.regex = {};
	},

	purge: function( options ) {
		var self = this;
		var matchPredicate = function( val, key ) {
			var split = key.split( keyDelimiter );
			var topic = split[ 0 ];
			var binding = split[ 1 ];
			if ( ( typeof options.topic === "undefined" || options.topic === topic ) &&
					( typeof options.binding === "undefined" || options.binding === binding ) ) {
				delete self.cache[ key ];
			}
		};

		if ( typeof options === "undefined" ) {
			this.reset();
		} else {
			_.each( this.cache, matchPredicate );
		}
	}
};

	var SubscriptionDefinition = function( topic, callback, emitter ) {
	this.topic = topic;
	this.callback = callback;
	this.pipeline = [];
	this.cacheKeys = [];
	this._context = undefined;
	this.emitter = emitter;
};

var ConsecutiveDistinctPredicate = function() {
	var previous;
	return function( data ) {
		var eq = false;
		if ( _.isString( data ) ) {
			eq = data === previous;
			previous = data;
		} else {
			eq = _.isEqual( data, previous );
			previous = _.clone( data );
		}
		return !eq;
	};
};

var DistinctPredicate = function DistinctPredicateFactory() {
	var previous = [];
	return function DistinctPredicate( data ) {
		var isDistinct = !_.any( previous, function( p ) {
			if ( _.isObject( data ) || _.isArray( data ) ) {
				return _.isEqual( data, p );
			}
			return data === p;
		} );
		if ( isDistinct ) {
			previous.push( data );
		}
		return isDistinct;
	};
};

SubscriptionDefinition.prototype = {

	"catch": function( errorHandler ) {
		var original = this.callback;
		var safeCallback = function() {
			try {
				original.apply( this, arguments );
			} catch ( err ) {
				errorHandler( err, arguments[ 0 ] );
			}
		};
		this.callback = safeCallback;
		return this;
	},

	defer: function defer() {
		return this.delay( 0 );
	},

	disposeAfter: function disposeAfter( maxCalls ) {
		if ( !_.isNumber( maxCalls ) || maxCalls <= 0 ) {
			throw new Error( "The value provided to disposeAfter (maxCalls) must be a number greater than zero." );
		}

		var dispose = _.after( maxCalls, this.unsubscribe.bind( this ) );
		this.pipeline.push( function( data, env, next ) {
			next( data, env );
			dispose();
		} );
		return this;
	},

	distinct: function distinct() {
		return this.constraint( new DistinctPredicate() );
	},

	distinctUntilChanged: function distinctUntilChanged() {
		return this.constraint( new ConsecutiveDistinctPredicate() );
	},

	invokeSubscriber: function invokeSubscriber( data, env ) {
		if ( !this.inactive ) {
			var self = this;
			var pipeline = self.pipeline;
			var len = pipeline.length;
			var context = self._context;
			var idx = -1;
			if ( !len ) {
				self.callback.call( context, data, env );
			} else {
				pipeline = pipeline.concat( [ self.callback ] );
				var step = function step( d, e ) {
					idx += 1;
					if ( idx < len ) {
						pipeline[ idx ].call( context, d, e, step );
					} else {
						self.callback.call( context, d, e );
					}
				};
				step( data, env, 0 );
			}
		}
	},

	logError: function logError() {
		/* istanbul ignore else */
		if ( console ) {
			var report;
			if ( console.warn ) {
				report = console.warn;
			} else {
				report = console.log;
			}
			this.catch( report );
		}
		return this;
	},

	once: function once() {
		return this.disposeAfter( 1 );
	},

	unsubscribe: function() {
		/* istanbul ignore else */
		if ( !this.inactive ) {
			this.emitter.off( this );
		}
	},

	constraint: function constraint( predicate ) {
		if ( !_.isFunction( predicate ) ) {
			throw new Error( "Predicate constraint must be a function" );
		}
		this.pipeline.push( function( data, env, next ) {
			if ( predicate.call( this, data, env ) ) {
				next( data, env );
			}
		} );
		return this;
	},

	constraints: function constraints( predicates ) {
		var self = this;
		/* istanbul ignore else */
		if ( _.isArray( predicates ) ) {
			_.each( predicates, function( predicate ) {
				self.constraint( predicate );
			} );
		}
		return self;
	},

	context: function contextSetter( context ) {
		this._context = context;
		return this;
	},

	debounce: function debounce( milliseconds, immediate ) {
		if ( !_.isNumber( milliseconds ) ) {
			throw new Error( "Milliseconds must be a number" );
		}
		this.pipeline.push(
			_.debounce( function( data, env, next ) {
				next( data, env );
			},
				milliseconds,
				!!immediate
			)
		);
		return this;
	},

	delay: function delay( milliseconds ) {
		if ( !_.isNumber( milliseconds ) ) {
			throw new Error( "Milliseconds must be a number" );
		}
		var self = this;
		self.pipeline.push( function( data, env, next ) {
			setTimeout( function() {
				next( data, env );
			}, milliseconds );
		} );
		return this;
	},

	throttle: function throttle( milliseconds ) {
		if ( !_.isNumber( milliseconds ) ) {
			throw new Error( "Milliseconds must be a number" );
		}
		var fn = function( data, env, next ) {
			next( data, env );
		};
		this.pipeline.push( _.throttle( fn, milliseconds ) );
		return this;
	}
};

SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;
// Backwards Compatibility
// WARNING: these will be removed after the next version
/* istanbul ignore next */
function warnOnDeprecation( oldMethod, newMethod ) {
	return function() {
		if ( console.warn || console.log ) {
			var msg = "Warning, the " + oldMethod + " method has been deprecated. Please use " + newMethod + " instead.";
			if ( console.warn ) {
				console.warn( msg );
			} else {
				console.log( msg );
			}
		}
		return SubscriptionDefinition.prototype[ newMethod ].apply( this, arguments );
	};
}
var oldMethods = [ "withConstraint", "withConstraints", "withContext", "withDebounce", "withDelay", "withThrottle" ];
var newMethods = [ "constraint", "constraints", "context", "debounce", "delay", "throttle" ];
for ( var i = 0; i < 6; i++ ) {
	var oldMethod = oldMethods[ i ];
	SubscriptionDefinition.prototype[ oldMethod ] = warnOnDeprecation( oldMethod, newMethods[ i ] );
}

	
var slice = Array.prototype.slice;
var Monologue = function() {};

function getCacher( topic, cache, done ) {
	return function( subDef ) {
		if ( Monologue.resolver.compare( subDef.topic, topic ) ) {
			cache.push( subDef );
			subDef.cacheKeys.push( topic );
			if ( done ) {
				done( subDef );
			}
		}
	};
}

function getCachePurger( subDef, topic, cache ) {
	return function( sub, i, list ) {
		if ( sub === subDef ) {
			list.splice( i, 1 );
		}
		if ( list.length === 0 ) {
			delete cache[ topic ];
		}
	};
}

function removeSubscriber( subDef, emitter, idx, list ) {
	subDef.inactive = true;
	list.splice( idx, 1 );
	// remove SubscriptionDefinition from cache
	if ( subDef.cacheKeys && subDef.cacheKeys.length ) {
		var key;
		while ( key = subDef.cacheKeys.pop() ) {
			_.each( emitter._cache[ key ], getCachePurger( subDef, key, emitter._cache ) );
		}
	}
}

Monologue.prototype = {
	on: function( topic, callback ) {
		var self = this;
		self._subscriptions = self._subscriptions || {};
		self._subscriptions[ topic ] = self._subscriptions[ topic ] || [];
		var subDef = new SubscriptionDefinition( topic, callback, self );
		self._subscriptions[ topic ].push( subDef );

		// Next, add the SubscriptionDefinition to any relevant existing cache(s)
		_.each( self._cache, function( list, key ) {
			getCacher( key, list )( subDef );
		} );

		return self._subscriptions[ topic ][ self._subscriptions[ topic ].length - 1 ];
	},

	once: function( topic, callback ) {
		return this.on( topic, callback ).once();
	},

	off: function( topic, context ) {
		var self = this;
		self._subscriptions = self._subscriptions || {};
		self._cache = self._cache || {};
		switch ( arguments.length ) {
			case 0:
				_.each( self._subscriptions, function( tpc ) {
					_.each( tpc, function( subDef, idx ) {
						removeSubscriber( subDef, self, idx, tpc );
					} );
				} );
				self._subscriptions = {};
				break;
			case 1:
				var type = Object.prototype.toString.call( topic ) === "[object String]" ? "topic" : topic instanceof SubscriptionDefinition ? "def" : "context";
				switch ( type ) {
					case "topic":
						if ( self._subscriptions[ topic ] ) {
							_.each( self._subscriptions[ topic ], function( subDef, idx ) {
								removeSubscriber( subDef, self, idx, self._subscriptions[ topic ] );
							} );
						}
						break;
					case "context":
						_.each( self._subscriptions, function( subs ) {
							_.each( _.clone( subs ), function( subDef, idx ) {
								if ( subDef._context === topic ) {
									removeSubscriber( subDef, self, idx, subs );
								}
							} );
						} );
						break;
					default:
						// topic arg is the subDef in this case....
						_.each( self._subscriptions[ topic.topic ], function( subDef, idx ) {
							if ( subDef === topic ) {
								removeSubscriber( subDef, self, idx, self._subscriptions[ topic.topic ] );
							}
						} );
						break;
				}
				break;
			default:
				_.each( _.clone( self._subscriptions[ topic ] ), function( subDef, idx ) {
					if ( subDef._context === context ) {
						removeSubscriber( subDef, self, idx, self._subscriptions[ topic ] );
					}
				} );
				break;
		}
	},

	emit: function( topic, data ) {
		var envelope = this.getEnvelope( topic, data );
		this._cache = this._cache || {};
		var cache = this._cache[ topic ];
		var invoker = function( subDef ) {
			subDef.invokeSubscriber( envelope.data, envelope );
		};
		if ( !cache ) {
			cache = this._cache[ topic ] = [];
			var cacherFn = getCacher( topic, cache, invoker );
			_.each( this._subscriptions, function( candidates ) {
				_.each( slice.call( candidates, 0 ), cacherFn );
			} );
		} else {
			_.each( slice.call( cache, 0 ), invoker );
		}
	},

	getEnvelope: function( topic, data ) {
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
riveter( Monologue );
Monologue.mixInto = function( target ) {
	riveter.punch( target, Monologue.prototype );
};

	return Monologue;
} ) );
