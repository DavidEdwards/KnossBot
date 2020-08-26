import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";
import Locations from "../game/locations";
import Inventory from "../game/inventory/inventory";

window.on_party_request = function(name) {
  Utils.l("Party request from " + name);
  Constants.ALLOWED_PARTY_STARTERS.forEach((regex, i) => {
    if (name.match(regex)) {
      Utils.l("Accept request from " + name);
      accept_party_request(name);
    }
  });
}

window.on_party_invite = function(name) {
  Utils.l("Party invite from " + name);
  Constants.ALLOWED_PARTY_STARTERS.forEach((regex, i) => {
    if (name.match(regex)) {
      Utils.l("Accept invite from " + name);
      accept_party_invite(name);
    }
  });
}

export default class Character {

  constructor() {
    try {
      this.CODE_VERSION = parent.X.codes[parent.code_slot][1];
    } catch (e) {
      this.CODE_VERSION = 0;
    }

    this.merchant = false;

    this.DRAW_RANGE = true;
    this.DRAW_TARGET_RANGE = true;
    this.TICK_DRAWINGS = [];

    this.ATTACKING = true;
    this.PRIEST_ATTACKING = true;

    this.setState("IDLE");
    this.cooldownMap = {};

    this.HP_THRESHOLD = 0;
    this.MP_THRESHOLD = 0;
    this.HP_REGEN_THRESHOLD = 0;
    this.MP_REGEN_THRESHOLD = 0;

    this.MIN_POTIONS = 600;

    this.PAUSE_UNTIL = 0;

    this.inventoryData = Inventory.fromStorage();

    if (!parent.inventory) {
      parent.render_inventory();
    }
  }

  async preTick() {}

  async postTick() {}

  async tick() {
    throw new Exception("tick() must be overwritten in sub-classes.");
  }

  async internalPreTick() {
    this.CALLER = Constants.CALLER || (parent.X.characters.filter(c => c.type == "warrior") || [{}])[0].name;
    this.DEPOSIT_CHARACTER = Constants.DEPOSIT_CHARACTER || (parent.X.characters.filter(c => c.type == "merchant") || [{}])[0].name;
    this.REQUIRED_PARTY_CHARACTERS = Constants.REQUIRED_PARTY_CHARACTERS || parent.X.characters.map(c => c.name);

    this.checkVersion();

    window.CACHED_MEMBERS = [];
    window.CACHED_MONSTERS = [];

    try {
      for (let i = 0; i < this.TICK_DRAWINGS.length; i++) {
        this.TICK_DRAWINGS[i].destroy();
      }
      this.TICK_DRAWINGS = [];
    } catch (e) {
      console.error(e);
    }

    await Lists.getPartyMembers();
    await Lists.getMonsters();

    this.updateStatistics();
    await this.checkPartyFilled();
    this.refreshFromLocalStorage();
    this.listInventories();

    const potionSeller = find_npc("fancypots");
    if (potionSeller && Utils.distanceFrom(potionSeller) < 1000) {
      let potionsWereBought = this.buyPotions();
      if (!potionsWereBought) {
        this.depositGoldAtMerchant(Constants.DEPOSIT_KEEP * 2);
      } else {
        this.depositGoldAtMerchant(500000);
      }
    }

    this.merchant = get_player(this.DEPOSIT_CHARACTER);
    if (this.merchant && Utils.distanceFrom(this.merchant) < 1000) {
      this.depositItemsAtMerchant();
      this.depositGoldAtMerchant(500000);
    }

    this.preTick();
  }

  async internalTick() {
    if (this.isDead()) {
      if (!this.respawnTimer) {
        this.respawnTimer = setTimeout(() => {
          this.DEATH_LOCATION = {
            "x": character.real_x,
            "y": character.real_y,
            "map": character.map
          }

          respawn();
          this.respawnTimer = false;
        }, 15000);
      }
      return;
    }

    this.healing();

    if (this.getState() == "DEAD") {
      this.setState("REVIVED");
    }

    if (is_transporting(character)) {
      // Utils.l("Transporting. Do nothing.");
      return;
    }
    if (is_moving(character)) {
      // Utils.l("Moving. Do nothing.");
      return;
    }
    if (is_disabled(character)) {
      // Utils.l("Disabled. Do nothing.");
      return;
    }

    loot();

    switch (this.getState()) {
      case "REVIVED":
        if (this.DEATH_LOCATION) {
          smart_move(this.DEATH_LOCATION, () => {
            this.setState("ATTACKING");
          });
          this.DEATH_LOCATION = false;
        } else {
          this.setState("ATTACKING");
        }
        break;
      case "TOWN_NEXT":

        break;
      case "SELLING":

        break;
      case "IDLE":
      case "ATTACKING":
      default:
        if (this.ATTACKING) {
          this.combat();
        } else {
          let caller = get_player(this.CALLER);
          if (caller && !caller.me) {
            if (this.keepDistanceToCaller() || !this.ATTACKING) {
              Utils.moveWithin(caller, this.ATTACKING ? Constants.FOLLOW_DISTANCE : Constants.CLOSE_FOLLOW_DISTANCE);
            }
          }
        }
        break;
    }

    this.tick();
  }

