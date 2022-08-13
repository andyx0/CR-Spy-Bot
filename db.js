const db = require('better-sqlite3')('./test.db');

// Create table
function createTable() {
    db.prepare("CREATE TABLE users(id INTEGER PRIMARY KEY, player_tag, watchers)").run();
}

// Drop table
function dropTable() {
    db.prepare("DROP TABLE users").run();
}

// Rename table columns
function renameColumn(currentName, newName) {
    db.prepare(`"ALTER TABLE users RENAME COLUMN ${currentName} TO ${newName}"`).run();
}

// Insert data into table
function addWatcher(tag, watcher_id) {
    const watchers = db.prepare("SELECT watchers FROM users WHERE player_tag = ?").get(tag);
    if (watchers != null) {
        let watcher_list = JSON.parse(watchers.watchers);
        if (watcher_list.includes(watcher_id))
            return false;
        watcher_list.push(watcher_id);
        update(tag, JSON.stringify(watcher_list));
    } else {
        const stmt = db.prepare("INSERT INTO users(player_tag, watchers) VALUES(?, ?)");
        stmt.run(tag, JSON.stringify([watcher_id]));
    }
    return true;
}

// Update data
function update(tag, watchers) {
    db.prepare("UPDATE users SET watchers = ? WHERE player_tag = ?").run(watchers, tag);
}

// Delete data
function deleteWatcher(tag, watcher_id) {
    const watchers = db.prepare("SELECT watchers FROM users WHERE player_tag = ?").get(tag);
    if (watchers == null)
        return false;
    let watcher_list = JSON.parse(watchers.watchers);
    if (!watcher_list.includes(watcher_id))
        return false;
    const index = watcher_list.indexOf(tag);
    watcher_list.splice(index, 1); // 2nd parameter means remove one item only
    update(tag, JSON.stringify(watcher_list));
    return true;
}

function deleteRow(tag) {
    db.prepare("DELETE FROM users WHERE player_tag = ?").run(tag);
}

function getPlayerTags() {
    const rows = db.prepare("SELECT player_tag FROM users").all();
    let result = [];
    for (const row of rows)
        result.push(row.player_tag);
    return result;
}

function getWatchers(player_tag) {
    const row = db.prepare("SELECT watchers FROM users WHERE player_tag = ?").get(player_tag);
    return JSON.parse(row.watchers);
}

function getTargets(watcher_id) {
    const rows = db.prepare("SELECT * FROM users").all();
    let targets = [];
    for (const row of rows) {
        watchers = JSON.parse(row.watchers);
        if (watchers.includes(watcher_id))
            targets.push(row.player_tag);
    }
    return targets;
}

// Query the data
function query() {
    // const stmt = db.prepare("SELECT * FROM users WHERE player_tag = ?");
    // const player = stmt.get('RP8VUYPVU');
    // console.log(player);
    const stmt = db.prepare("SELECT * FROM users");
    for (const row of stmt.iterate()) {
        console.log(row);
        console.log(row.player_tag);
    }
}

// createTable();
// dropTable();
// console.log(insert("test", "lol"));
// console.log(deleteData("test", "lol"));
// deleteRow("test");
// console.log(getPlayerTags());
// console.log(getWatchers("G9LUYYQG8"));
// console.log(getTargets("194932883985530880"));
// query();

module.exports = { addWatcher, deleteWatcher, getPlayerTags, getWatchers, getTargets };
