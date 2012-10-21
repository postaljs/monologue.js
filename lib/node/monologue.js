var _ = require( 'underscore' );

var Monologue = function () {
	this._subscriptions = {};
	this._yuno = [];
	this._trackErrors = true;
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
			case 0:
				_.each(this._subscriptions, function(topic){
					_.each(topic, function(subDef){
						subDef.unsubscribe();
					});
				});
				this._subscriptions = {};
				break;
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
		var env = this.getEnvelope(topic, data);
		env.topic = topic;
		env.data = data;
		_.each( _.clone(this._subscriptions), function(subDef, subTopic) {
			if( Monologue.resolver.compare(subTopic, topic)) {
				_.each(subDef, function(subscriber){
					if ( _.all( subscriber.constraints, function ( constraint ) {
						return constraint( data, env );
					} ) && ( typeof subscriber.callback === 'function' )) {
						try {
							subscriber.callback.apply( subscriber.context, [data,env] );
						} catch(ex) {
							// do nothing for now other than:
							subscriber.failed = true;
							if(this._trackErrors) {
								this._yuno.push({ def: subscriber, env: env});
							}
						}
					}
				})
			}
		});
	},

	getEnvelope: function(topic, data) {
		return {
			timeStamp: new Date()
		};
	}
} );

Monologue.resolver = bindingsResolver;

module.exports = Monologue;