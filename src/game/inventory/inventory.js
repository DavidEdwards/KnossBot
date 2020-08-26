import Constants from "../../constants";
import Utils from "../../utils";

export default class Inventory {
  static fromData(mapping, lockedSlots) {
    return new Inventory(mapping, lockedSlots);
  }

  static fromStorage() {
    let allInventories = JSON.parse(localStorage.getItem("INVENTORIES2") || "{}");
    let myInventory = allInventories[character.name] || {
      mapping: {},
      lockedSlots: []
    };
    return new Inventory(myInventory.mapping, myInventory.lockedSlots);
  }

  constructor(mapping, lockedSlots) {
    this.canSort = false;

    this.SORTING_DEBOUNCE_DELAY = 300;

    this.lastSort = 0;
    this.lastInventoryClickTime = 0;

    this.processing = false;
    this.totalSlots = character.items.length;

    if (mapping && lockedSlots) {
      this.mapping = mapping;
      this.lockedSlots = lockedSlots;
    } else {
      throw new Exception("Missing inventory data");
    }

    this.tempParent = parent;

    const mutationCallback = (mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          this.postRenderInventory();
        }
      }
    }

    const bottomCorner = parent.document.getElementById("bottomleftcorner");
    const observeOptions = {
      childList: true,
      subtree: true
    };
    const observer = new MutationObserver(mutationCallback);
    observer.observe(bottomCorner, observeOptions);

    this.refresh();
  }

  postRenderInventory() {
    for (let i = 0; i < this.totalSlots; i++) {
      this.updateInventorySlotUi(i);
    }

    const inv = parent.document.getElementsByClassName("theinventory")[0];
    if (!inv) return;

    inv.querySelectorAll("div[data-cnum]").forEach(item => {
      const children = item.getElementsByTagName('*');
      if (children.length == 0) {
        if (item.inventoryClickEvent) {
          item.removeEventListener("click", item.inventoryClickEvent);
          item.inventoryClickEvent = null;
        }
        item.inventoryClickEvent = (event) => {
          this.inventoryClick(event);
        };
        item.addEventListener("click", item.inventoryClickEvent);
      } else {
        for (let i = -1, l = children.length; ++i < l;) {
          const child = children[i];
          if (child.inventoryClickEvent) {
            child.removeEventListener("click", child.inventoryClickEvent);
            child.inventoryClickEvent = null;
          }
          child.inventoryClickEvent = (event) => {
            this.inventoryClick(event);
          };
          child.addEventListener("click", child.inventoryClickEvent);
        }
      }
    });
  }

  inventoryClick(event) {
    const timeNow = (new Date()).getTime();
    if (timeNow - this.lastInventoryClickTime < 200) {
      return;
    }
    this.lastInventoryClickTime = timeNow;

    let slotClickedOn = parseInt(event.target.getAttribute("data-cnum"));
    if (!Number.isInteger(slotClickedOn)) {
      slotClickedOn = parseInt(event.target.parentElement.getAttribute("data-cnum"));
      if (!Number.isInteger(slotClickedOn)) {
        slotClickedOn = parseInt(event.target.parentElement.parentElement.getAttribute("data-cnum"));
        if (!Number.isInteger(slotClickedOn)) {
          slotClickedOn = parseInt(event.target.parentElement.parentElement.parentElement.getAttribute("data-cnum"));
        }
      }

      if (!Number.isInteger(slotClickedOn)) {
        return;
      }
    }

    if (event.ctrlKey) {
      event.preventDefault();
      this.toggleSlotLockedState(slotClickedOn);
      this.updateInventorySlotUi(slotClickedOn);
    } else if (event.altKey) {
      event.preventDefault();

      const item = character.items[slotClickedOn];


      parent.window.tempDialog = document.createElement("div");
      parent.window.tempDialog.style.color = "#000000";
      parent.window.tempDialog.style.background = "#ffffff";
      parent.window.tempDialog.style.border = "#000000";
      parent.window.tempDialog.style.width = "200px";
      parent.window.tempDialog.style.height = "200px";
      parent.window.tempDialog.style.left = "50%";
      parent.window.tempDialog.style.top = "50%";
      parent.window.tempDialog.style.padding = "20px";
      parent.window.tempDialog.style.marginLeft = "-125px";
      parent.window.tempDialog.style.marginTop = "-125px";
      parent.window.tempDialog.style.zIndex = 999;
      parent.window.tempDialog.style.position = "absolute";
      parent.window.tempDialog.innerHTML = "<h1>Sending " + item.name + "</h1><p><label for='inventory_send_to'>Send to whom:</label><br /><input type='text' id='inventory_send_to' /></p><p><label for='inventory_send_amount'>How many:</label><br /><input type='text' id='inventory_send_amount' /></p><p><button id='inventory_send_cancel'>Cancel</button>&nbsp;&nbsp;<button id='inventory_send_now'>Trade</button></p>";
      parent.document.body.appendChild(parent.window.tempDialog);

      parent.document.getElementById("inventory_send_cancel").onclick = () => {
        parent.document.body.removeChild(parent.window.tempDialog);
      };

      parent.document.getElementById("inventory_send_now").onclick = () => {
        const name = parent.document.getElementById("inventory_send_to").value;
        const amount = parent.document.getElementById("inventory_send_amount").value;
        send_item(name, slotClickedOn, amount);
        parent.document.body.removeChild(parent.window.tempDialog);
        Utils.debug("Send", amount, item.name, "to", name);
      };
    } else {
      // Normal click
    }
  }

  updateInventorySlotUi(slot) {
    const inv = parent.document.getElementsByClassName("theinventory")[0];
    if (!inv) return;

    const slotElement = inv.querySelectorAll("div[data-cnum='" + slot + "']")[0];
    if (!slotElement) return;

    if (this.isSlotLocked(slot)) {
      slotElement.style.background = "#331100"
      const children = slotElement.getElementsByTagName('*');
      for (let i = -1, l = children.length; ++i < l;) {
        const child = children[i];
        child.style.background = "#331100";
      }
    } else {
      slotElement.style.background = "black"
      const children = slotElement.getElementsByTagName('*');
      for (let i = -1, l = children.length; ++i < l;) {
        const child = children[i];
        child.style.background = "black";
      }
    }
  }

  isSlotLocked(slot) {
    return this.lockedSlots.indexOf(slot) !== -1;
  }

  toggleSlotLockedState(slot) {
    const index = this.lockedSlots.indexOf(slot)
    if (index !== -1) {
      this.lockedSlots.splice(index, 1);
    } else {
      this.lockedSlots.push(slot);
    }
  }

  transferUnlockedItemsTo(entity, transferDistance) {
    if (this.processing) return;
    this.processing = true;

    if (Utils.isString(entity)) {
      entity = get_player(entity);
    }

    const maxDistance = transferDistance || 500;

    if (entity && entity.map == character.map && Utils.distanceFrom(entity) < maxDistance) {
      Object.keys(this.mapping).forEach((name, itemIndex) => {
        const item = this.getItem(name);

        item.slots.forEach((subItem, slotIndex) => {
          if (!this.isSlotLocked(subItem.slot)) {
            send_item(entity.name, subItem.slot, subItem.amount);
          }
        });
      });
    }

    this.processing = false;
  }

  printOutUnlockedItems() {
    Object.keys(this.mapping).forEach((name, itemIndex) => {
      const item = this.getItem(name);

      item.slots.forEach((subItem, slotIndex) => {
        if (!this.isSlotLocked(subItem.slot)) {
          Utils.debug("Unlocked item", name, subItem.slot, subItem.amount);
        }
      });
    });
  }

  hasItem(name) {
    return this.mapping[name] ? true : false;
  }

  countItem(name) {
    if (!this.mapping[name]) return 0;
    return this.mapping[name].total || 0;
  }

  getItem(name) {
    return this.mapping[name];
  }

  getItemSlots(name) {
    if (!this.mapping[name]) return [];
    return this.mapping[name].slots || [];
  }

  swapSlots(a, b) {
    parent.socket.emit("imove", {
      "a": a,
      "b": b
    });
  }

  sortInventoryStep() {
    if (!this.canSort) return;

    const timeNow = (new Date()).getTime();
    if (timeNow - this.lastSort < this.SORTING_DEBOUNCE_DELAY) {
      return;
    }

    if (character.q.upgrade || character.q.compound || character.q.exchange) {
      // Stop sorting when there is a process working
      return;
    }

    this.lastSort = timeNow;

    let tempList = Object.assign([], character.items);
    tempList.forEach((item, i) => {
      if (item == null) return;
      if (this.isSlotLocked(i)) item.locked = true;
      item.index = i;
    });
    tempList = tempList.filter(i => i != null);

    let sortedList = Object.assign([], tempList);
    sortedList.sort((a, b) => {
      if (a.locked || b.locked) return 0;

      let nameCompare = a.name.localeCompare(b.name);
      if (nameCompare != 0) return nameCompare;

      let levelCompare = a.level - b.level;
      return levelCompare;
    });

    sortedList.forEach((item, i) => {
      item.toIndex = i;
    });

    sortedList = sortedList.filter((i, index) => !i.locked && i.index != index);

    if (sortedList.length > 0) {
      let toSort = sortedList[0];
      // Double check
      if (!this.isSlotLocked(toSort.index) && !this.isSlotLocked(toSort.toIndex)) {
        Utils.debug("Sorting", toSort.name, "from slot", toSort.index, "to", toSort.toIndex);
        this.swapSlots(toSort.index, toSort.toIndex);
      }
    }
  }

  async refresh() {
    if (this.processing) return;
    this.processing = true;

    this.sortInventoryStep();

    this.mapping = {};
    this.slotsFilled = character.items.reduce((accumulator, current) => !!current ? accumulator + 1 : accumulator, 0);
    this.slotsEmpty = this.totalSlots - this.slotsFilled;

    character.items.forEach((item, i) => {
      if (!item) return;
      if (this.mapping[item.name]) {
        this.mapping[item.name].total += item.q || 1;
        this.mapping[item.name].slots.push({
          slot: i,
          amount: item.q || 1,
          raw: item
        });
      } else {
        this.mapping[item.name] = {
          total: item.q || 1,
          slots: [{
            slot: i,
            amount: item.q || 1,
            raw: item
          }]
        };
      }
    });

    let allInventories = JSON.parse(localStorage.getItem("INVENTORIES2") || "{}");
    allInventories[character.name] = {
      mapping: this.mapping,
      lockedSlots: this.lockedSlots.filter(i => Number.isInteger(i))
    };
    localStorage.setItem("INVENTORIES2", JSON.stringify(allInventories));

    this.processing = false;
    this.canSort = true;
  }
}