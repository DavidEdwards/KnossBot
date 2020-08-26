import CliClient from "./cli/CliClient";

(async () => {
  if (process.argv.length != 6) {
    console.log("You need to provide the region, character name, email and password of your character in order to use this interface. As an example:");
    console.log("node cli.js EU/I MyCharName email@example.com MySuperSecretPasswordTm");
    return;
  }

  const region = process.argv[2];
  const characterName = process.argv[3];
  const email = process.argv[4];
  const password = process.argv[5];

  const client = new CliClient(region, characterName, email, password);
  client.start();
})();