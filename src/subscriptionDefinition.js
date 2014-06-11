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