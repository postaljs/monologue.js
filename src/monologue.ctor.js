/*global SubscriptionDefinition,bindingsResolver,riveter */

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

function removeSubscriber( subDef, emitter ) {
	subDef.unsubscribe();
	// remove SubscriptionDefinition from cache
	if ( subDef.cacheKeys && subDef.cacheKeys.length ) {
		var key;
		while (key = subDef.cacheKeys.pop()) {
			_.each( emitter.cache[ key ], getCachePurger( subDef, key, emitter.cache ) );
		}
	}
}

Monologue.prototype = {
	on: function( topic, callback ) {
		var self = this;
		self._subscriptions = self._subscriptions || {};
		self._subscriptions[ topic ] = self._subscriptions[ topic ] || [];
		self._subscriptions[ topic ].push( new SubscriptionDefinition( topic, callback, self ) );

		// Next, add the SubscriptionDefinition to any relevant existing cache(s)
		_.each( this.cache, function( list, cacheKey ) {
			if ( cacheKey === topic ) {
				getCacher( topic, list )( subDef );
			}
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
		switch (arguments.length) {
			case 0:
				_.each( self._subscriptions, function( topic ) {
					_.each( topic, function( subDef ) {
						removeSubscriber( subDef );
					} );
				} );
				self._subscriptions = {};
				break;
			case 1:
				var type = Object.prototype.toString.call( topic ) === "[object String]" ? "topic" : topic instanceof SubscriptionDefinition ? "def" : "context";
				switch (type) {
					case "topic":
						if ( self._subscriptions[ topic ] ) {
							while (self._subscriptions[ topic ].length) {
								removeSubscriber( self._subscriptions[ topic ].pop() );
							}
						}
						break;
					case "context":
						_.each( self._subscriptions, function( subs ) {
							_.each( _.clone( subs ), function( subDef, idx ) {
								if ( subDef._context === topic ) {
									removeSubscriber( subDef );
									subs.splice( idx, 1 );
								}
							} );
						} );
						break;
					default:
						removeSubscriber( topic );
						break;
				}
				break;
			default:
				_.each( _.clone( self._subscriptions[ topic ] ), function( subDef, idx ) {
					if ( subDef._context === context ) {
						removeSubscriber( subDef );
						self._subscriptions[ topic ].splice( idx, 1 );
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
				_.each( candidates, cacherFn );
			} );
		} else {
			_.each( cache, invoker );
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
