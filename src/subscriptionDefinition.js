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
