const djs = require("discord.js");
const client = new djs.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "DIRECT_MESSAGES"
  ]
});
const config = require('./config');
const fetch = require("node-fetch");
const myInit = {
  method: 'GET',
  headers: {
    "Authorization": "Bearer " + config.cr_key,
  },
  mode: 'cors',
  cache: 'default',
};
const db = require('./db');

async function spy() {
  let cooldown = 60000; // 1 min cooldown default
  const player_tags = db.getPlayerTags();
  for (let i = 0; i < player_tags.length; i++)
    if (await checkTarget(player_tags[i]))
      cooldown = 1800000; // half hour cooldown if target played recently
  console.log("Cooldown (ms): " + cooldown);
  setTimeout(spy, cooldown);
}
setTimeout(spy, 3000);

async function checkTarget(target) {
  let found = false;
  let minuteDiff = 5;
  let json = await fetch("https://api.clashroyale.com/v1/players/%23" + target + "/battlelog", myInit).then(safeParseJSON);
  if (json.length > 0) {
    var battleTime = json[0]["battleTime"];
    var present = new Date();
    var year = parseInt(battleTime.substring(0, 4));
    var month = parseInt(battleTime.substring(4, 6)) - 1;
    var day = parseInt(battleTime.substring(6, 8));
    var hour = parseInt(battleTime.substring(9, 11)) - 4;
    var minute = parseInt(battleTime.substring(11, 13));
    var second = parseInt(battleTime.substring(13, 15));
    var lastBattle = new Date(year, month, day, hour, minute, second);
    console.log("Current time: " + present);
    console.log("Last battle time: " + lastBattle);
    minuteDiff = (present - lastBattle) / 1000; // timeDiff in seconds
    minuteDiff /= 60.0; // timeDiff in minutes
    console.log("Minute difference: " + minuteDiff);
  }
  // Message watchers if target played recently
  if (minuteDiff < 5) {
    const ign = await getPlayerName(target);
    const msg = `"${ign} (${target}) has played a match in the last 5 minutes!"`;
    console.log(msg);
    const users = db.getWatchers(target);
    for (let x = 0; x < users.length; x++) {
      const user = await client.users.fetch(users[x]) // .catch(err => console.error(err));
      if (!user) {
        console.log("User not found");
        return true;
      }
      user.send(msg).catch(() => {
        console.log("User has DMs closed or no mutual servers with the bot");
        return;
      });
    }
    found = true;
  }
  return found;
}

async function safeParseJSON(response) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch (err) {
    console.error("Error:", err);
    console.error("Response body:", body);
    // throw err
    return ReE(response, err.message, 500);
  }
}

async function getPlayerName(playerTag) {
  const playerJson = await fetch("https://api.clashroyale.com/v1/players/%23" + playerTag, myInit).then(safeParseJSON);
  return playerJson.name;
}

client.on('ready', () => {
  client.user.setActivity("Clash Royale players", { type: "WATCHING" });
  console.log(client.user.username + ' is online.');
});

client.on('messageCreate', async (msg) => {
  if (!msg.content.startsWith(config.prefix) || msg.author.bot)
    return;
  // if (msg.author.bot || msg.channel.type === "dm")
  //   return;
  const messageArray = msg.content.split(' ');
  const cmd = messageArray[0].substring(2);
  const targetTag = msg.content.substring(msg.content.indexOf(' ') + 1).toUpperCase();

  switch (cmd) {
    case 'ping':
      msg.author.send('pong!').catch(() => {
        console.log("User has DMs closed or no mutual servers with the bot");
        return;
      });
      msg.channel.send('pong!');
      break;
    case 'help': // todo
      msg.channel.send("My prefix is `c!`. Type `c!spy <tag>` to watch a player, `c!stop <tag>` to stop watching a player, and `c!list` to see your current targets!");
      break;
    case 'spy':
      const playerName = await getPlayerName(targetTag);
      const validPlayerTag = (playerName != null);
      if (validPlayerTag) {
        added = db.addWatcher(targetTag, msg.author.id);
        if (added)
          msg.channel.send(`New target ${playerName} (${targetTag}) added!`);
        else
          msg.channel.send(`Target ${playerName} (${targetTag}) already tracked!`);
      } else {
        msg.channel.send("Invalid player tag!");
      }
      break;
    case 'stop':
      deleted = db.deleteWatcher(targetTag, msg.author.id);
      if (deleted)
        msg.channel.send(`Tag ${targetTag} deleted!`);
      else
        msg.channel.send(`Tag ${targetTag} is not tracked!`);
      break;
    case 'list':
      targets = db.getTargets(msg.author.id);
      if (targets.length > 0)
        msg.channel.send(targets.join(", "));
      else
        msg.channel.send("You have no targets!");
      break;
  }
});

client.login(config.token);
