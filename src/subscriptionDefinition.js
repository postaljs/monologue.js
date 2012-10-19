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