import Character from "./character";
import Constants from "../constants";
import Utils from "../utils";
import Locations from "../game/locations";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";

export default class Merchant extends Character {

  constructor() {
    super();

    this.setState("SELLING");

    this.defaultUpgradeMaxLevel = 5;
    this.defaultUpgradeMaxGrade = 1;
    this.defaultCompoundMaxLevel = 3;
    this.defaultCompoundMaxGrade = 1;

    this.maxLevelOverride = {
      "coat": 8,
      "pants": 8,
      "gloves": 8,
      "shoes": 8,
      "helmet": 8,
      "sshield": 8,
      "wattire": 8,
      "wgloves": 8,
      "wcap": 8,
      "wshoes": 8,
      "fireblade": 8,
      "firestaff": 8
    }

    this.upgradeScrollSlot = -1;
    this.compoundableScrollSlot = -1;
    this.upgradeScrollSlot2 = -1;
    this.compoundableScrollSlot2 = -1;
    this.merchantSlot = -1;
    this.exchangeSlot = -1;
    this.consumable = {};
    this.upgradable = {};
    this.compoundable = {};

    this.merchantOpen = false;
    parent.close_merchant();

    this.MIN_POTIONS = 4000;

    this.LAST_DELIVERY_TIME = 0;

    this.REGULAR_COLLECTION_TIMER = setInterval(async () => {
      this.makeDelivery();
    }, 15 * 60 * 1000);
  }

  async makeDelivery() {
    if (!this.ATTACKING) return;
    Utils.l("Collect items from fighters");

    await this.moveCaller();

    await Utils.sleep(5000);

    await this.moveHome();
  }

  async preTick() {
    if (this.isDead()) return;

    if (!this.merchantOpen && !(is_moving(character) || is_transporting(character))) {
      parent.open_merchant(this.merchantSlot);
      this.merchantOpen = true;
    } else if (this.merchantOpen && (is_moving(character) || is_transporting(character))) {
      parent.close_merchant();
      this.merchantOpen = false;
    }

    await this.giveLuckBonus();
  }

  async tick() {
    await this.populateLists();
    if (character.map == "main" && Utils.distanceFrom(Locations.HOME) < 500) {
      await this.topUpConsumables();

      if (!character.q.upgrade) {
        await this.doUpgrades();
      }
      if (!character.q.compound) {
        await this.doCompounding();
      }
      if (!character.q.exchange && this.exchangeSlot > -1) {
        parent.e_item = this.exchangeSlot;
        parent.exchange(1);
      }

      // this.buyStandardItems();
    }

    await this.deliverPotions();
  }

  async preCombatTick() {
    return false;
  }

  async combatApproachTick() {
    return false;
  }

  async combatFightTick() {
    return false;
  }

  async populateLists() {
    this.upgradeScrollSlot = -1;
    this.compoundableScrollSlot = -1;
    this.upgradeScrollSlot2 = -1;
    this.compoundableScrollSlot2 = -1;
    this.merchantSlot = -1;
    this.exchangeSlot = -1;
    this.consumable = {};
    this.upgradable = {};
    this.compoundable = {};

    character.items.forEach((item, i) => {
      if (!item) return;

      if (item.name == "scroll0") this.upgradeScrollSlot = i;
      if (item.name == "cscroll0") this.compoundableScrollSlot = i;
      if (item.name == "scroll1") this.upgradeScrollSlot2 = i;
      if (item.name == "cscroll1") this.compoundableScrollSlot2 = i;
      if (item.name == "gem0") this.exchangeSlot = i;
      if (item.name == "armorbox") this.exchangeSlot = i;
      if (item.name == "weaponbox") this.exchangeSlot = i;
      if (item.name == "stand0") this.merchantSlot = i;

      if (item.q) {
        // Quantity exists, must be consumable.
        this.consumable[item.name] = item.q;
      } else {
        // Level exists, must be upgradable / compoundable.
        let def = G.items[item.name];
        if (def.compound) {
          if (!this.compoundable[item.name]) {
            this.compoundable[item.name] = [];
          }
          if (!this.compoundable[item.name][item.level]) {
            this.compoundable[item.name][item.level] = [];
          }
          this.compoundable[item.name][item.level].push({
            slot: i,
            item
          });
        }
        if (def.upgrade) {
          if (!this.upgradable[item.name]) {
            this.upgradable[item.name] = [];
          }
          if (!this.upgradable[item.name][item.level]) {
            this.upgradable[item.name][item.level] = [];
          }
          this.upgradable[item.name][item.level].push({
            slot: i,
            item
          });
        }
      }
    });
  }

