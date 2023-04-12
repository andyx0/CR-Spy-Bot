const db = require('better-sqlite3')('./bot.db');

// Create table
function createTable() {
    db.prepare("CREATE TABLE watches(watcher VARCHAR(18) NOT NULL, player_tag NOT NULL, PRIMARY KEY(watcher, player_tag))").run();
}

// Drop table
function dropTable() {
    db.prepare("DROP TABLE watches").run();
}

// Rename table columns
function renameColumn(currentName, newName) {
    const stmt = db.prepare("ALTER TABLE watches RENAME COLUMN ? TO ?");
    stmt.run(currentName, newName);
}

// Insert data into table
function addWatcher(tag, watcher_id) {
    try {
        const stmt = db.prepare("INSERT INTO watches(watcher, player_tag) VALUES(?, ?)");
        stmt.run(watcher_id, tag);
        return true;
    } catch {
        return false;
    }
}

function insertStarterTargets() {
    const stmt = db.prepare("INSERT INTO watches(watcher, player_tag) VALUES(?, ?)");
    for (let i = 0; i < starterTargets.length; i++) {
        stmt.run("194932883985530880", starterTargets[i]);
    }
}

// Delete data
function deleteWatcher(tag, watcher_id) {
    const stmt = db.prepare("DELETE FROM watches WHERE watcher = ? AND player_tag = ?");
    const info = stmt.run(watcher_id, tag);
    return info.changes > 0;
}

function deleteRow(tag) {
    db.prepare("DELETE FROM watches WHERE player_tag = ?").run(tag);
}

function getPlayerTags() {
    const rows = db.prepare("SELECT DISTINCT player_tag FROM watches").all();
    const result = [];
    for (const row of rows) {
        result.push(row.player_tag);
    }
    return result;
}

function getWatchers(player_tag) {
    const rows = db.prepare("SELECT watcher FROM watches WHERE player_tag = ?").all(player_tag);
    const result = [];
    for (const row of rows) {
        result.push(row.watcher);
    }
    return result;
}

function getTargets(watcher_id) {
    const rows = db.prepare("SELECT player_tag FROM watches WHERE watcher = ?").all(watcher_id);
    const targets = [];
    for (const row of rows) {
        targets.push(row.player_tag);
    }
    return targets;
}

// Query the data
function query() {
    const stmt = db.prepare("SELECT * FROM watches");
    for (const row of stmt.iterate()) {
        console.log(row);
    }
}

// createTable();
// dropTable();
// console.log(addWatcher("2G08CVJ9", "194932883985530880"));
// console.log(addWatcher("test", ""));
// console.log(deleteWatcher("2G08CVJ9", "194932883985530880"));
// console.log(deleteWatcher("test", ""));
// deleteRow("g9luyyqg8");
// console.log(getPlayerTags());
// console.log(getWatchers("2G08CVJ9"));
// console.log(getTargets("194932883985530880"));
// insertStarterTargets();
// query();

module.exports = { addWatcher, deleteWatcher, getPlayerTags, getWatchers, getTargets };
