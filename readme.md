# KnossBot

KnossBot is JavaScript code written for the game Adventure Land.

## Features

* Builds created through webpack.
* Unified code *file* for all characters.
* Individual class file for each game character class.
* Parent character class for shared behaviours.
* Simplistic CLI support, using Playwright to run a headless browser.
* Inventory management.
 * Automatically deliver items to your merchant.
 * Scheduled resupply your fighters.
 * Automatic inventory sorting.
 * Locking of inventory slots to avoid sending important items to your merchant (Tracker for example!) and block sorting for that slot. Hold CTRL and click on an inventory slot to lock it.
* Persistence and communication provided through LocalStorage.
* A button under your skills on the right (looks like an empty square). This creates a popup that will give you options.
* Live statistics window. Credits to Allure_ from Discord.
* Mapping and path finding algorithms. Credits to whomever the code originally came from, let me know and I will amend this!

## Setup

Install Node and NPM.

Install required packages:

```bash
npm install
```

Edit the `.env.json.example` environment file and save it as `.env.json`. This is your configuration file.

Ensure that you change `partyMembersRegex` to match your potential characters. This uses regex to find matches.

Here are some example ways to match character names:
* https://regex101.com/r/H2Z56B/1
* https://regex101.com/r/bJV7bs/1

You can also add InfluxDB values to the environment file, if you want to log various statistics.

You can now run:

```bash
npm run build
```

Webpack will now watch for code changes and write builds to `dist/main.js`. You can copy the contents of that file directly into your Adventure Land character code window and run it.

## Additional Setup

Also of interest, is the list of items in `maxLevelOverride` in `merchant.js`. This will let you set specific items to upgrade / compound until a specific level. The default is to upgrade to a less dangerous point, in order to maximize item retention.
