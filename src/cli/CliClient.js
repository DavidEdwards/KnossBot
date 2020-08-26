import Constants from "../constants";
import Utils from "../utils";
import Lists from "../game/lists";
import Filters from "../game/filters";
import Sorting from "../game/sorting";
import fs from "fs";
// import path from "path";

const {
  chromium
} = require('playwright');

export default class CliClient {

  constructor(region, characterName, email, password) {
    // path.dirname(require.main.filename);

    this.code = false;
    try {
      this.code = fs.readFileSync('dist/main.js', 'utf8');
      Utils.debug("Code is", this.code.length, "long.");
    } catch (e) {
      Utils.debug('Error:', e.stack);
    }
    if (!this.code) {
      Utils.debug("You have no code.");
      throw new Exception("No code");
    }

    this.region = region;
    this.characterName = characterName;
    this.email = email;
    this.password = password;
    this.url = 'https://adventure.land/character/' + characterName + '/in/' + region + '/';

    Utils.debug("Region:", this.region);
    Utils.debug("Character:", this.characterName);
    Utils.debug("Email:", this.email);
    Utils.debug("URL:", this.url);
  }

  async initBrowser() {
    this.browser = await chromium.launch();
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    // this.page.setDefaultTimeout(120000);

    // this.page.route('**', route => {
    //   Utils.debug(route.request().url());
    //   route.continue();
    // });
  }

  async completeLogin() {
    if (this.page.isClosed()) return;

    Utils.debug("Load Adventure Land page");
    await this.page.goto(this.url);

    await Utils.sleep(2000);

    Utils.debug("Logging in");
    await this.page.evaluate(([email, password]) => {
      Utils.debug("Perform login call");
      api_call_l('signup_or_login', {
        email: email,
        password: password,
        only_login: true
      }, {
        disable: $(this)
      });
    }, [this.email, this.password]);

    // await Utils.sleep(500);
    // this.page.on('console', msg => {
    //   Utils.debug(`${msg.args().map(a => a.toString().substring("JSHandle@".length)).join(" ")}`);
    // });

    // Utils.debug("Enter as " + this.characterName);
    // await this.page.evaluate(characterName => {
    //   Utils.debug(characterName);
    //   Utils.debug(JSON.stringify(X));
    //   Utils.debug(JSON.stringify(X.characters));
    //   Utils.debug(JSON.stringify(parent.X.characters));
    //   Utils.debug(JSON.stringify(parent.X.characters.filter(c => c.name == characterName)));
    //   // let id = parent.X.characters.filter(c => c.name == characterName)[0].id;
    //   let id = "4527658847698944";
    //
    //   if (!observe_character(characterName)) {
    //     log_in(user_id, id, user_auth);
    //   }
    // }, this.characterName);


    // Utils.debug("Reload page to enter as " + this.characterName);
    // await this.page.reload({
    //   waitUntil: "networkidle"
    // });

    // await Utils.sleep(2000);
  }

  async enterCharacter(characterName) {
    if (this.page.isClosed()) return;

    Utils.debug("Enter as " + characterName);
    await this.page.evaluate(characterName => {
      // let id = "4527658847698944";

      server_addr = 'eu2.adventure.land';
      server_port = '2083';
      init_socket();

      setTimeout(() => {
        if (!observe_character(characterName)) {
          // Utils.debug(characterName);
          // Utils.debug(JSON.stringify(X));
          // Utils.debug(JSON.stringify(X.characters));
          // Utils.debug(JSON.stringify(parent.X.characters));
          // Utils.debug(JSON.stringify(parent.X.characters.filter(c => c.name == characterName)));
          let id = parent.X.characters.filter(c => c.name == characterName)[0].id;

          log_in(user_id, id, user_auth);
        }
      }, 5000);
    }, characterName);
  }

  async reload() {
    Utils.debug("Reload page to enter as " + this.characterName, this.url);
    // await this.page.reload({
    //   waitUntil: "networkidle"
    // });

    this.page.close();

    this.page = await this.context.newPage();
    await this.page.goto(this.url);
  }

  async enableLogging() {
    if (this.page.isClosed()) return;

    this.page.on('console', msg => {
      Utils.debug(`${msg.args().map(a => a.toString().substring("JSHandle@".length)).join(" ")}`);
    });
  }

  async setUserCode() {
    if (this.page.isClosed()) return;

    await this.page.evaluate((code) => {
      //toggle_code();

      codemirror_render.doc.setValue(code);

      start_runner();
    }, this.code);
  }

  async findDimensions() {
    if (this.page.isClosed()) return;

    this.dimensions = await this.page.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        deviceScaleFactor: window.devicePixelRatio
      }
    });
    Utils.debug("Dimensions:", this.dimensions);
  }

  async generateScreenshots(ms) {
    setInterval(() => {
      if (this.screenshotting) return;

      this.generateScreenshot();
    }, ms);
  }

  async generateScreenshot() {
    if (this.page.isClosed()) return;
    this.screenshotting = true;

    try {
      let width = 400;
      let height = 400;

      let x = (this.dimensions.width / 2) - (width / 2);
      let y = (this.dimensions.height / 2) - (height / 2);

      await this.page.screenshot({
        path: this.characterName + '.jpg',
        type: "jpeg",
        quality: 50,
        clip: {
          x,
          y,
          width,
          height
        }
      });
    } catch (e) {
      try {
        await this.page.screenshot({
          path: this.characterName + '.jpg',
          type: "jpeg",
          quality: 50
        });
      } catch (e) {}
    }

    this.screenshotting = false;
  }

  async start() {
    await this.initBrowser();
    await Utils.sleep(5000);
    await this.completeLogin();
    await Utils.sleep(2000);
    await this.enableLogging();
    await Utils.sleep(5000);
    await this.findDimensions();
    // await Utils.sleep(500);
    // await this.reload();
    // await Utils.sleep(5000);
    // await this.enableLogging();
    await this.enterCharacter(this.characterName);
    await Utils.sleep(5000);
    await this.setUserCode();
    await Utils.sleep(2000);

    this.generateScreenshots(2000);
  }

}