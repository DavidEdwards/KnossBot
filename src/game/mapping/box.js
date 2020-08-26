import Constants from "../../constants";
import Utils from "../../utils";

// Credit to whomever originally coded this. Likely from the Adventure Land Discord.
export default class Box {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    // Utils.debug("Box", x1, y1, x2, y2);

    // draw_line(x1, y1, x1, y2, 1, 0x0033FF);
    //
    // draw_line(x1, y2, x2, y2, 1, 0x0033FF);
    //
    // draw_line(x2, y2, x1, y2, 1, 0x0033FF);
    //
    // draw_line(x1, y2, x1, y1, 1, 0x0033FF);

    this.draw();
  }

  draw() {
    // draw_line(this.x1, this.y1, this.x1, this.y2, 1, 0x0033FF);
    // draw_line(this.x1, this.y2, this.x2, this.y2, 1, 0x0033FF);
    // draw_line(this.x2, this.y2, this.x2, this.y1, 1, 0x0033FF);
    // draw_line(this.x2, this.y1, this.x1, this.y1, 1, 0x0033FF);

    // if (Utils.distanceFrom({
    //     x: this.x1,
    //     y: this.y1
    //   }) < 500) {
    // draw_line(this.x1, this.y1, this.x2, this.y2, 1, 0x0033FF);
    // draw_line(this.x2, this.y1, this.x1, this.y2, 1, 0x0033FF);
    // }
  }

  width() {
    return this.x2 - this.x1;
  }

  height() {
    return this.y2 - this.y1;
  }

  contains(x, y) {
    return (this.x1 < x && x < this.x2 &&
      this.y1 < y && y < this.y2);
  }

  intersects(box) {
    return (this.x1 <= box.x2 &&
      box.x1 <= this.x2 &&
      this.y1 <= box.y2 &&
      box.y1 <= this.y2);
  }

  intersects_segment(ox, oy, invdx, invdy) {
    let t1 = (this.x1 - ox) * invdx;
    let t2 = (this.x2 - ox) * invdx;
    let t3 = (this.y1 - oy) * invdy;
    let t4 = (this.y2 - oy) * invdy;

    let tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    let tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tmax < 0) return false;
    if (tmax > 1 || tmin > tmax) return false;

    return true;
  }
}