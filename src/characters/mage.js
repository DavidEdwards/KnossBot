import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Mage extends Character {

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
    if (this.isMpHigher(0.5)) {
      if (this.canUse("burst")) {
        Utils.l("Bursting " + this.target.mtype + "(" + this.target.id + ") (atk: " + this.target.attack + ", hp: " + this.target.hp + ", target: " + this.target.target + ")");
        use_skill("burst", this.target);
        this.setCooldown("burst");
      }
    }

    return true;
  }

}