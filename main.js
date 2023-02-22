const puppeteer = require('puppeteer');
const signin = require('./lib/signin.js');
const teams = require('./lib/teams.js');
const db = require('./lib/db.js');
const matchups = require('./lib/matchups.js');
const trades = require('./lib/trades.js');
const { resolve } = require('path');
const draft = require('./lib/draft.js');

const baseUrl = 'https://fantasy.nfl.com/league/33863/history';
const screenshotPath = 'screenshots/';

const firstYear = 2010;
const lastYear = 2022;

async function main() {
    const mysql = db.makeDb();
    
    // Test connection
    mysql.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
        if (error) throw error;
        console.log('Connected to database');
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    // Load Main Page
    await page.goto(baseUrl);
    let title = await page.evaluate(() => {
        return document.title;
    });

    // Sign In
    if (title === 'NFL Account Sign In') {
        await signin.signin(page);
        await page.screenshot({ path: screenshotPath + 'login.png', fullPage: true });
        console.log('Logged into NFL.com');
    }

    // Get Teams
    let managers = [];
    for (let year = firstYear; year <= lastYear; year++) {
        await page.goto(baseUrl + '/' + year + '/owners');
        await managers.push(await teams.get(page, year));
        await page.waitForTimeout(2000);
    }
    
    // Update teams in DB
    console.log('CREATE AND UPDATE TEAMS');
    await teams.createAndUpdateTeams(mysql, managers);

    // Download all weekly player stats into DB
    console.log('DOWNLOAD ALL WEEKLY PLAYER STATS');
    await teams.downloadAllWeeklyPlayerStats(mysql, page, baseUrl, managers);

    // Download all player matchups into DB
    console.log('DOWNLOAD ALL WEEKLY MATCHUPS');
    await matchups.downloadAllMatchups(mysql, page, baseUrl, managers);

    // Download all trades into DB
    console.log('DOWNLOAD ALL TRADES');
    await trades.downloadAllTrades(mysql, page, baseUrl, firstYear, lastYear);

    // Download all draft results into DB
    console.log('DOWNLOAD ALL DRAFT RESULTS');
    await draft.downloadAllDraftResults(mysql, page, baseUrl, firstYear, lastYear);

    await browser.close();
    console.log('Browser instance closed.');

    await mysql.close();
    console.log('Connection to DB closed.');
}
main();