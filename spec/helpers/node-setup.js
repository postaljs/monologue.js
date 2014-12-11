// Setup for running Mocha via Node
require( "should/should" );
require( "traceur" );

global._ = require( "lodash" );
global.riveter = require( "riveter" );
global.Monologue = require( "../../lib/monologue.js" );