  async internalPostTick() {
    this.postTick();

    if (this.DRAW_RANGE) {
      this.TICK_DRAWINGS.push(draw_circle(character.x, character.y, character.range, 2, 0x0099FF));
    }

    if (this.DRAW_TARGET_RANGE && this.target) {
      this.TICK_DRAWINGS.push(draw_circle(this.target.x, this.target.y, this.target.range, 2, 0xFF9900));
    }

    parent.customUi.updateStatusPanel();

    this.saveLocation();

    this.analytics.stats();
  }

  async startTick() {
    this.internalPreTick();
    this.internalTick();
    this.internalPostTick();
  }

  async checkVersion() {
    try {
      const newCodeVersion = parent.X.codes[parent.code_slot][1];
      if (this.CODE_VERSION && this.CODE_VERSION < newCodeVersion) {
        Utils.l("Code version updated from", this.CODE_VERSION, "to", newCodeVersion);
        this.CODE_VERSION = newCodeVersion;

        say("/pure_eval setTimeout(()=>{ console.log('Version: Starting runner'); parent.start_runner(); }, 500)");
        console.log("Version: Stopping runner");
        parent.stop_runner();
      }
      this.CODE_VERSION = newCodeVersion;
    } catch (e) {
      Utils.debug(e);
    }
  }






  async moveHome() {
    if (character.map != "main") {
      Utils.l("Manually going home, due to being on a different map.");
    } else {
      Utils.l("Teleporting home.");
      use_skill("use_town", character);

      await Utils.sleep(500);
      while (is_transporting(character)) {
        await Utils.sleep(500);
      }
      await Utils.sleep(500);

      Utils.l("TPed home. Now going to waiting position.");
    }

    await this.mapping.moveTo(Locations.HOME);
    Utils.l("You are home");
  }

  async moveArmadillo() {
    await this.mapping.moveTo(Locations.ARMADILLO);
    Utils.l("You are at armadillos");
  }

  async moveToMember(name) {
    await this.mapping.moveTo(this.getLocationOf(name));
    Utils.l("You are at (" + name + ")");
  }

  async moveCaller() {
    await this.mapping.moveTo(this.getLocationOf(this.CALLER));
    Utils.l("You are at caller (" + this.CALLER + ")");
  }

  getLocationOf(name) {
    return JSON.parse(localStorage.getItem("LOCATION-" + name));
  }

  saveLocation() {
    localStorage.setItem("LOCATION-" + character.name, JSON.stringify({
      x: character.x,
      y: character.y,
      map: character.map
    }));
  }

  async healing() {
    if (character.hp < this.HP_THRESHOLD && !is_on_cooldown("use_hp")) {
      Utils.l("Drink healing potion");
      this.analytics.usedHpPotion();
      use_skill("use_hp");
      this.setCooldown("use_hp");
    } else if ( /*Utils.isPriest() &&*/ character.mp < this.MP_THRESHOLD && !is_on_cooldown("use_mp")) {
      Utils.l("Drink mana potion");
      this.analytics.usedMpPotion();
      use_skill("use_mp");
      this.setCooldown("use_mp");
    } else if (character.hp < this.HP_REGEN_THRESHOLD && this.canUse("regen_hp")) {
      Utils.l("Regenerate health");
      this.analytics.usedRegenHp();
      use_skill("regen_hp");
      this.setCooldown("regen_hp");
    } else if (character.mp < this.MP_REGEN_THRESHOLD && this.canUse("regen_mp")) {
      Utils.l("Regenerate mana");
      this.analytics.usedRegenMp();
      use_skill("regen_mp");
      this.setCooldown("regen_mp");
    } else if ((!this.target || this.target.dead) && character.hp < character.max_hp && this.canUse("regen_hp")) {
      Utils.l("Regenerate health (no target)");
      this.analytics.usedRegenHp();
      use_skill("regen_hp");
      this.setCooldown("regen_hp");
    } else if ((!this.target || this.target.dead) && character.mp < character.max_mp && this.canUse("regen_hp")) {
      Utils.l("Regenerate mana (no target)");
      this.analytics.usedRegenMp();
      use_skill("regen_mp");
      this.setCooldown("regen_mp");
    }
  };

  async keepDistanceToCaller() {
    return false;
  }

