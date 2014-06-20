# monologue.js

### What is it?
monologue provides 'event-emitting' functionality - commonly referred to as "pub/sub" - that can be mixed into/inherited by your JavaScript objects.

##### Philosophy
monologue's pub/sub implementation uses the observer pattern - meaning that subscribers should have a direct reference to the 'monologue-ized' object emitting the events.  This is in contrast to monologue's sister library, [postal.js](https://github.com/postaljs/postal.js), which uses the mediator pattern to relieve publishers and subscribers from the need to have a direct reference to each other.  Putting a monologue instance in the prototype chain of an object turns  it into an "event emitter". This is incredibly useful in organizing how other *local* (within a limited scope/module) instances are notified of something the object wants to publish. monologue is designed to be bridged with [postal.js](https://github.com/postaljs/postal.js) if you want to 'promote' an event into an app-level message - and the [monopost](https://github.com/postaljs/monopost.js) add-on exists to do just that.

##### Really? Another Event Emitter?
I know, right?!  There are a number of EventEmitter implementations that are very useful (and compact) - my favorite of which is [EventEmitter2](https://github.com/hij1nx/EventEmitter2). So why did I write monologue? Three main reasons:

* **I wanted postal/AMQP-like wildcard binding semantics.**  The "*" wildcard matches exactly one word in a topic, while the "#" wildcard matches 0-n words.
* **I prefer an "envelope" payload in an event vs passing 0-n arguments to a subscriber callback.**  This means we get a consistent callback signature everywhere. Consistency causes kittens to turn into angels and get their wings.
* **I wanted safe invocation of subscriber callbacks.** Most Event Emitter style implementations (that I've seen) blindly fire the subscriber callback - and if the callback throws an uncaught exception, the entire event-emit breaks. "But won't a try/catch slow things down?" Yes, there is a performance hit. I've asked myself these two questions: How many times has an event emitter been the bottleneck in my app? And how many times has a subscriber callback been guilty of tanking the app? In my experience, the latter happens **far more often** than the former. 

### Why should I use it?
If you want to extend your objects with the ability to trigger custom events, take advantage of the wildcard binding options, trust that subscriber callbacks can't tank the emitter while it's triggering events, and/or have consistent callback signatures, then monologue might be for you.

### How do I use it?
##### Adding monologue functionality to an instance

You can use the `mixInto` helper function, which mixes Monologue into the prototype of your object:

	var Worker = function(name) {
	    this.name = name;
	};
	Worker.prototype.doWork = function() {
	    this.emit("work.done", { who: this.name });
	};
	Monologue.mixInto(Worker);


You can also manually put a monologue instance in the prototype chain of an object:

	var Worker = function(name) {
	    this.name = name;
	};
	Worker.prototype = Monologue.prototype;
	Worker.prototype.doWork = function() {
	    this.emit("work.done", { who: this.name });
	};

An alternative approach would be to 'mix-in' to an existing instance via a helper like [lodash's](http://lodash.com/) [assign](http://lodash.com/docs#assign) call:

	_.assign(
	    plainJane,
	    {
	        doWork: function() {
	            this.emit("work.done", { who: this.name });
	        }
	    },
	    Monologue.prototype);

monologue uses [riveter](https://github.com/ifandelse/riveter) for it's inheritance/mixin capabilities. There's a *lot* you can do with riveter, so check it out.

#####Adding an event listener
Any object that has monologue's behavior has an `on` method which can be used to subscribe to events.  The first argument of `on()` is the `topic` (just a string event name, which can optionally be a period-delimited string for hierarchical use).  The second argument of `on()` is the `callback` which should be invoked when the event occurs. Calling `on` returns a `SubscriptionDefinition` - giving you a convenient way to unsubscribe or apply additional options (discussed below) to the subscription.

	var instance = new Worker(); // get an instance of something that has monologue's behavior

	// subscribe to listen for 'some.event'
	var subscription = instance.on("some.event", function(data, envelope){
	    console.log("Something happened thanks to " + data.name);
	});

As you can see in the example above, the subscription callback takes two arguments: `data` and `envelope`.  Like many facets of monologue, this matches the behavior of postal.js.  The `data`
argument is simply the data published when the event was emitted.  The `envelope` provides additional metadata about the event, and can be customized to fit your needs.  By default, the envelope has three members: `data`, `topic` and `timeStamp`.  For example:

	// pretending we're inside of a monologue-ized object:
	this.emit("some.event", { foo: 'bar', baz: 'bacon' });

	// pretending we're somewhere else setting up the subscriber:
	var subscription = instance.on("some.event", function(data, envelope){
		/* 
		  data would look like:
			{
				foo: 'bar',
				baz: 'bacon'
			}
			
		  envelope would look like:
		  	{
		  		topic: 'some.event',
		  		timeStamp: '2012-10-21T02:53:10.287Z',
		  	    data: {
					foo: 'bar',
					baz: 'bacon'
				}
			}
		*/    
	});	

#####Wildcard Subscriptions
As mentioned above, the `*` and `#` characters represent wildcards available when you subscribe to events. Topics are string values, and are often period-delimited. The part of the topic delimited by a period is called a 'word'. Using a `*` represents exactly one word in a topic, while the `#` character matches 0-n words.  For example:

	// The topic binding below will match "name.changed" and "city.changed"
	// but it will not match "changed" or "user.location.changed"
	var subscription = instance.on("*.changed", function(data, envelope){
		// handle event data here….
	});

	// The topic binding below will match "name.changed", "city.changed"
	// "changed" and "user.location.changed"
	var subscription = instance.on("#.changed", function(data, envelope){
		// handle event data here….
	});

	// Also - you can use the wildcards together:
	// this binding will match user.email.validation.failed, user.zip.validation.success
	// as well as password.validation.success, but NOT customer.order.validation.retry.cancel
	var subscription = instance.on("#.validation.*", function(data, envelope){
		// handle event data here….
	});

#####Unsubscribing
You have four possible ways to remove event listeners in monologue:

######Removing a specific listener
When you use `on` to subscribe to an event, it returns a `SubscriptionDefinition` object. This object contains several helper methods, one of which is `unsubscribe`:

	var subscription = instance.on("#.changed", function(data, envelope){
		// handle event data here….
	});

	subscription.unsubscribe();

######Removing all listeners for a topic
However, you can also call the `off` method on the monlogue-ized event emitter object:

	var subscription = instance.on("#.changed", function(data, envelope){
		// handle event data here….
	});

	// remove just this one subscription
	instance.off(subscription);

	// remove all subscriptions for a topic
	instance.off("#.changed");

######Removing all listeners for a topic/context combination
One of the SubscriptionDefinition helper methods is `withContext` - which allows you to specifiy the `this` context you want to apply to the subscription callback when it is invoked. Because of this, it's possible to remove all listeners for a specific topic that are using a particular 'context':

	var subscription = instance.on("#.changed", function(data, envelope){
		// handle event data here….
	}).withContext(someObject);

	// remove just this one subscription
	instance.off(subscription);

	// remove all subscriptions for the topic + context combination
	instance.off("#.changed", someObject);

######Removing ALL listeners, period.
This is the 'nuke it from orbit' option. Simply call `off` with no arguments, and all subscriptions will be removed from the object.

	var subscriptionA = instance.on("#.changed", function(data, envelope){
		// handle event data here….
	}).withContext(someObject);

	var subscriptionB = instance.on("*.moar", function(data, envelope){
		// handle event data here….
	}).withContext(someOtherObject);

	// buh-bye all subscriptions...
	instance.off();

#####Subscription Options
As mentioned above - the `SubscriptionDefinition` object returned from a call to the `on` method provides some additional fluent configuration options:

* **`withContext(object)`** - the provided argument becomes the `this` context inside the subscription callback.
* **`defer`** - delays the invocation of the callback until the event loop is free (via setTimeout of 0 milliseconds).
* **`disposeAfter(count)`** - automatically unsubscribes the subscription after the number of invocations specified.
* **`once`** - a shortcut to disposeAfter(1).
* **`distinctUntilChanged`** - keeps track of the last data published with an event and only invokes the callback if the new data differs from the old data.
* **`distnct`** - keeps track of the data published with an event and only invokes the callback if it's different from anything published previously.
* **`withConstraint(predicateFn)`** - the predicateFn argument is a function with the same signature as the subscriber callback (data,envelope).  Returning true from this function will cause the subscription callback to be invoked, returning false will prevent it from firing.
* **`withConstraints([predicateFns])`** - same as `withConstraint`, but it takes an array of predicates instead of one.
* **`withDebounce(milliseconds)`** - uses underscore's debounce function to cause the subscription callback to only be invoked a minimum of {x} milliseconds after the events cease being published.
* **`withDelay(milliseconds)`** - delays invocation of the subscriber callback for the number of milliseconds specified.
* **`withThrottle(milliseconds)`** - causes the subscriber callback to be invoked at most once per {x} milliseconds interval.

#####Other Monologue Options
######Customizing the Envelope
Any object that has been extended with Monologue's behavior will have a `getEnvelope` method which you can override to customize how the envelope is created. The default implementation looks like this:

	
	// The default implementation just marks the envelope with a time stamp.
	// The topic and data are attached to the envelope just before it's published
	getEnvelope: function(topic, data) {
		return {
			timeStamp: new Date()
		};
	}


Note that the topic and data being published are passed in for optional use - allowing you to configure envelope data at run time, based on the event in progress.

######Error Tracking
One of the core features of monologue is that subscriber callbacks won't be able to crash the event emitter with uncaught exceptions. While developers **should** be cleaning up after themselves (and not crashing things with uncaught exceptions), they don't always do so. We don't want to simply swallow those exceptions, so by default monologue will store them in an aptly named `_yuno` member - which is an array of objects, where each object contains the subscription definition instance that threw the uncaught exception, as well as the envelope being published at the time of the event.  You can turn error tracking off by setting the `_trackErrors` member to `false`:



	var Worker = function(name) {
	    this.name = name;
	};
	Worker.prototype = Monologue.prototype;
	var instance = new Worker();
	instance._trackErrors = false;


#####Customizing Wildcard Bindings
Just like it's sister library postal.js, monologue's bindingsResolver object can be overridden with your own implementation. Don't like how AMQP's wildcards work? Want to create something that uses different characters, or logic in matching topics? All you have to do is create an object that implements a `compare(binding, topic)` method (where `binding` is the topic value used when a subscriber was added and `topic` is the actual topic of the event being published).  This function should return true for a match, or false otherwise.  Simply create your own resolver and replace the existing resolver with your own:


	Monologue.resolver = {
	    compare: function(binding, topic) {
	         // The magic happens here….
	    }
	}


