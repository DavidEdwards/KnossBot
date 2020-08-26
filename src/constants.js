import env from "../.env.json";

const Constants = class Constants {
  constructor() {
    // CHANGE THESE VALUES FOR HARD CODED VALUES
    this.CALLER = false;
    this.DEPOSIT_CHARACTER = false;
    this.REQUIRED_PARTY_CHARACTERS = false;
    this.ALLOWED_PARTY_STARTERS = [new RegExp(env.partyMembersRegex)];
    // ^^^ CHANGE THESE VALUES FOR HARD CODED VALUES

    this.LOOP_SPEED = 300;
    this.GAME_LOGGING = true;
    this.CONSOLE_LOGGING = true;

    this.GRAPH_RESOLUTION = 1;

    this.HP_REGEN_AMOUNT = 50;
    this.MP_REGEN_AMOUNT = 100;
    this.HP_POTION_AMOUNT = 200;
    this.MP_POTION_AMOUNT = 300;

    this.FOLLOW_DISTANCE = 100;
    this.CLOSE_FOLLOW_DISTANCE = 10;

    this.DEPOSIT_THRESHOLD = 40000;
    this.DEPOSIT_KEEP = 20000;

    this.MONSTER_MIN_XP = 10;
    this.MONSTER_MAX_ATTACK = 800;

    this.COOLDOWNS = {
      "invis": 12100,
      "charge": 40100,
      "heal": 200,
      "partyheal": 10000,
      "revive": 200,
      "quickpunch": 2600,
      "curse": /*5100*/ 20000,
      "darkblessing": 60100,
      "regen_hp": 4000,
      "regen_mp": 3000
    };

    this.POTION_REFRESH_DISTANCE = 1000;
    this.MIN_POTIONS_DELIVERY = 2000;
    this.POTION_DELIVERY_AMOUNT = 50;
    this.MIN_POTION_DELIVERER_THRESHOLD = 100;

    this.STANDARD_BACKOFF_TIME = 500;

    console.log("Config", env);
  }
};

export default (new Constants());