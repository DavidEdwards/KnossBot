import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Warrior extends Character {

  constructor() {
    super();
  }

  async tick() {}

  async preCombatTick() {
    let partyMembers = await Lists.getPartyMembers()
      .then(members => Filters.membersNotMe(members));

    let dangerTargets = await Lists.getMonsters()
      .then(monsters => Filters.filterByTargetting(monsters, partyMembers.map(member => member.id)))
      .then(monsters => Sorting.sortMonstersByDanger(monsters));

    if (dangerTargets.length > 0) {
      let dangerTarget = await Filters.first(dangerTargets);
      if (dangerTarget) {
        Utils.l("Danger found: " + dangerTarget.mtype + "(" + dangerTarget.id + ") (atk: " + dangerTarget.attack + ", hp: " + dangerTarget.hp + ", target: " + dangerTarget.target + ")");

        let randomTarget = await Filters.random(dangerTargets);
        if (this.canUse("taunt")) {
          Utils.l("Taunting " + dangerTarget.mtype + "(" + dangerTarget.id + ") (atk: " + dangerTarget.attack + ", hp: " + dangerTarget.hp + ", target: " + dangerTarget.target + ")");
          use_skill("taunt", randomTarget);
          this.setCooldown("taunt");
        }
      }
    }

    return true;
  }

  async combatApproachTick() {
    if (this.canUse("charge")) {
      Utils.l("Go charge for attack.");
      use_skill("charge");
      this.setCooldown("charge");
    }
    return true;
  }

  async combatFightTick() {
    return true;
  }

}