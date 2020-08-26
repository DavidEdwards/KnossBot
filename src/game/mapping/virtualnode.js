import Constants from "../../constants";
import NodeTree from "./nodetree";

// Credit to whomever originally coded this. Likely from the Adventure Land Discord.
export default class VirtualNode extends NodeTree {
  constructor(parent, x, y) {
    super(parent.region, [], parent.root, -1);

    this.x = x;
    this.y = y;

    this.parent = parent;
    this.neighbors = [parent];

    let neighbors = parent.get_neighbors();

    for (let neighbor of neighbors) {
      if (!neighbor.has_sight(this)) continue;
      this.neighbors.push(neighbor);
      neighbor.get_neighbors().push(this);
    }

    neighbors.push(this);
  }

  destroy() {
    for (let neighbor of this.neighbors) {
      let neighbor_neighbors = neighbor.get_neighbors();
      neighbor_neighbors.splice(neighbor_neighbors.indexOf(this), 1);
    }
  }
}