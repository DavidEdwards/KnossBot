import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Priest extends Character {

  constructor() {
    super();

    this.HEAL_THRESHOLD = 0.95;
    this.PARTY_HEAL_THRESHOLD = 0.5;
  }

  async tick() {}

  async findHealingTarget() {
    let partyMembers = await Lists.getPartyMembers()
      .then(members => Sorting.sortByLowestHealth(members));

    partyMembers.forEach((item, i) => {
      if (!item) return;

      if (!item.rip && item.hp < (item.max_hp * this.PARTY_HEAL_THRESHOLD)) {
        if (this.canUse("partyheal")) {
          this.setState("PARTY HEALING");
          Utils.l("Danger! Heal party!");
          use_skill("partyheal");
          this.setCooldown("partyheal");
        }
      }

      if (can_heal(item) && !item.rip && item.hp < (item.max_hp * this.HEAL_THRESHOLD)) {
        this.setState("HEALING");
        Utils.l("Heal party member " + item.id);
        heal(item);
        this.setCooldown("heal");
      }

      if (item.rip) {
        if (this.canUse("revive")) {
          this.setState("REVIVING");
          Utils.l("Member dead. Revive!");
          use("revive", item);
          this.setCooldown("revive");
        }
      }

    });
  }

  async keepDistanceToCaller() {
    return true;
  }

  async preCombatTick() {
    this.findHealingTarget();

    let inDanger = await Lists.getPartyMembers()
      .then(members => Filters.isAMemberBelow(members, 0.7));

    return !inDanger;
  }

  async combatApproachTick() {
    if (!this.ATTACKING || !this.PRIEST_ATTACKING) return false;
    if (!this.target) return false;
    return false;
  }

  async combatFightTick() {
    if (this.canUse("curse") && this.isMpHigher(0.7)) {
      this.setState("CURSING");
      Utils.l("Attack with curse.");
      use_skill("curse");
      this.setCooldown("curse");
    }

    return true;
  }

}