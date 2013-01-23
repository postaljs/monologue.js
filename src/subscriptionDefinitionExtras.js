_.extend(SubscriptionDefinition.prototype, {
  defer : function () {
    var fn = this.callback;
    this.callback = function (data, env) {
      var self = this;
      setTimeout( function() { fn.call(self, data, env); }, 0 );
    };
    return this;
  },

  distinctUntilChanged : function () {
    this.withConstraint( new ConsecutiveDistinctPredicate() );
    return this;
  },

  distinct : function () {
    this.withConstraint( new DistinctPredicate() );
    return this;
  },

  withConstraint : function ( predicate ) {
    if ( !_.isFunction( predicate ) ) {
      throw "Predicate constraint must be a function";
    }
    this.constraints.push( predicate );
    return this;
  },

  withConstraints : function ( predicates ) {
    var self = this;
    if ( _.isArray( predicates ) ) {
      _.each( predicates, function ( predicate ) {
        self.withConstraint( predicate );
      } );
    }
    return self;
  },

  withDebounce : function ( milliseconds ) {
    if ( _.isNaN( milliseconds ) ) {
      throw "Milliseconds must be a number";
    }
    var fn = this.callback;
    this.callback = _.debounce( fn, milliseconds );
    return this;
  },

  withDelay : function ( milliseconds ) {
    if ( _.isNaN( milliseconds ) ) {
      throw "Milliseconds must be a number";
    }
    var fn = this.callback;
    this.callback = function ( data ) {
      setTimeout( function () {
        fn( data );
      }, milliseconds );
    };
    return this;
  },

  withThrottle : function ( milliseconds ) {
    if ( _.isNaN( milliseconds ) ) {
      throw "Milliseconds must be a number";
    }
    var fn = this.callback;
    this.callback = _.throttle( fn, milliseconds );
    return this;
  }
});