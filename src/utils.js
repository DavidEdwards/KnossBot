import Constants from "./constants";

const Utils = class Utils {

  gameLog() {
    const args = Array.prototype.slice.call(arguments);

    if (Constants.GAME_LOGGING) {
      log(args.join(" "));
    }
  }

  debug() {
    const args = Array.prototype.slice.call(arguments);

    if (Constants.CONSOLE_LOGGING) {
      console.log(...args);
    }
  }

  l(data) {
    const args = Array.prototype.slice.call(arguments);

    this.gameLog(...args);
    this.debug(...args);
  }

  isMerchant() {
    return character.ctype == "merchant";
  }

  isRogue() {
    return character.ctype == "rogue";
  }

  isWarrior() {
    return character.ctype == "warrior";
  }

  isPriest() {
    return character.ctype == "priest";
  }

  isMage() {
    return character.ctype == "mage";
  }

  isRanger() {
    return character.ctype == "ranger";
  }

  isPaladin() {
    return character.ctype == "paladin";
  }

  getInventorySlotByItemName(name, minQuantity) {
    let value = -1;

    character.items.forEach((item, i) => {
      if (!item) return;
      if (item.name == name && item.q >= minQuantity) {
        value = i;
        return;
      }
    });

    return value;
  }

  distance(a, b) {
    return Math.abs(Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    ));
  };

  distanceFrom(location) {
    const x = location.x || location.real_x;
    const y = location.y || location.real_y;
    return Math.abs(Math.sqrt(
      Math.pow(x - character.real_x, 2) + Math.pow(y - character.real_y, 2)
    ));
  };

  moveWithin(entity, bounds) {
    if (this.distanceFrom(entity) <= (bounds + 20)) return;
    const distance = this.distanceFrom(entity) - bounds;
    const diffX = character.real_x - entity.real_x;
    const diffY = character.real_y - entity.real_y;
    const angle = Math.atan2(diffY, diffX);
    const newDiffX = Math.cos(angle) * distance;
    const newDiffY = Math.sin(angle) * distance;

    const x = character.real_x - newDiffX;
    const y = character.real_y - newDiffY;
    const map = entity.map;

    if (character.map == map && can_move_to(x, y)) {
      move(x, y);
    }
    /* else {
          parent.myChar.mapping.moveTo({
            x,
            y,
            map
          });
        }*/
  };

  pointOnCircle(degrees, distance) {
    const angle = this.d2r(degrees);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    return {
      x,
      y
    }
  }

  d2r(degrees) {
    return degrees * (Math.PI / 180);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

};

export default (new Utils());