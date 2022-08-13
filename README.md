# CR-Spy-Bot
Discord bot written in Node.js that constantly checks if any friends recently played a match through the official Clash Royale API.
If the bot finds that a friend played recently, it sends a direct message notification on Discord. Friend lists for each user are saved through a SQLite database.


## Running the application
Download the source code from the repository and compile all the source code, then run the index file.

* Run: `node index.js`


## Dependencies
* [Node.js](https://nodejs.org/en/)
* [Discord.js](https://discord.js.org/#/)
* [node-fetch](https://www.npmjs.com/package/node-fetch)
* [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)