  async topUpConsumables() {
    const seller = find_npc("scrolls");
    if (seller && Utils.distanceFrom(seller) < 1000 && character.map == "main") {
      this.consumable["scroll0"] = this.consumable["scroll0"] || 0;
      this.consumable["cscroll0"] = this.consumable["cscroll0"] || 0;
      this.consumable["scroll1"] = this.consumable["scroll1"] || 0;
      this.consumable["cscroll1"] = this.consumable["cscroll1"] || 0;

      if (this.consumable["scroll0"] < 10) {
        let amount = 10 - this.consumable["scroll0"];
        buy("scroll0", amount);
        this.analytics.bought("scroll0", amount);
      }
      if (this.consumable["scroll1"] < 10) {
        let amount = 10 - this.consumable["scroll1"];
        buy("scroll1", amount);
        this.analytics.bought("scroll1", amount);
      }
      if (this.consumable["cscroll0"] < 10) {
        let amount = 10 - this.consumable["cscroll0"];
        buy("cscroll0", amount);
        this.analytics.bought("cscroll0", amount);
      }
      if (this.consumable["cscroll1"] < 10) {
        let amount = 10 - this.consumable["cscroll1"];
        buy("cscroll1", amount);
        this.analytics.bought("cscroll1", amount);
      }
    }
  }

  async doUpgrades() {
    let keys = Object.keys(this.upgradable);
    keys.forEach((key, i1) => {
      let item = this.upgradable[key];
      for (let itemLevel = 0; itemLevel < item.length; itemLevel++) {
        if (itemLevel >= (this.maxLevelOverride[key] || this.defaultUpgradeMaxLevel)) {
          // DONT AUTO UPGRADE HIGHER LEVEL STUFF
          continue;
        }

        let itemListOfLevel = item[itemLevel];
        if (itemListOfLevel && itemListOfLevel.length >= 1) {
          let grade = item_grade(itemListOfLevel[0].item);

          if (grade > this.defaultUpgradeMaxLevel) {
            // DONT AUTO UPGRADE SUPER RARE STUFF
            continue;
          }

          Utils.l("Upgrade -> " + key + " grade=" + grade + " level=" + itemIndex + "->" + (itemIndex + 1));

          let item0 = itemListOfLevel.splice(0, 1);
          if (itemLevel >= 5 || grade == 1) {
            upgrade(item0[0].slot, this.upgradeScrollSlot2);
          } else {
            upgrade(item0[0].slot, this.upgradeScrollSlot);
          }
        }
      }
    });
  }

  async doCompounding() {
    let keys = Object.keys(this.compoundable);
    keys.forEach((key, i1) => {
      let item = this.compoundable[key];
      for (let itemLevel = 0; itemLevel < item.length; itemLevel++) {
        if (itemLevel >= (this.maxLevelOverride[key] || this.defaultCompoundMaxLevel)) {
          // DONT AUTO COMPOUND HIGHER LEVEL STUFF
          continue;
        }

        let itemListOfLevel = item[itemLevel];
        if (itemListOfLevel && itemListOfLevel.length >= 3) {
          let grade = item_grade(itemListOfLevel[0].item);

          if (grade > this.defaultCompoundMaxGrade) {
            // DONT AUTO UPGRADE SUPER RARE STUFF
            continue;
          }

          let item0 = itemListOfLevel.splice(0, 1);
          let item1 = itemListOfLevel.splice(0, 1);
          let item2 = itemListOfLevel.splice(0, 1);
          Utils.debug("Compound -> " + key + " grade=" + grade + " level=" + itemIndex + "->" + (itemIndex + 1) + " s1=" + item0[0].slot + " s2=" + item1[0].slot + " s3=" + item2[0].slot + " sc=" + this.compoundableScrollSlot2);

          if (itemLevel >= 2) {
            compound(item0[0].slot, item1[0].slot, item2[0].slot, this.compoundableScrollSlot2);
          } else {
            compound(item0[0].slot, item1[0].slot, item2[0].slot, this.compoundableScrollSlot);
          }
        }
      }
    });
  }

