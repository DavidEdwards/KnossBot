import Constants from "../constants";
import Utils from "../utils";
import localStorageUi from "./templates/localstorage_ui.html";

export default class Ui {

  constructor() {
    this.gpm_menu_name = "gpm-panel";
    this._start_time = performance.now();
    this._last_known_gold_amount = character.gold;
    this._starting_exp = character.xp;
    this._gold_made = 0;

    const removeLogWith = [
      " killed an ",
      " killed a ",
      "Get closer",
      "Regenerate mana",
      "Regenerate health",
      "Slot is occupied",
      "Do nothing.",
      "You can't buy, trade or upgrade in the bank"
    ];

    setInterval(() => {
      const self = this;
      parent.$(".gameentry").each(function(index) {
        const item = $(this);

        for (let i = 0; i < removeLogWith.length; i++) {
          const text = removeLogWith[i];
          if (item.text().indexOf(text) !== -1) {
            item.fadeOut(3000, () => {
              item.remove();
            });
            break;
          }
        }
      });
    }, 3100);
  }

  async openLocalStorageUi() {
    let newWin = window.open("about:blank", "hello", "width=500,height=300");
    if (newWin) {
      newWin.document.write(localStorageUi);
    }
  }

  updateControlButtons() {
    parent.$(".custom-ui").remove();
    parent.$("#skillbar").children().first().append("<div style='position: relative; display:inline-block; margin: 2px; border: 2px solid gray; height: 46px; width: 46px; background: black; vertical-align: top; ' onclick='parent.customUi.openLocalStorageUi()' class='custom-ui'></div>");
  }

  updateStatusPanel() {
    // Thanks to Allure_ from Discord!

    let brc = parent.$('#bottomrightcorner');
    brc.find(`#${this.gpm_menu_name}`).remove();

    let goldInfo = parent.$(`<div id="${this.gpm_menu_name}"></div>`).css({ //gold gain loss
      background: 'black',
      border: 'solid gray',
      borderWidth: '5px 5px',
      width: '360px',
      height: '90px',
      lineHeight: '30px',
      fontSize: '25px',
      color: '#FFD700',
      textAlign: 'center',
      marginBottom: '-5px'
    });
    parent.$('#bottomrightcorner').prepend(goldInfo);

    if (character.gold > this._last_known_gold_amount) {
      this._gold_made += character.gold - this._last_known_gold_amount;
    }
    if (character.xp < this._starting_exp) {
      this._starting_exp = character.xp;
    }
    this._last_known_gold_amount = character.gold;
    let runtime = (performance.now() - this._start_time) / 1000 / 60;
    let exp_per_minute = Math.round((character.xp - this._starting_exp) / runtime);
    let exp_per_hour = Math.round((character.xp - this._starting_exp) / (runtime / 60));
    let gold_per_minute = Math.round(this._gold_made / runtime);
    let gold_per_hour = Math.round(this._gold_made / (runtime / 60));
    let time_to_level = ((character.max_xp - character.xp) / exp_per_hour);

    character.exp_per_minute = exp_per_minute;
    character.exp_per_hour = exp_per_hour;
    character.gold_per_minute = gold_per_minute;
    character.gold_per_hour = gold_per_hour;
    character.time_to_level = time_to_level;
    character.runtime = runtime;

    const formatNumber = (value) => {
      return new Intl.NumberFormat().format(value);
    };

    let new_text = `
            Gold: ${formatNumber(this._gold_made)}, gp/M: ${formatNumber(gold_per_minute)}, gp/H: ${formatNumber(gold_per_hour)}<br>
            exp/H ${(formatNumber(exp_per_hour))}, ${Math.round(time_to_level) >= 1 ? `Lvl in ${Math.round(time_to_level)} hours` : `Lvl in ${Math.round(time_to_level * 60)} minutes`} </br>
            DPS: ${Math.round(character.attack * character.frequency * parent.damage_multiplier(0 - character.apiercing))} FPS: ${parent.fps}, Runtime: ${formatNumber(Math.round(runtime/60))}/H
            `;

    parent.$(`#${this.gpm_menu_name}`).html(new_text);
  }

}