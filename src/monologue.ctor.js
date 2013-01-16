var fireSub = function(subscriber, envelope) {
  if ( Monologue.resolver.compare( subscriber.topic, envelope.topic ) ) {
    if ( _.all( subscriber.constraints, function ( constraint ) {
      return constraint( envelope.data, envelope );
    } ) && ( typeof subscriber.callback === 'function' ) ) {
      try {
        subscriber.callback.apply( subscriber.context, [envelope.data, envelope] );
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
          this._yuno.push( { def : subscriber, env : envelope, exception : ex} );
        }
      }
    }
  }
};

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
		var envelope = this.getEnvelope( topic, data );
		if ( !this._subscriptions ) {
			this._subscriptions = {};
		}
    _.each( this._subscriptions, function ( subscribers ) {
      var idx = 0, len = subscribers.length, subDef;
      while(idx < len) {
        if( subDef = subscribers[idx++] ){
          fireSub.call(this, subDef, envelope);
        }
      }
    }, this);
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
