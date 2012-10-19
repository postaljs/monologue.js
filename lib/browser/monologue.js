(function ( root, factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["underscore"], function ( _ ) {
			return factory( _, root );
		} );
	} else {
		// Browser globals
		factory( root._, root );
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
	var SubscriptionDefinition = function ( topic, callback ) {
		this.topic = topic;
		this.callback = callback;
		this.context = null;
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
	
			var fn = this.onHandled;
			var dispose = _.after( maxCalls, _.bind( function () {
				this.unsubscribe();
			}, this ) );
			return this;
		},
	
		once: function() {
			return this.disposeAfter(1);
		}
	});

	var Monologue = function () {
		this._subscriptions = {};
	};
	
	_.extend( Monologue.prototype, {
		on : function ( topic, callback ) {
			var self = this;
			var subDef = new SubscriptionDefinition(topic, callback );
			var subs = self._subscriptions[topic];
			if ( !subs ) {
				subs = self._subscriptions[topic] = [];
			}
			subs.push( subDef );
			subDef.unsubscribe = function() {
				self._subscriptions[topic] = _.without(self._subscriptions[topic], subDef);
			};
			return subDef;
		},
	
		once: function(topic, callback) {
			return this.on(topic, callback ).once();
		},
	
		off : function ( topic, context ) {
			switch(arguments.length) {
				case 1:
					var type = Object.prototype.toString.call(topic) === "[object String]" ? "topic" : topic.hasOwnProperty("unsubscribe") ? "def" : "context";
					switch(type) {
						case 'topic':
							if ( this._subscriptions[topic] ) {
								while(this._subscriptions[topic].length) {
									this._subscriptions[topic].pop().unsubscribe();
								}
							}
							break;
						case 'context':
							var toRemove = [];
							_.each(this._subscriptions, function(subs){
								_.each( _.clone(subs), function(subDef, idx) {
									if(subDef.context === topic) {
										toRemove.push(subDef.unsubscribe());
										subs.splice( idx, 1 );
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
					_.each( _.clone(this._subscriptions[topic]), function(subDef, idx) {
						if(subDef.context === topic) {
							toRemove.push(subDef.unsubscribe());
							this._subscriptions[topic].splice( idx, 1 );
						}
					}, this);
					break;
			}
		},
	
		emit: function( topic, data ) {
			_.each( _.clone(this._subscriptions), function(subDef, subTopic) {
				if( Monologue.resolver.compare(subTopic, topic)) {
					_.each(subDef, function(subscriber){
						if ( typeof subscriber.callback === 'function' ) {
							subscriber.callback.apply( subscriber.context, [data] );
						}
					})
				}
			});
		}
	} );
	
	Monologue.resolver = bindingsResolver;

	global.Monologue = Monologue;
	return Monologue;
} ));