import Utils from "../utils";

const Sorting = class Sorting {

  constructor() {}

  sortMonstersByDanger(monsters) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.sort((a, b) => {
          return b.attack - a.attack
        })
      )
    });
  };

  sortByLowestHealth(entities) {
    return new Promise((resolve, reject) => {
      resolve(entities.sort((a, b) => {
        return ((a.hp / a.max_hp) * 100) - ((b.hp / b.max_hp) * 100)
      }))
    });
  };

  sortMonsters(monsters) {
    return new Promise((resolve, reject) => {
      resolve(
        monsters.sort((a, b) => {
          return (Utils.distanceFrom(a)) - (Utils.distanceFrom(b))
        })
      )
    });
  };

};

export default (new Sorting());