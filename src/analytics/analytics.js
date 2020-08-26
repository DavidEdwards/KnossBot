import env from "../../.env.json";
import {
  InfluxDB,
  Point,
  HttpError
} from '@influxdata/influxdb-client';

export default class Analytics {
  constructor() {
    this.statsRateLimit = 1000;

    const url = env.influxdbUrl;
    const token = env.influxdbToken;
    const org = env.influxdbOrganisation;
    const bucket = env.influxdbBucket;

    console.log("Analytics connecting to", url);

    try {
      this.writeApi = new InfluxDB({
        url,
        token
      }).getWriteApi(org, bucket, 'ns')

      this.writeApi.useDefaultTags({
        character: character.name
      })

      console.log("Analytics should be connected.");
    } catch (e) {
      console.error(e);
    }
  }

  stats() {
    const timeNow = (new Date()).getTime();
    if (timeNow - (this.lastStatsTime || 0) < this.statsRateLimit) {
      return;
    }
    this.lastStatsTime = timeNow;

    try {
      const point = new Point('stats')
        .intField('hp', character.hp)
        .intField('mp', character.mp)
        .intField('gold', character.gold)
        .intField('ping', parseInt(character.ping))
        .intField('xp', character.xp)

        .intField('exp_per_minute', parseInt(character.exp_per_minute))
        .intField('exp_per_hour', parseInt(character.exp_per_hour))
        .intField('gold_per_minute', parseInt(character.gold_per_minute))
        .intField('gold_per_hour', parseInt(character.gold_per_hour))
        .intField('time_to_level', isFinite(character.time_to_level) ? character.time_to_level : 0.0)
        .intField('runtime', isFinite(character.runtime) ? character.runtime : 0.0)

        .floatField('hp_percent', (character.hp / character.max_hp))
        .floatField('mp_percent', (character.mp / character.max_mp));
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  bought(name, amount, gold) {
    let priceOfItem = gold;
    if (!priceOfItem) {
      try {
        priceOfItem = G.items[name].g;
      } catch (e) {
        console.error(e);
      }
    }
    if (!priceOfItem) {
      console.error("Could not determine price of '" + name + "'");
    }

    let totalBought = amount || 1;

    try {
      const point = new Point('trade')
        .tag('item', name)
        .stringField('item_name', name)
        .intField('total', totalBought)
        .intField('item_price', priceOfItem)
        .intField('gold', priceOfItem * totalBought);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  looted(name) {
    let priceOfItem = 0;
    if (!priceOfItem) {
      try {
        priceOfItem = G.items[name].g;
      } catch (e) {
        console.error(e);
      }
    }
    if (!priceOfItem) {
      console.error("Could not determine price of '" + name + "'");
    }

    try {
      const point = new Point('loot')
        .stringField('item_name', name)
        .intField('item_price', priceOfItem);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  usedHpPotion() {
    try {
      const point = new Point('hp-potion')
        .intField('value', 1);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  usedMpPotion() {
    try {
      const point = new Point('mp-potion')
        .intField('value', 1);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  usedRegenHp() {
    try {
      const point = new Point('hp-regen')
        .intField('value', 1);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }

  usedRegenMp() {
    try {
      const point = new Point('mp-regen')
        .intField('value', 1);
      this.writeApi.writePoint(point);
    } catch (e) {
      console.error(e);
    }
  }
}