  async buyStandardItems() {
    const timeNow = (new Date()).getTime();
    if (timeNow - (this.lastInventoryBuyTime || 0) < 1000) {
      return;
    }
    this.lastInventoryBuyTime = timeNow;

    if (character.gold < 10000000) return;

    if (!this.inventoryData.hasItem("coat")) {
      buy("coat", 1);
      this.analytics.bought("coat");
    } else if (!this.inventoryData.hasItem("pants")) {
      buy("pants", 1);
      this.analytics.bought("pants");
    } else if (!this.inventoryData.hasItem("gloves")) {
      buy("gloves", 1);
      this.analytics.bought("gloves");
    } else if (!this.inventoryData.hasItem("shoes")) {
      buy("shoes", 1);
      this.analytics.bought("shoes");
    } else if (!this.inventoryData.hasItem("helmet")) {
      buy("helmet", 1);
      this.analytics.bought("helmet");
    }
  }

  async deliverPotions() {
    let timeNow = (new Date()).getTime();
    if (timeNow - this.LAST_DELIVERY_TIME < Constants.STANDARD_BACKOFF_TIME) return;
    this.LAST_DELIVERY_TIME = timeNow;

    let partyMembers = await Lists.getPartyMembers()
      .then(members => Filters.membersNotMe(members));

    partyMembers.forEach((member, i) => {
      if (!member || member.rip || Utils.distanceFrom(member) > Constants.POTION_REFRESH_DISTANCE || !this.INVENTORIES[member.name] || character.map != member.map) return;

      if (this.INVENTORIES[member.name]["hpot0"] < Constants.MIN_POTIONS_DELIVERY && this.INVENTORIES[character.name]["hpot0"] > Constants.MIN_POTION_DELIVERER_THRESHOLD) {
        let itemNum = Utils.getInventorySlotByItemName("hpot0", Constants.POTION_DELIVERY_AMOUNT);
        if (itemNum >= 0) {
          Utils.l("Move " + Constants.POTION_DELIVERY_AMOUNT + " units of hpot0 to " + member.name, itemNum);
          send_item(member.name, itemNum, Constants.POTION_DELIVERY_AMOUNT);
          this.INVENTORIES[character.name]["hpot0"] -= Constants.POTION_DELIVERY_AMOUNT;
        }
      }

      if (this.INVENTORIES[member.name]["mpot0"] < Constants.MIN_POTIONS_DELIVERY && this.INVENTORIES[character.name]["mpot0"] > Constants.MIN_POTION_DELIVERER_THRESHOLD) {
        let itemNum = Utils.getInventorySlotByItemName("mpot0", Constants.POTION_DELIVERY_AMOUNT);
        if (itemNum >= 0) {
          Utils.l("Move " + Constants.POTION_DELIVERY_AMOUNT + " units of mpot0 to " + member.name, itemNum);
          send_item(member.name, itemNum, Constants.POTION_DELIVERY_AMOUNT);
          this.INVENTORIES[character.name]["mpot0"] -= Constants.POTION_DELIVERY_AMOUNT;
        }
      }
    });
  }

  async giveLuckBonus() {
    const luckTime = 3600000;
    const now = (new Date()).getTime();

    if (!this.lastLuckMap) this.lastLuckMap = {};

    let namesMap = await Lists.getBasicPartyMembers();

    const list = Object.values(parent.entities)
      .filter(e => e.type == "character" && !e.npc)
      .filter(e => !e.s || !e.s.mluck || ( /*e.s.mluck.f != character.name*/ /*namesMap.includes(e.id)*/ (now - (this.lastLuckMap[e.id] || 0) > 10000) /*&& e.s.mluck.ms < luckTime - 10000*/ ))
      .filter(e => Utils.distanceFrom(e) < G.skills.mluck.range);

    if (list.length > 0) {
      Utils.debug("Potential luck targets", list.map(c => c.id));
      const entity = list[0];

      if (this.canUse("mluck")) {
        Utils.debug("Give luck to " + entity.id);
        use_skill("mluck", entity.id);
        this.lastLuckMap[entity.id] = now;
        this.setCooldown("mluck");
      }
    }
  }

}