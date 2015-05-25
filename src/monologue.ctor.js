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

function removeSubscriber( subDef, emitter, idx, list ) {
	subDef.inactive = true;
	list.splice( idx, 1 );
	// remove SubscriptionDefinition from cache
	if ( subDef.cacheKeys && subDef.cacheKeys.length ) {
		var key;
		while (key = subDef.cacheKeys.pop()) {
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
		switch (arguments.length) {
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
				switch (type) {
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
				_.each( Array.prototype.slice.call(candidates,0), cacherFn );
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
