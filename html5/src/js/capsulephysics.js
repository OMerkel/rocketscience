//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

function Capsule( state ) {
  this.gravitationalAcceleration = 1.622; // Moon, meter per square second
  /*
   * Gravity is relative to the height of an object. With the given altitude
   * range it is quite clear that this simulation is enormously simplifying
   * this aspect.
   */
  this.state = {
    altitude: state.altitude, // meter
    velocity: state.velocity, // meter per second
    massFuel: state.massFuel, // lb
    massCapsuleEmpty: state.massCapsuleEmpty // lb
  };
}

Capsule.prototype.getMassTotal = function() {
  return this.state.massCapsuleEmpty + this.state.massFuel;
}

Capsule.prototype.iterate = function( burnRate, durationFullIteration ) {
  var durationEngineBurning = this.getDurationEngineBurning(
    durationFullIteration, burnRate);
  var durationMovement = durationFullIteration;

  var altitude = this.renderAltitude(burnRate,
    durationEngineBurning, durationMovement);
  if ( altitude<0 ) {
    var durationExact = 0;
    var durationEngineBurnExact = 0;
    var timeStep = durationFullIteration / 10000.0; // refine coarse sample rate
    do {
      durationExact += timeStep;
      durationEngineBurnExact = durationEngineBurning < durationExact ?
        durationEngineBurning : durationExact;
      altitude = this.renderAltitude(burnRate,
        durationEngineBurnExact, durationExact);
      /*var tmpVelocity = this.renderVelocity(burnRate,
        durationEngineBurnExact, durationExact);
      console.log('tmpVelocity : ' + tmpVelocity + ' ' + durationExact);
      */
    } while (altitude > 0);
    durationMovement = durationExact;
    durationEngineBurning = durationEngineBurnExact;
    altitude = 0;
  }
  var velocity = this.renderVelocity(burnRate,
    durationEngineBurning, durationMovement);
  var massFuel = this.renderMassFuel(burnRate, durationEngineBurning);

  this.state.altitude = altitude;
  this.state.velocity = velocity;
  this.state.massFuel = massFuel;

  return durationMovement;
};

Capsule.prototype.getDurationEngineBurning = function(durationFullIteration, burnRate) {
  var durationEngineBurning = this.state.massFuel >= durationFullIteration * burnRate ?
    durationFullIteration : this.state.massFuel / burnRate;
  /*
  var message = 0 == burnRate ? 'Going into free fall with burn rate zero.' :
    0 == this.state.massFuel ? 'Going into free fall since out of fuel.' :
    'Burn rate is ' + burnRate + ' lb fuel per second intended for the following ' +
      durationEngineBurning + ' seconds.';
  console.log(message);
  */
  return durationEngineBurning;
};

Capsule.prototype.renderMassFuel = function(burnRate, durationEngineBurning) {
  var fuel = this.state.massFuel - burnRate * durationEngineBurning;
  // console.log('Current fuel level is ' + fuel + ' lb.');
  return fuel;
};

Capsule.prototype.renderVelocity = function(burnRate,
  durationEngineBurning, durationMovement) {
  var velocityStartIteration = this.state.velocity;
  var massChangeRatio = burnRate * durationEngineBurning / this.getMassTotal();
  var velocityChangeEnvironment = this.gravitationalAcceleration * durationMovement;

  // mind: Math.log() has base Math.E, Math.log(Math.E) is 1
  var velocityChangeTechnical = 3000 * Math.log(1-massChangeRatio);
  var velocity = velocityStartIteration +
    velocityChangeEnvironment + velocityChangeTechnical;

  // console.log('Current velocity is ' + velocity + ' meter per second.');
  return velocity;
};

Capsule.prototype.renderAltitude = function(burnRate,
  durationEngineBurning, durationMovement) {
  var altitudeStartIteration = this.state.altitude;
  var velocityStartIteration = this.state.velocity;
  var massChangeRatio = burnRate * durationEngineBurning / this.getMassTotal();
  var altitudeChangeEnvironment = -velocityStartIteration * durationMovement -
    this.gravitationalAcceleration * durationMovement * durationMovement / 2;

  // mind: Math.log() has base Math.E, Math.log(Math.E) is 1
  /*
   * note: altitudeChangeTechnical is integral of velocityChangeTechnical over
   * massChangeRatio rather than by time here. This is assumed to be quite inaccurate
   * since massChangeRatio depends on time and massFuel changing over time as
   * well. Still this kind of model generates acceptable behavior for the user.
   */
  var altitudeChangeTechnical = 3000 *
    ( -massChangeRatio - Math.log(1-massChangeRatio) * (1-massChangeRatio));
  // console.log( altitudeChangeEnvironment + " / " + altitudeChangeTechnical );
  var altitude = altitudeStartIteration +
    altitudeChangeEnvironment + altitudeChangeTechnical;

  // console.log('Current altitude is ' + altitude + ' meter.');
  return altitude;
};
