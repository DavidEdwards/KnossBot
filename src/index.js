import Constants from "./constants";
import Utils from "./utils";
import Game from "./game/game";

const myGame = new Game();

clear_drawings();

Utils.l("Running on a " + Constants.LOOP_SPEED + " MS game tick.");
setInterval(async () => {
  myGame.run();
}, Constants.LOOP_SPEED);