const fs = require('fs');

module.exports = {
    downloadAllDraftResults: async function(db, page, baseUrl, firstYear, lastYear) {
        for (let year = firstYear; year <= lastYear; year++) {
            try {
                // Load all teams from given year from DB
                let teams = Array.from(await db.query('SELECT * from `teams` WHERE `year` = ' + year));

                try {
                    // Navigate to draft page and scrape data
                    let url = baseUrl + '/' + year + '/draftresults?draftResultsDetail=0&draftResultsTab=round&draftResultsType=results';
                    console.log('Navigating to ' + url);
                    await page.goto(url);
                    await page.screenshot({ path: 'screenshots/draft-' + year + '.png', fullPage: true });

                    try {
                        // Get each player from the current year's draft
                        console.log('Downloading draft results for ' + year);
                        let players = await page.evaluate(() => {
                            let resultData = Array.from(document.querySelectorAll('.wrap > ul > li'));
                            let players = [];
                            for (let data of resultData) {
                                let draftPos = parseInt(data.querySelector('span.count').innerHTML.match(/\d+/)[0]);
                                let name = data.querySelector('div.c a').innerHTML;
                                let position = data.querySelector('div.c em').innerHTML.match(/\w+/g)[0];
                                let team = data.querySelector('div.c em').innerHTML.match(/\w+/g)[1] ? data.querySelector('div.c em').innerHTML.match(/\w+/g)[1] : null;
                                let teamNflId = parseInt(data.querySelector('a[class^=team]').href.match(/(\d+)(?!.*\d)/)[0]);

                                players.push({
                                    draftPos: draftPos,
                                    name: name,
                                    position: position,
                                    team: team,
                                    teamNflId: teamNflId,
                                });
                            }
                            return players;
                        });

                        // Get team SQL ID for each player and insert into DB
                        for (let player of players) {
                            let teamId = teams.find(t => t.nflId === player.teamNflId && t.year === year)?.id;
                            if (!teamId) {
                                throw error('Could not find team for NFL ID ' + player.teamNflId + ' in year ' + year);
                            }
                            player.teamId = teamId;

                            try {
                                // Add draft result to DB
                                let team = player.team ? '"' + player.team + '"' : null;
                                await db.query('\
                                    INSERT INTO `draftresults` (name, team, position, draftPosition, teamId)\
                                    VALUES ("' + player.name + '", ' + team + ', "' + player.position + '", ' + player.draftPos + ', ' + player.teamId + ')'
                                );
                            }
                            catch(error) {
                                fs.appendFileSync('error.txt', 'ERROR: Could not enter draft result for ' + player.name + ' in year ' + year + '\r\n' + error);
                                console.log('ERROR: Could not enter draft result for ' + player.name + ' in year ' + year + '\r\n' + error);
                            }
                        }

                    }
                    catch (error) {
                        fs.appendFileSync('error.txt', 'ERROR: Could not load draft results for ' + year + '\r\n' + error);
                        console.log('error.txt', 'ERROR: Could not load draft results for ' + year + '\r\n' + error);
                    }

                    await page.waitForTimeout(2000);
                }
                catch (error) {
                    fs.appendFileSync('error.txt', 'ERROR: Could not scrape draft data for ' + year + '\r\n' + error);
                    console.log('ERROR: Could not scrape draft data for ' + year + '\r\n' + error);
                }
            }
            catch (error) {
                fs.appendFileSync('error.txt', 'ERROR: Could not load teams for year ' + year + '\r\n' + error);
                console.log('ERROR: Could not load teams for year ' + year + '\r\n' + error);
            }
        }
    }
}