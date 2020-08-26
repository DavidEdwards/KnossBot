const Filters = class Filters {

  membersNotMe(members) {
    return new Promise((resolve, reject) => {
      resolve(members.filter(member => !member.me));
    });
  }

  isAMemberBelow(members, factor) {
    return new Promise((resolve, reject) => {
      let isDanger = false;
      members.forEach((item, i) => {
        if (item && (item.hp / item.max_hp) < factor) {
          isDanger = true;
        }
      });

      resolve(isDanger);
    });
  }

  filterByType(monsters, mtype) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(entity => entity.mtype == mtype)
      )
    });
  };

  filterByMaxAttack(monsters, maxAttack) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(entity => entity.attack < (maxAttack || 99999999))
      )
    });
  };

  filterByBoss(monsters) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(monsters => monsters.mtype == "phoenix" || monsters.mtype == "mvampire")
      )
    });
  };

  filterByCanMoveTo(monsters) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(entity => can_move_to(entity))
      )
    });
  };

  filterByMinXp(monsters, minXp) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(entity => entity.xp > (minXp || 0))
      )
    });
  };

  filterByTargetting(monsters, names) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.filter(entity => !entity.dead && entity.visible && names.includes(entity.target))
      )
    });
  };

  first(items) {
    return new Promise((resolve, reject) => {
      if (!items || items.length == 0) {
        resolve(false);
      } else {
        resolve(items[0]);
      }
    });
  };

  random(items) {
    return new Promise((resolve, reject) => {
      if (!items || items.length == 0) {
        resolve(false);
      } else {
        resolve(items[Math.floor(Math.random() * items.length)]);
      }
    });
  };

};

export default (new Filters());