  async determineTarget() {
    let callerTarget = localStorage.getItem("TARGETTED") || false;
    let caller = get_player(this.CALLER);

    this.target = get_targeted_monster();

    if (caller && !caller.me) {
      if (this.keepDistanceToCaller() || !this.ATTACKING) {
        Utils.moveWithin(caller, this.ATTACKING ? Constants.FOLLOW_DISTANCE : Constants.CLOSE_FOLLOW_DISTANCE);
      }

      this.target = get_monster(caller.target);
      if (this.target && this.target != get_targeted_monster()) {
        Utils.l("Target from caller (" + this.CALLER + "): " + this.target.mtype + "(" + this.target.id + ") " + parseInt(Utils.distanceFrom(this.target)) + "px");
      }
    }

    if (!this.target) {
      if (caller && !caller.me) {
        if (callerTarget && !callerTarget.dead) {
          this.target = callerTarget;
        }
      } else {
        this.target = await Lists.getMonsters()
          .then(monsters => Filters.filterByBoss(monsters))
          .then(monsters => Filters.first(monsters))
          .catch(() => false);

        if (!this.target) {
          this.target = await Lists.getMonsters()
            .then(monsters => this.ATTACK_MTYPE ? Filters.filterByType(monsters, this.ATTACK_MTYPE) : monsters)
            .then(monsters => Filters.filterByMaxAttack(monsters, Constants.MONSTER_MAX_ATTACK))
            .then(monsters => Filters.filterByMinXp(monsters, Constants.MONSTER_MIN_XP))
            .then(monsters => Filters.filterByCanMoveTo(monsters))
            .then(monsters => Sorting.sortMonsters(monsters))
            .then(monsters => Filters.first(monsters))
            .catch(() => false);
        }
      }

      if (this.target) {
        Utils.l("Targetting " + this.target.mtype + "(" + this.target.id + ") " + parseInt(Utils.distanceFrom(this.target)) + "px");
      }
    }
  }

  async internalPreCombatTick() {
    return this.preCombatTick();
  }

  async internalCombatApproachTick() {
    if (!this.ATTACKING) return false;
    if (!this.target) return false;

    Utils.l("Attacking creature at x=" + parseInt(this.target.x) + ", y=" + parseInt(this.target.y));

    this.setState("APPROACHING");

    let result = this.combatApproachTick();

    move(
      this.target.x,
      this.target.y
    );

    return result;
  }

  async internalCombatFightTick() {
    let result = this.combatFightTick();

    this.setState("ATTACKING");
    attack(this.target);

    return result;
  }

  async preCombatTick() {
    return true;
  }

  async combatApproachTick() {
    return false;
  }

  async combatFightTick() {
    return true;
  }

  async combat() {
    await this.determineTarget();

    if (await this.internalPreCombatTick()) {
      change_target(this.target, true);
      localStorage.setItem("TARGET", this.target);

      if (!is_in_range(this.target)) {
        await this.internalCombatApproachTick();
      } else {
        await this.internalCombatFightTick();
      }
    }
  }







  setState(value) {
    this.state = value;
    set_message(this.state);
  }

  getState() {
    return this.state;
  }

  goHome() {
    this.setState("TOWN_NEXT");
    use_skill("use_town", character);
  }

  canUse(skill) {
    let timeNow = (new Date()).getTime();

    if (!is_on_cooldown(skill) && can_use(skill) && timeNow > (this.cooldownMap[skill] || 0)) {
      return true;
    }

    return false;
  }

  setCooldown(skillId, standardCooldownTime) {
    let timeNow = (new Date()).getTime();

    const skill = G.skills[skillId];
    let multiplier = skill.cooldown_multipler || 1.0;
    let cooldown = 1;

    if (skill.share) {
      cooldown = G.skills[skill.share].cooldown;
    } else {
      cooldown = skill.cooldown;
    }

    cooldown = cooldown * multiplier;

    this.cooldownMap[skillId] = timeNow + cooldown;
  }

  isMpHigher(factor) {
    return (character.mp / character.max_mp > factor);
  }

  isHpHigher(factor) {
    return (character.hp / character.max_hp > factor);
  }

  isDead() {
    if (character.rip) {
      this.setState("DEAD");
    }
    return character.rip;
  }

  updateStatistics() {
    // this.HP_THRESHOLD = Math.max(character.max_hp - Constants.HP_POTION_AMOUNT * 2, character.max_hp * 0.5);
    // this.MP_THRESHOLD = Math.max(character.max_mp - Constants.MP_POTION_AMOUNT * 2, character.max_mp * 0.5);
    // this.HP_REGEN_THRESHOLD = Math.max(character.max_hp - Constants.HP_REGEN_AMOUNT, character.max_hp * 0.8);
    // this.MP_REGEN_THRESHOLD = Math.max(character.max_mp - Constants.MP_REGEN_AMOUNT, character.max_mp * 0.8);
    this.HP_THRESHOLD = character.max_hp * 0.5;
    this.MP_THRESHOLD = character.max_mp * 0.5;
    this.HP_REGEN_THRESHOLD = character.max_hp * 0.8;
    this.MP_REGEN_THRESHOLD = character.max_mp * 0.8;
  }

