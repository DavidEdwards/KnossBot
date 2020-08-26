import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Ranger extends Character {

  constructor() {
    super();
  }

  async tick() {}

  async preCombatTick() {
    return true;
  }

  async combatApproachTick() {
    if (!this.ATTACKING) return false;
    if (!this.target) return false;



    return false;
  }

  async combatFightTick() {


    return true;
  }

}
