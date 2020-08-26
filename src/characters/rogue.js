import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Rogue extends Character {

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

    if (Utils.distanceFrom(this.target) < 200 && this.canUse("invis")) {
      Utils.l("Go invisible for attack.");
      use_skill("invis");
      this.setCooldown("invis");
    }

    return false;
  }

  async combatFightTick() {
    if (this.canUse("quickpunch")) {
      Utils.l("Attack with quickpunch.");
      use_skill("quickpunch");
      this.setCooldown("quickpunch");
    }

    return true;
  }

}