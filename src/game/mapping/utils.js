import Heap from 'heap';
import Constants from "../../constants";
import NodeTree from "./nodetree";
import Box from "./box";
import Utils from "../../utils";

const MappingUtils = class MappingUtils {

  constructor() {
    this.trees = {};
    this.lines = [];
  }

  async get(map) {
    map = map || character.map
    if (!this.trees[map]) {
      this.trees[map] = await this.initialize_graph(map);
    }

    return this.trees[map];
  }

  async source(map) {
    map = map || character.map
    const tree = await this.get(map);

    let source = tree.get(character.x, character.y);

    if (!source) {
      // Utils.debug("No source found. Attempt to find one nearby.");

      let found = false;
      for (let i = 0; i < 10; i++) {
        let degrees = 0;
        while (degrees < 360) {
          const location = Utils.pointOnCircle(degrees, i * 5);
          location.x += character.x;
          location.y += character.y;

          source = tree.get(location.x, location.y);
          if (source) {
            found = true;
            break
          }
          degrees += 45;
        }
        if (found) break;
      }
    }

    return source;
  }

  async useDoor(toMap, fromMap) {
    if (!fromMap) fromMap = character.map;

    const doors = G.maps[fromMap].doors.sort((a, b) => {
      return Utils.distanceFrom({
        x: a[0],
        y: a[1]
      }) - Utils.distanceFrom({
        x: b[0],
        y: b[1]
      })
    });

    const closestDoor = toMap ? doors.filter(d => d[4] == toMap)[0] : doors[0];

    if (!closestDoor) {
      Utils.l("No matching door for " + toMap + " (in " + fromMap + ").");

      if (G.npcs.transporter.places[toMap] && G.npcs.transporter.places[toMap]) {
        const s = G.npcs.transporter.places[toMap];
        let transporter = G.maps[fromMap].npcs.find(n => n.id == "transporter");
        if (!transporter) {
          Utils.l("No matching transporter for " + toMap + " (in " + fromMap + ").");
          return;
        }

        if (!await this.moveCloseTo(transporter.position[0], transporter.position[1])) {
          Utils.l("Transport ", {
            to: toMap,
            s: s
          });
          parent.socket.emit("transport", {
            to: toMap,
            s: s
          });

          Utils.sleep(1000);
        }
      }

      return;
    }

    await this.moveToDoor(closestDoor);

    parent.socket.emit("transport", {
      to: closestDoor[4],
      s: closestDoor[5]
    });

    Utils.sleep(1000);
  }

  async moveToDoor(door) {
    Utils.debug("Moving to", JSON.stringify(door));

    const doorCenterX = (door[0] + door[0] + door[2]) / 2;
    const doorCenterY = (door[1] + door[1] + door[3]) / 2;

    if (!await this.moveCloseTo(doorCenterX, doorCenterY)) {
      Utils.l("No path to door for " + door[4]);
    }
  }

  async moveCloseTo(x, y) {
    Utils.debug("Moving to", x, ",", y);

    let path = [];
    let found = false;

    let drawings = [];

    for (let i = 0; i < 10; i++) {
      // let circle = draw_circle(x, y, i * 10, 2, 0x00ff00);

      let degrees = 0;
      while (degrees < 360) {
        const location = Utils.pointOnCircle(degrees, i * 10);
        location.x += x;
        location.y += y;
        // Utils.debug("try", degrees, location);

        // drawings.push(draw_circle(location.x, location.y, 3, 1, 0xff0000));
        await Utils.sleep(10);

        path = await this.findPath(location);
        if (path && path.length > 0) {
          found = true;
          break
        }
        degrees += 45;
      }

      // circle.destroy();
      if (found) break;
    }

    drawings.map(m => m.destroy());

    if (!path || path.length == 0) {
      return false;
    }

    path.unshift(await this.source());

    await this.moveOnPath(path);
  }

  async moveTo(location) {
    Utils.debug("Location", location.map);
    Utils.debug("Character", character.map);
    if (location.map && location.map != character.map) {
      let mapPath = await this.internal_find_map_path(character.map, location.map);
      Utils.debug("Maps to traverse first", mapPath);

      for (let i = 0; i < mapPath.length; i++) {
        const map = mapPath[i];
        const fromMap = i == 0 ? character.map : mapPath[i - 1];
        Utils.l("Traverse to '" + map + "'");
        await this.useDoor(map, fromMap);
      }
    }

    await Utils.sleep(500);
    while (is_transporting(character)) {
      await Utils.sleep(500);
    }
    await Utils.sleep(500);

    const path = await this.findPath(location);
    if (!path) return;

    path.unshift(await this.source());
    Utils.debug("Path", path);

    await this.moveOnPath(path);
  }

  async findPath(location) {
    this.destroyAllLines();

    const map = location.map || character.map;
    const x = location.x;
    const y = location.y;

    const tree = await this.get(map);
    // Utils.debug(tree);

    let source = false;
    try {
      source = await this.source();
    } catch (e) {
      console.error(e);
    }
    // Utils.debug("source", source);
    // source.drawRegion();
    if (!source) {
      // Utils.debug("No source");
      return;
    }

    let destination = false;
    try {
      destination = tree.get(x, y);
    } catch (e) {
      console.error(e);
    }
    // destination.drawRegion();
    if (!destination) {
      // Utils.debug("No destination");
      return;
    }

    const path = await this.internal_find_path(source, destination);
    // Utils.debug("path", path);

    return path;
  }

  async moveOnPath(path) {
    if (!path) return;
    path = path.filter(p => p != null);

    this.drawPath(path);

    for (let i = 0; i < path.length; i++) {
      let item = path[i];
      move(item.x, item.y);
      while (is_moving(character)) {
        await Utils.sleep(100);
      }
    }

    this.destroyAllLines();
  }

  destroyAllLines() {
    try {
      for (let i = 0; i < this.lines.length; i++) {
        this.lines[i].destroy();
      }
      this.lines = [];
    } catch (e) {
      console.error(e);
    }
  }

  drawPath(path) {
    if (!path || path.length <= 1) return;

    for (let i = 0; i < path.length - 1; i++) {
      const node1 = path[i].region;
      const node2 = path[i + 1].region;

      const x1 = (node1.x1 + node1.x2) / 2;
      const y1 = (node1.y1 + node1.y2) / 2;
      const x2 = (node2.x1 + node2.x2) / 2;
      const y2 = (node2.y1 + node2.y2) / 2;

      // Utils.debug("path", i, x1, y1, x2, y2);

      const line = draw_line(x1, y1, x2, y2, 1, 0x0033FF);
      this.lines.push(line);
    }
  }

  distance(a, b) {
    const x_dist = b.x - a.x;
    const y_dist = b.y - a.y;
    return Math.sqrt(x_dist * x_dist + y_dist * y_dist);
  }

  async internal_find_path(source, target) {
    /* eslint func-names:0, prefer-arrow-callback:0, no-var:0, vars-on-top:0 */
    this.list_id += 2;
    let closed_id = this.list_id - 1;
    let open_id = this.list_id;

    let open = new Heap(function(a, b) {
      return a.heuristic - b.heuristic;
    });

    let traveled = new Map();
    let parents = new Map();

    traveled.set(source, 0);
    parents.set(source, source);

    source.heuristic = this.distance(source, target);
    open.push(source);
    source.list_id = open_id;

    while (open.size()) {
      let current = open.pop();
      let parent = parents.get(current);
      let neighbors = current.get_neighbors();

      if (!parent.has_sight(current)) {
        let min_path = Infinity;
        let fastest_neighbor = null;
        for (let neighbor of neighbors) {
          if (neighbor.list_id == closed_id) {
            let path = traveled.get(neighbor) + this.distance(neighbor, current);
            if (path < min_path) {
              min_path = path;
              fastest_neighbor = neighbor;
            }
          }
        }

        parents.set(current, fastest_neighbor);
        traveled.set(current, min_path);

        parent = fastest_neighbor;
      }

      if (current == target) {
        break;
      }

      current.list_id = closed_id;

      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (neighbor.list_id == closed_id) continue;

        let old_path = traveled.get(neighbor) || Infinity;

        let new_path = traveled.get(parent) + this.distance(parent, neighbor);
        if (new_path < old_path) {
          traveled.set(neighbor, new_path);
          parents.set(neighbor, parent);

          neighbor.heuristic = new_path + this.distance(neighbor, target);
          if (neighbor.list_id == open_id) {
            open.updateItem(neighbor);
          } else {
            open.push(neighbor);
            neighbor.list_id = open_id;
          }
        }
      }
    }

    if (!parents.has(target)) return [];

    let path = [];
    let node = target;
    while (node && node != source) {
      path.unshift(node);
      node = parents.get(node);
    }

    return path;
  }

  calculate_size(actual_size) {
    let cur_size = Constants.GRAPH_RESOLUTION;

    while (cur_size < actual_size) {
      cur_size *= 2;
    }

    return cur_size;
  }

  // Credit to whomever originally coded this. Likely from the Adventure Land Discord.
  async initialize_graph(map_name) {
    this.list_id = 0;
    Utils.l("Initializing map graph");

    let map_data = parent.G.maps[map_name].data;

    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;

    let obstacles = [];

    for (let line of map_data.x_lines) {
      min_x = Math.min(min_x, line[0]);
      max_x = Math.max(max_x, line[0]);
      obstacles.push(new Box(
        line[0] - 8,
        line[1] - 8,
        line[0] + 8,
        line[2] + 12
      ));
    }

    for (let line of map_data.y_lines) {
      min_y = Math.min(min_y, line[0]);
      max_y = Math.max(max_y, line[0]);
      obstacles.push(new Box(
        line[1] - 8,
        line[0] - 8,
        line[2] + 8,
        line[0] + 12
      ));
    }

    let largest_side = Math.max(max_x - min_x, max_y - min_y);
    let side = this.calculate_size(largest_side);

    let center_x = (max_x + min_x) / 2;
    let center_y = (max_y + min_y) / 2;
    let region = await this.square(center_x, center_y, side);

    Utils.l("Starting node tree");
    let tree = new NodeTree(region, obstacles);
    Utils.l("Completed node tree");

    Utils.debug("Full node tree", tree);

    return tree;
  }

  square(cx, cy, side) {
    let half_side = side / 2;
    return new Box(cx - half_side, cy - half_side, cx + half_side, cy + half_side);
  }

  async internal_find_map_path(current_map, target_map, current_chain = []) {
    if (current_map === target_map) {
      // Already on the correct map
      return current_chain
    }
    for (let i = 0; i < G.maps[current_map].doors.length; i++) {
      let door = G.maps[current_map].doors[i]
      if (door[4] === target_map) {
        current_chain.push(target_map)
        return current_chain
      }
    }

    let valid_chains = []

    let places = Object.keys(G.npcs.transporter.places);
    if (G.npcs.transporter.places[current_map] && G.maps[current_map].npcs.find(n => n.id == "transporter")) {
      for (let i = 0; i < places.length; i++) {
        let place = places[i]
        if (current_chain.includes(place)) continue
        let new_chain = current_chain.slice();
        new_chain.push(place)
        new_chain = await this.internal_find_map_path(place, target_map, new_chain)
        if (new_chain && new_chain[new_chain.length - 1] === target_map) {
          // Dont want any chains that include our current map.
          if (!new_chain.includes(character.map)) {
            valid_chains.push(new_chain)
          }
        }
      }
    }

    for (let i = 0; i < G.maps[current_map].doors.length; i++) {
      let door = G.maps[current_map].doors[i]
      if (current_chain.includes(door[4])) continue
      let new_chain = current_chain.slice();
      new_chain.push(door[4])
      new_chain = await this.internal_find_map_path(door[4], target_map, new_chain)
      if (new_chain && new_chain[new_chain.length - 1] === target_map) {
        // Dont want any chains that include our current map.
        if (!new_chain.includes(character.map)) {
          valid_chains.push(new_chain)
        }
      }
    }

    //log(`Valid chains ${valid_chains}`)
    if (valid_chains.length > 0) {
      return valid_chains.sort(function(a, b) {
        return a.length - b.length
      })[0]
    }
    return []
  }
};

export default (new MappingUtils());