// First attempt at CLI.

import fs from "fs";

const {
  webkit
} = require('playwright');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  let code = false;
  try {
    code = fs.readFileSync('dist/main.js', 'utf8');
  } catch (e) {
    console.log('Error:', e.stack);
  }
  if (!code) {
    console.log("You have no code.");
    return;
  }

  if (process.argv.length != 6) {
    console.log("You need to provide the region, character name, email and password of your character in order to use this interface. As an example:");
    console.log("node cli.js EU/I MyCharName email@example.com MySuperSecretPasswordTm");
    return;
  }

  const region = process.argv[2];
  const characterName = process.argv[3];
  const email = process.argv[4];
  const password = process.argv[5];

  console.log("Region:", region);
  console.log("Character:", characterName);
  console.log("Email:", email);
  console.log("URL:", 'https://adventure.land/character/' + characterName + '/in/' + region + '/');

  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Load Adventure Land page");
  await page.goto('https://adventure.land/character/' + characterName + '/in/' + region + '/#' + email + '|' + password);

  await sleep(2000);

  console.log("Logging in");
  await page.evaluate(() => {
    if (!window.location.hash) return;
    let data = window.location.hash.substring(1).split("|");
    let email = data[0];
    let password = data[1];

    console.log("Perform login call");
    api_call_l('signup_or_login', {
      email: email,
      password: password,
      only_login: true
    }, {
      disable: $(this)
    });
  });

  await sleep(2000);

  console.log("Reload page to enter as " + characterName);
  await page.reload({
    waitUntil: "networkidle"
  });

  await sleep(2000);

  page.on('console', msg => {
    console.log(`${msg.args().map(a => a.toString().substring("JSHandle@".length)).join(" ")}`);
  });

  await sleep(2000);

  await page.evaluate((code) => {
    //toggle_code();

    codemirror_render.doc.setValue(code);

    start_runner();
  }, code);

  await sleep(2000);

  setInterval(async () => {
    await page.screenshot({
      path: characterName + '.png'
    });
  }, 2000);

  //await browser.close();
})();