const djs = require("discord.js");
const client = new djs.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "DIRECT_MESSAGES"
  ]
});
// const config = process.env;
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
const Database = require("@replit/database");
const db = new Database(config.replit_db);

// DM user if a target played recently
async function spy() {
  let cooldown = 60000; // 1 min cooldown default
  const keys = await db.list();
  for (let i = 0; i < keys.length; i++) {
    const user = await client.users.fetch(keys[i]).catch(() => null);
    // var data = checkTarget("194932883985530880", "G9LUYYQG8"); // for testing
    // console.log(data);
    if (!user) {
      cooldown = 1800000;
      console.log("Cooldown (ms): " + cooldown);
      setTimeout(spy, cooldown);
      return console.log("User not found");
    }

    const targets = await db.get(keys[i]);
    for (let i = 0; i < targets.length; i++) {
      if (await checkTarget(user, targets[i]))
        cooldown = 1800000; // half hour cooldown if target played recently
    }
  }
  console.log("Cooldown (ms): " + cooldown);
  setTimeout(spy, cooldown);
}
setTimeout(spy, 3000);

async function checkTarget(user, target) {
  let found = false;
  let minuteDiff = 5;
  let json = await fetch("https://api.clashroyale.com/v1/players/%23" + target + "/battlelog", myInit).then(safeParseJSON);
  // .then(res => {
  //   return res.json();
  // })
  // console.log(target);
  // console.log(json);
  // console.log("json length: " + json.length);
  if (json.length > 0) {
    // var n = json[0]["team"].length;
    // if (n > 0)
    //   ign = json[0]["team"][n - 1]["name"];
    // console.log("Target: #" + target);
    var battleTime = json[0]["battleTime"];
    // console.log(battleTime);
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
  if (minuteDiff < 5) {
    let ign = "";
    const playerJson = await fetch("https://api.clashroyale.com/v1/players/%23" + target, myInit).then(safeParseJSON);
    ign = playerJson.name;
    const msg = ign + " (" + target + ") has played a match in the last 5 minutes!";
    console.log(msg);
    await user.send(msg).catch(() => {
      console.log("User has DMs closed or no mutual servers with the bot");
      return;
    });
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

async function addTag(userID, targetTag) {
  const targets = await db.get(userID);
  if (targets != null && targets.includes(targetTag))
    return false;
  if (targets == null) {
    await db.set(userID, [targetTag]);
  } else {
    targets.push(targetTag);
    await db.set(userID, targets);
  }
  return true;
}

async function deleteTag(userID, targetTag) {
  const targets = await db.get(userID)
  if (targets == null || !targets.includes(targetTag))
    return false;
  const index = targets.indexOf(targetTag);
  if (index > -1)
    targets.splice(index, 1); // 2nd parameter means remove one item only
  await db.set(userID, targets);
  return true;
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
  const cmd = messageArray[0];
  const args = msg.content.substring(msg.content.indexOf(' ') + 1);
  const prefix = config.prefix;

  if (cmd === prefix + 'ping') {
    msg.author.send({
      content: 'pong!'
    }).catch(() => {
      console.log("User has DMs closed or no mutual servers with the bot");
      return;
    });
    msg.channel.send({
      content: 'pong!'
    });
  } else if (cmd === prefix + 'spy') {
    const targetTag = args;
    added = await addTag(msg.author.id, targetTag);
    if (added)
      msg.channel.send("New target tag " + targetTag + " added.");
    else
      msg.channel.send("Target tag " + targetTag + " already tracked!");
  } else if (cmd === prefix + 'stop') {
    const targetTag = args;
    deleted = await deleteTag(msg.author.id, targetTag);
    if (deleted)
      msg.channel.send("Tag " + targetTag + " deleted.");
    else
      msg.channel.send("Tag " + targetTag + " does not exist!");
  } else if (cmd === prefix + 'list') {
    targets = await db.get(msg.author.id);
    if (targets.length > 0)
      msg.channel.send(targets.toString());
    else
      msg.channel.send("You have no targets!");
  }
});

client.login(config.token);
