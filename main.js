const puppeteer = require('puppeteer');
const signin = require('./lib/signin.js');
const teams = require('./lib/teams.js');
const db = require('./lib/db.js');
const matchups = require('./lib/matchups.js');
const trades = require('./lib/trades.js');
const { resolve } = require('path');
const draft = require('./lib/draft.js');
const leagueSettings = require('./lib/settings.js');
const fs = require('fs');

const baseUrl = 'https://fantasy.nfl.com/league/33863/history';
const screenshotPath = 'screenshots/';

async function main() {

    try {
        let settings = JSON.parse(fs.readFileSync('settings.json'));
        const mysql = db.makeDb(settings.db.host, settings.db.user, settings.db.password, settings.db.database);
        
        // Test connection
        mysql.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
            if (error) throw error;
            console.log('Connected to database');
        });

        const browser = await puppeteer.launch(/*{'headless': false}*/);
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(10000);
        await page.setViewport({
            width: 1920,
            height: 1080,
        });

        // Load Main Page
        await page.goto(baseUrl);
        await page.screenshot({ path: screenshotPath + 'before-login.png', fullPage: true });

        await page.waitForSelector('input[inputmode=email]', { visible: true, timeout: 0 });
        let title = await page.evaluate(() => {
            return document.title;
        });

        await page.screenshot({ path: screenshotPath + 'first-login.png', fullPage: true });

        // Sign In
        if (title === 'NFL Account Sign In') {

                await signin.signin(page, settings.nflUsername, settings.nflPassword);
                await page.screenshot({ path: screenshotPath + 'login.png', fullPage: true });
                await page.waitForSelector('a[href="/myleagues"]', { visible: true, timeout: 0 });        
                console.log('Logged into NFL.com');

            // Get Teams
            let managers = [];
            for (let year = settings.firstYear; year <= settings.lastYear; year++) {
                await page.goto(baseUrl + '/' + year + '/owners');
                await managers.push(await teams.get(page, year));
                await page.screenshot({ path: screenshotPath + 'teams-' + year + '.png', fullPage: true });
            }

            // Get league settings
            console.log('DOWNLOAD LEAGUE SETTINGS');
            await leagueSettings.downloadAllSettings(mysql, page, baseUrl, settings.firstYear, settings.lastYear);

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
            await trades.downloadAllTrades(mysql, page, baseUrl, settings.firstYear, settings.lastYear);
        
            // Download all draft results into DB
            console.log('DOWNLOAD ALL DRAFT RESULTS');
            await draft.downloadAllDraftResults(mysql, page, baseUrl, settings.firstYear, settings.lastYear);
        }
        else {
            console.log('UNABLE TO SIGN INTO NFL.com. Check screenshot to see if login page has changed.');
            console.log('Page title was ' + title);
        }

        await browser.close();
        console.log('Browser instance closed.');

        await mysql.close();
        console.log('Connection to DB closed.');
    }
    catch (e) {
        console.error('ERROR - Could not read settings from settings.json');
        console.error(e);
    }
}
main();