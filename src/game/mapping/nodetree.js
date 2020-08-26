import Constants from "../../constants";
import Box from "./box";

// Credit to whomever originally coded this. Likely from the Adventure Land Discord.
export default class NodeTree {
  constructor(region, obstacles, root, level) {
    if (!level) {
      this.level = Math.ceil(Math.log2(region.width() / Constants.GRAPH_RESOLUTION));
    } else {
      this.level = level;
    }

    if (root) {
      this.root = root;
    } else {
      this.root = this;
    }

    this.region = region;

    this.x = (region.x1 + region.x2) / 2;
    this.y = (region.y1 + region.y2) / 2;

    this.obstacles = obstacles;

    this.crossable = true;
    this.is_leaf = false;

    if (this.obstacles.length == 0) {
      this.is_leaf = true;
    } else if (this.level == 0) {
      this.is_leaf = true;
      this.crossable = false;
    }

    this.quads = null;
    this.neighbors = null;

    this.list_id = 0;
    this.heuristic = 0;

    if (!this.is_leaf) {
      this.subdivide();
    }
  }

  drawRegion() {
    if (this.region) {
      this.region.draw();
    }
  }

  get_quad(x, y) {
    if (x < this.x && y < this.y) return this.quads[0];
    else if (x >= this.x && y < this.y) return this.quads[1];
    else if (x < this.x && y >= this.y) return this.quads[2];
    return this.quads[3];
  }

  subdivide() {
    this.quads = [];

    let l = this.region.x1;
    let r = this.region.x2;
    let t = this.region.y1;
    let b = this.region.y2;

    // if (r - l < 30) return;
    // if (b - t < 30) return;

    let x = this.x;
    let y = this.y;

    let subregions = [
      new Box(l, t, x, y),
      new Box(x, t, r, y),
      new Box(l, y, x, b),
      new Box(x, y, r, b),
    ];

    let obstacles = this.obstacles;
    for (let i = 0; i < subregions.length; i++) {
      let subregion = subregions[i];
      let subregion_obstacles = [];

      for (let j = 0; j < obstacles.length; j++) {
        let obstacle = obstacles[j];
        if (subregion.intersects(obstacle)) {
          subregion_obstacles.push(obstacle);
        }
      }

      this.quads[i] = new NodeTree(subregion, subregion_obstacles, this.root, this.level - 1);
    }
  }

  get(x, y) {
    if (!this.region.contains(x, y)) return null;
    if (this.is_leaf) return this;
    let quad = this.get_quad(x, y);
    if (!quad) return null;
    return quad.get(x, y);
  }

  get_neighbors() {
    if (!this.is_leaf) throw new Error('Tried getting neighbors of non-leaf node');
    if (this.neighbors) return this.neighbors;

    let left = this.region.x1;
    let right = this.region.x2;
    let top = this.region.y1;
    let bottom = this.region.y2;

    let min_size = this.region.width() * (2 ** -this.level);
    let num_neighbors = 2 ** this.level;

    let neighbor_set = new Set();

    // Top and bottom (and corners).
    for (let x = -(num_neighbors + 1); x <= (num_neighbors + 1); x += 2) {
      let real_x = this.x + min_size * (x / 2);

      let neighbor = this.root.get(real_x, top - min_size / 2);
      if (neighbor && neighbor.crossable) neighbor_set.add(neighbor);

      neighbor = this.root.get(real_x, bottom + min_size / 2);
      if (neighbor && neighbor.crossable) neighbor_set.add(neighbor);
    }

    // Left and right.
    for (let y = -(num_neighbors - 1); y <= (num_neighbors - 1); y += 2) {
      let real_y = this.y + min_size * (y / 2);

      let neighbor = this.root.get(left - min_size / 2, real_y);
      if (neighbor && neighbor.crossable) neighbor_set.add(neighbor);

      neighbor = this.root.get(right + min_size / 2, real_y);
      if (neighbor && neighbor.crossable) neighbor_set.add(neighbor);
    }

    this.neighbors = [...neighbor_set];

    return this.neighbors;
  }

  get_containing(a, b) {
    if (this.is_leaf) return this;

    let a_quad = this.get_quad(a.x, a.y);
    let b_quad = this.get_quad(b.x, b.y);

    if (a_quad == b_quad) return a_quad.get_containing(a, b);

    return this;
  }

  has_sight(node) {
    let ancestor = this.root.get_containing(this, node);
    let obstacles = ancestor.obstacles;

    let min_x = Math.min(node.x, this.x);
    let max_x = Math.max(node.x, this.x);
    let min_y = Math.min(node.y, this.y);
    let max_y = Math.max(node.y, this.y);

    let invdx = 1 / (node.x - this.x);
    let invdy = 1 / (node.y - this.y);

    for (let i = 0; i < obstacles.length; i++) {
      let obstacle = obstacles[i];
      if (max_x >= obstacle.x1 && min_x <= obstacle.x2 &&
        max_y >= obstacle.y1 && min_y <= obstacle.y2 &&
        obstacle.intersects_segment(this.x, this.y, invdx, invdy)) {
        return false;
      }
    }

    return true;
  }
}