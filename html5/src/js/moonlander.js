//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

var hmi = new Hmi();

function submitBurnRate() {
  hmi.submitBurnRate();
  return false;
}

function restart() {
  hmi = new Hmi();
  return false;
}

$('#new').click(restart);
