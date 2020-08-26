const Lists = class Lists {

  constructor() {}

  getPartyMembers() {
    return new Promise((resolve, reject) => {
      let members = window.CACHED_MEMBERS || [];
      if (members.length != 0) {
        resolve(members);
        return;
      }
      parent.party_list.forEach((item, i) => {
        const entity = get_entity(item);
        if (entity) {
          members.push(entity);
        }
      });
      window.CACHED_MEMBERS = members;
      resolve(members);
    });
  }

  getBasicPartyMembers() {
    return new Promise((resolve, reject) => {
      resolve(parent.party_list);
    });
  }

  getMonsters() {
    return new Promise((resolve, reject) => {
      let entities = window.CACHED_MONSTERS || [];
      if (entities.length != 0) {
        resolve(entities);
        return;
      }
      Object.keys(parent.entities).forEach((item, i) => {
        entities.push(parent.entities[item]);
      });
      entities = entities.filter(entity => entity.type == "monster" && entity.mtype && entity.mtype != "target" && !entity.dead && entity.visible);
      window.CACHED_MONSTERS = entities;
      resolve(
        entities
      )
    });
  };

};

export default (new Lists());