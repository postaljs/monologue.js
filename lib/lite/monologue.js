/*
 monologue.js
 Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
 Version 0.1.4
 */
(function ( root, factory ) {
	if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = function(_, riveter) {
			return factory( _, riveter );
		}
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["underscore", "riveter"], function ( _, riveter ) {
			return factory( _, root );
		} );
	} else {
		// Browser globals
		root.Monologue = factory( root._, root.riveter, root );
	}
}( this, function ( _, riveter, global, undefined ) {
  var bindingsResolver = {
    cache : { },
  
    compare : function ( binding, topic ) {
      if ( this.cache[topic] && this.cache[topic][binding] ) {
        return true;
      }
      var pattern = ("^" + binding.replace( /\./g, "\\." ) // escape actual periods
        .replace( /\*/g, "[A-Z,a-z,0-9]*" )                // asterisks match any alpha-numeric 'word'
        .replace( /#/g, ".*" ) + "$")                      // hash matches 'n' # of words (+ optional on start/end of topic)
        .replace( "\\..*$", "(\\..*)*$" )                  // fix end of topic matching on hash wildcards
        .replace( "^.*\\.", "^(.*\\.)*" );                 // fix beginning of topic matching on hash wildcards
      var rgx = new RegExp( pattern );
      var result = rgx.test( topic );
      if ( result ) {
        this.cache[topic] = this.cache[topic] || {};
        this.cache[topic][binding] = true;
      }
      return result;
    },
  
    reset : function () {
      this.cache = {};
    }
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
  
    unsubscribe : function () {
      this.emitter._subscriptions[this.topic] = _.without(this.emitter._subscriptions[this.topic], this);
    },
  
    disposeAfter : function ( maxCalls ) {
      if ( _.isNaN( maxCalls ) || maxCalls <= 0 ) {
        throw "The value provided to disposeAfter (maxCalls) must be a number greater than zero.";
      }
      var self = this;
      var dispose = _.after( maxCalls, function () {
        self.unsubscribe();
      });
  
      var fn = self.callback;
      self.callback = function() {
        fn.apply(self.context, arguments);
        dispose();
      };
  
      return self;
    },
  
    once: function() {
      return this.disposeAfter(1);
    }
  });
  
  SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;
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
      self._subscriptions = self._subscriptions || {};
      self._subscriptions[topic] = self._subscriptions[topic] || [];
      self._subscriptions[topic].push( new SubscriptionDefinition( topic, callback, self ) );
  		return self._subscriptions[topic][self._subscriptions[topic].length - 1];
  	},
  
  	once : function ( topic, callback ) {
  		return this.on( topic, callback ).once();
  	},
  
  	off : function ( topic, context ) {
      this._subscriptions = this._subscriptions || {};
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
  						_.each( this._subscriptions, function ( subs ) {
  							_.each( _.clone( subs ), function ( subDef, idx ) {
  								if ( subDef.context === topic ) {
  									subDef.unsubscribe();
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
  					if ( subDef.context === context ) {
  						subDef.unsubscribe();
  						this._subscriptions[topic].splice( idx, 1 );
  					}
  				}, this );
  				break;
  		}
  	},
  
  	emit : function ( topic, data ) {
  		var envelope = this.getEnvelope( topic, data );
      this._subscriptions = this._subscriptions || {};
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
  riveter( Monologue );
	return Monologue;
} ));