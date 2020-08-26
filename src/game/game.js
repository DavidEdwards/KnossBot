import Constants from "../constants";
import Utils from "../utils";
import Character from "../characters/merchant";
import Merchant from "../characters/merchant";
import Rogue from "../characters/rogue";
import Priest from "../characters/priest";
import Warrior from "../characters/warrior";
import Mage from "../characters/mage";
import Ranger from "../characters/ranger";
import Paladin from "../characters/paladin";
import Ui from "./ui";
import Locations from "./locations";
import Analytics from "../analytics/analytics";

import mapping from "./mapping/utils";

export default class Game {

  constructor() {
    this.analytics = new Analytics();
    parent.customUi = new Ui();
    parent.locations = Locations;

    this.myChar = false

    if (Utils.isMerchant()) {
      this.myChar = new Merchant();
    } else if (Utils.isRogue()) {
      this.myChar = new Rogue();
    } else if (Utils.isPriest()) {
      this.myChar = new Priest();
    } else if (Utils.isWarrior()) {
      this.myChar = new Warrior();
    } else if (Utils.isMage()) {
      this.myChar = new Mage();
    } else if (Utils.isRanger()) {
      this.myChar = new Ranger();
    } else if (Utils.isPaladin()) {
      this.myChar = new Paladin();
    } else {
      this.myChar = new Character();
      this.myChar.setState("IDLE");
      Utils.l("This character does not have a specific class available.");
    }

    this.myChar.mapping = mapping;
    this.myChar.analytics = this.analytics;
    parent.myChar = this.myChar;

    parent.combatToggle = () => {
      if (localStorage["ATTACKING"] == 1) {
        parent.combatStop();
      } else {
        parent.combatStart();
      }
    };

    parent.combatStart = () => {
      Utils.l("Starting combat");
      localStorage.setItem("ATTACKING", 1);
    };

    parent.combatStop = () => {
      Utils.l("Stopping combat");
      localStorage.setItem("ATTACKING", 0);
    };

    parent.combatFocus = (type) => {
      Utils.l("Attack focus: " + type);
      localStorage.setItem("ATTACK_MTYPE", type);
    };

    parent.combatCaller = (caller) => {
      Utils.l("Target caller: " + caller);
      localStorage.setItem("CALLER", caller);
    };

    parent.combatPriest = (enabled) => {
      Utils.l("Priest attacking: " + enabled);
      localStorage.setItem("PRIEST_ATTACKING", enabled);
    };

    parent.autoDeposit = (enabled) => {
      Utils.l("Auto deposit: " + enabled);
      localStorage.setItem("AUTO_DEPOSIT", enabled);
    };

    this.renewUi();

    this.setupSocketListeners();
  }

  async renewUi() {
    parent.customUi.updateControlButtons();
    parent.customUi.updateStatusPanel();
  }

  async setupSocketListeners() {
    parent.socket.on("chest_opened", (event) => {
      try {
        const data = Object.assign({}, event);
        if (data.gone) return;

        for (let i = 0; i < data.items.length; i++) {
          let item = data.items[i];
          if (item.looter == character.name) {
            this.analytics.looted(item.name);
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  async run() {
    if (this.myChar) {
      this.myChar.startTick();
    }
  }

}