//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

function Hmi() {
  this.lander = new Capsule(
      106216.705, // meter (66 miles lunar orbit)
      0, // meter per second
      16000, // lb
      16500 // lb
    );
  this.initialize();
}

Hmi.prototype.initialize = function() {
  this.time = 0.0; // in seconds (simulated)
  this.duration = 10.0; // in seconds (simulated)
  this.elementFuel = document.getElementById('fuel');
  this.elementTime = document.getElementById('time');
  this.elementVelocity = document.getElementById('speed');
  this.elementAltitudeCoarse = document.getElementById('altitudecoarse');
  this.elementAltitudeFine = document.getElementById('altitudefine');
  this.elementInfo = document.getElementById('info');
  this.message = { 'validinput': 'Please enter an integer numerical value between ' +
    '0 and 200 for the burn rate intended to be kept for the next ' +
    this.duration + ' seconds!',
    'initial' : 'Lunar orbit circularization maneuver has been performed to place the ' +
    'spacecraft in a 66.1- by 54.4-mile orbit already. After the exterior of the ' +
    'lunar module has been inspected from the command module, a separation ' +
    'maneuver was performed with the service module reaction control system. ' +
    'Undocking the lunar module on time. Performing descent orbit insertion maneuver ' +
    'now. Good luck! Now it is your turn. ' };
  this.regexpPattern = [ /^(\d|[1-9]\d|1\d\d|200)$/ ,
                         /^(0|[1-9]\d*)$/ ];
  this.update(this.message['initial'] + this.message['validinput']);
  this.elementInputBurnRate = document.getElementById('burnrate');
  this.elementInputSubmitBurnRate = document.getElementById('submitburnrate');
  this.elementInputSubmitBurnRate.onclick = submitBurnRate;
};

Hmi.prototype.submitBurnRate = function() {
  var result = true;
  if (this.lander.state[this.lander.ALTITUDE] > 0) {
    var burnRate = this.elementInputBurnRate.value;
    if (burnRate.match(this.regexpPattern[0])) {
      var granularity=1000; // amount of simulated coarse samples per turn
      for(var i=0; i<granularity; ++i) {
        var simulatedTime = this.lander.iterate(burnRate,
          this.duration / granularity);
        this.time += simulatedTime;
      }
      this.update('');
    }
    else {
      this.update(this.message['validinput']);
      result = false;
    }
  }
  return result;
};

Hmi.prototype.update = function(message) {
  var fuel = this.lander.state[this.lander.MASSFUEL];
  this.elementFuel.innerHTML = fuel.toFixed(2);
  if (0 == fuel) {
    this.elementInputBurnRate.value = '0';
  }
  this.elementTime.innerHTML = this.time.toFixed(3);
  var velocity = Math.round(2.23693629 *
    this.lander.state[this.lander.VELOCITY]); // convert meter per second into mph
  this.elementVelocity.innerHTML = velocity;
  var altitude = this.renderAltitudeInMiles();
  this.elementAltitudeCoarse.innerHTML = altitude[0];
  this.elementAltitudeFine.innerHTML = altitude[1];
  this.updateMessage(message, fuel, velocity, altitude);
};

Hmi.prototype.updateMessage = function(message, fuel, velocity, altitude) {
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
  var altitude = this.lander.state[this.lander.ALTITUDE] * 0.000621371192; // convert meter into miles
  var altitudeMiles = Math.floor(altitude);
  return [ altitudeMiles, Math.floor((altitude - altitudeMiles) * 5280) ];
};