  async checkPartyFilled() {
    let timeNow = (new Date()).getTime();
    if (this.PAUSE_UNTIL > timeNow) return;

    let namesMap = await Lists.getBasicPartyMembers();
    let namesMapNotMe = namesMap.filter(id => id !== character.id);

    if (this.CALLER != character.id) {
      if (namesMap.length > 0 && !namesMapNotMe.includes(this.CALLER)) {
        leave_party();

        let timeNow = (new Date()).getTime();
        this.PAUSE_UNTIL = timeNow + 3000;
      }

      return;
    }

    let invitesSent = false;
    for (let i = 0; i < this.REQUIRED_PARTY_CHARACTERS.length; i++) {
      let item = this.REQUIRED_PARTY_CHARACTERS[i];
      if (item != character.id && namesMapNotMe.length < 3 && !namesMapNotMe.includes(item)) {
        send_party_invite(item);
        invitesSent = true;
      }
    }

    if (invitesSent) {
      let timeNow = (new Date()).getTime();
      this.PAUSE_UNTIL = timeNow + 3000;
    }
  }

  refreshFromLocalStorage() {
    this.INVENTORIES = JSON.parse(localStorage.getItem("INVENTORIES") || "{}");
    this.AUTO_DEPOSIT = localStorage.getItem("AUTO_DEPOSIT") == 1;
    this.ATTACK_MTYPE = localStorage.getItem("ATTACK_MTYPE") || false;
    this.ATTACKING = localStorage.getItem("ATTACKING") == 1;
    this.PRIEST_ATTACKING = localStorage.getItem("PRIEST_ATTACKING") == 1;
    this.CALLER = localStorage.getItem("CALLER") || false;
  }

  listInventories() {
    if (!this.INVENTORIES) this.INVENTORIES = {};

    let items = {};
    character.items.forEach((item, i) => {
      if (!item) return;
      if (items[item.name]) {
        items[item.name] += item.q || 1;
      } else {
        items[item.name] = item.q || 1;
      }
    });

    items["hpot0"] = items["hpot0"] || 0;
    items["hpot1"] = items["hpot1"] || 0;
    items["mpot0"] = items["mpot0"] || 0;
    items["mpot1"] = items["mpot1"] || 0;

    this.INVENTORIES[character.name] = items;
    localStorage.setItem("INVENTORIES", JSON.stringify(this.INVENTORIES));




    this.inventoryData.refresh();
  }

  buyPotions() {
    if (character.map != "main") return;

    let items = this.INVENTORIES[character.name];

    if (items["hpot0"] < this.MIN_POTIONS) {
      let potionsToBuy = (this.MIN_POTIONS - items["hpot0"]) || this.MIN_POTIONS;
      Utils.l("Buy " + potionsToBuy + " health potions");
      buy("hpot0", potionsToBuy);
      this.analytics.bought("hpot0");
    } else if (items["mpot0"] < this.MIN_POTIONS) {
      let potionsToBuy = (this.MIN_POTIONS - items["mpot0"]) || this.MIN_POTIONS;
      Utils.l("Buy " + potionsToBuy + " mana potions");
      buy("mpot0", potionsToBuy);
      this.analytics.bought("mpot0");
    } else {
      return false;
    }

    return true;
  }

  depositItemsAtMerchant() {
    if (Utils.isMerchant()) return;
    // if (!this.AUTO_DEPOSIT) return;

    this.inventoryData.transferUnlockedItemsTo(this.merchant, );

    // if (this.merchant && Utils.distanceFrom(this.merchant) < 500) {
    //   character.items.forEach((item, i) => {
    //     if (!item ||
    //       item.name.startsWith("hpot") ||
    //       item.name.startsWith("mpot") ||
    //       item.name.startsWith("hpot1") ||
    //       item.name.startsWith("mpot1") ||
    //       item.name == "tracker"
    //     ) return;
    //     Utils.l("Depositing item " + item + " (" + i + ")");
    //     send_item(this.DEPOSIT_CHARACTER, i, item.q || 1);
    //     return;
    //   });
    // }
  }

  depositGoldAtMerchant(keepAmount) {
    if (Utils.isMerchant()) return;
    // if (!this.AUTO_DEPOSIT) return;

    if (this.merchant && Utils.distanceFrom(this.merchant) < 500) {
      if (character.gold > keepAmount) {
        const goldToDeposit = character.gold - keepAmount;
        Utils.l("Depositing " + goldToDeposit + " gold");
        send_gold(this.DEPOSIT_CHARACTER, goldToDeposit);
      }
    }
  }









}