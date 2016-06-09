//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

function Hmi() {}

Hmi.prototype.init = function() {
  this.initialize();
  $('#new').click( this.restart.bind(this) );
  $('#submitburnrate').click( this.submitBurnRate.bind(this) );
  $('#decreaseburnrate').click( this.decreaseBurnRate.bind(this) );
  $('#increaseburnrate').click( this.increaseBurnRate.bind(this) );
  var $window = $(window);
  $window.resize( this.resize.bind( this ) );
  $window.resize();
}

Hmi.prototype.initialize = function() {
  this.lander = new Capsule({
    altitude: 106216.705, // meter (66 miles lunar orbit)
    velocity: 0, // meter per second
    massFuel: 16000, // lb
    massCapsuleEmpty: 16500 // lb
  });
  this.time = 0.0; // in seconds (simulated)
  this.duration = 10.0; // in seconds (simulated)
  this.elementFuel = document.getElementById('fuel');
  this.elementTime = document.getElementById('time');
  this.elementVelocity = document.getElementById('speed');
  this.elementAltitudeCoarse = document.getElementById('altitudecoarse');
  this.elementAltitudeFine = document.getElementById('altitudefine');
  this.elementInfo = document.getElementById('info');
  this.message = { validinput : 'Please enter an integer numerical value between ' +
      '0 and 200 for the burn rate intended to be kept for the next ' +
      this.duration + ' seconds!',
    initial : 'Lunar orbit circularization maneuver has been performed to place the ' +
      'spacecraft in a 66.1- by 54.4-mile orbit already. After the exterior of the ' +
      'lunar module has been inspected from the command module, a separation ' +
      'maneuver was performed with the service module reaction control system. ' +
      'Undocking the lunar module on time. Performing descent orbit insertion maneuver ' +
      'now. Good luck! Now it is your turn. ' };
  this.update(this.message.initial + this.message.validinput);
  this.elementInputBurnRate = document.getElementById('burnrate');
};

Hmi.prototype.adaptBurnRate = function( delta ) {
  var previous = this.elementInputBurnRate.value;
  var burnRate = Math.round(Number(previous)) + delta;
  burnRate = burnRate > 200 ? 200 : burnRate < 0 ? 0 : burnRate;
  var sameValue = ('' + burnRate) == ('' + previous);
  if ( !sameValue ) {
    this.elementInputBurnRate.value = burnRate;
  }
  return { sameValue: sameValue,
    previousValue: '' + previous, newValue: '' + burnRate };
};

Hmi.prototype.decreaseBurnRate = function() {
  this.adaptBurnRate( -1 );
};

Hmi.prototype.increaseBurnRate = function() {
  this.adaptBurnRate( 1 );
};

Hmi.prototype.submitBurnRate = function() {
  var result = true;
  var ret = this.adaptBurnRate( 0 );
  if (this.lander.state.altitude > 0) {
    var burnRate = Number(this.elementInputBurnRate.value);
    if ( ret.sameValue && 0 <= burnRate && burnRate <= 200) {
      var granularity=1000; // amount of simulated coarse samples per turn
      for(var i=0; i<granularity; ++i) {
        var simulatedTime = this.lander.iterate(burnRate,
          this.duration / granularity);
        this.time += simulatedTime;
      }
      this.update( '' );
    }
    else {
      var msg = 'Adapted your invalid entry. Value changed to \'' +
        ret.newValue + '\' without any further action. ' + this.message.validinput
      this.update( msg );
      result = false;
    }
  }
  return result;
};

Hmi.prototype.update = function( message ) {
  var fuel = this.lander.state.massFuel;
  this.elementFuel.innerHTML = fuel.toFixed(2);
  if (0 == fuel) {
    this.elementInputBurnRate.value = '0';
  }
  this.elementTime.innerHTML = this.time.toFixed(3);
  var velocity = Math.round(2.23693629 *
    this.lander.state.velocity); // convert meter per second into mph
  this.elementVelocity.innerHTML = velocity;
  var altitude = this.renderAltitudeInMiles();
  this.elementAltitudeCoarse.innerHTML = altitude[0];
  this.elementAltitudeFine.innerHTML = altitude[1];
  this.updateMessage(message, fuel, velocity, altitude);
};

Hmi.prototype.updateMessage = function( message, fuel, velocity, altitude ) {
  var information = message;
  if (0 == fuel) {
    information = 'You are out of fuel. ' + information;
  }
  if (0 == altitude[0] && 0 == altitude[1]) {
    if (velocity < 4) {
      information = 'Congratulation on a perfect and soft landing.';
    }
    else if (velocity < 12) {
      information = 'This has been a good landing.';
    }
    else if (velocity < 50) {
      information = 'The harsh landing slightly damaged the landing capsule.';
    }
    else {
      information = 'You completely crashed the landing capsule and blew up a crater ' +
        Math.round(0.2 * velocity + 0.1 * fuel) + ' feet deep.';
    }
  }
  this.elementInfo.innerHTML = information;
};

Hmi.prototype.renderAltitudeInMiles = function() {
  var altitude = this.lander.state.altitude * 0.000621371192; // convert meter into miles
  var altitudeMiles = Math.floor(altitude);
  return [ altitudeMiles, Math.floor((altitude - altitudeMiles) * 5280) ];
};

Hmi.prototype.restart = function () {
  this.initialize();
  $( '#left-panel' ).panel( 'close' );
  return false;
}

Hmi.prototype.resize = function () {
  var innerHeight = window.innerHeight,
      innerWidth = window.innerWidth;
  $('.gnuPlot').css({ 'max-height': 0.75 * innerHeight });
  $('#whiteboard').css({ 'max-height': 0.5 * innerHeight, 'max-width': 0.33 * innerWidth });
};

$( (new Hmi()).init() );
