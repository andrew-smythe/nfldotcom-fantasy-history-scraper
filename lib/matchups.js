const fs = require('fs');

module.exports = {
    downloadAllMatchups: async function(db, page, baseUrl, managers) {
        for (let i = 0; i < managers.length; i++) {
            // Configure weeks (all NFL fantasy seasons prior to 2021 had 16 weeks, all after had 17)
            let year = managers[i].year;
            let weeks = 16;
            if (year > 2020) {
                weeks = 17;
            }

            /*if (year < 2021) {
                continue;
            }*/

            for (let j = 0; j < managers[i].teams.length; j++) {
                // Check database for internal SQL team ID
                let sqlId = 0;
                let team = managers[i].teams[j];
                let result = await db.query('SELECT id FROM `teams` WHERE `year` = ' + year + ' AND `nflId` = ' + team.id);
                if (result.length > 0) {
                    sqlId = result[0].id;
                }
                if (sqlId > 0) {

                    // Download each weekly matchup
                    for (let w = 1; w <= weeks; w++) {
                        let url = baseUrl + '/' + year + '/teamgamecenter?teamId=' + team.id + '&week=' + w;
                        console.log('Navigating to ' + url + '...');
                        let attempts = 0;
                        while (attempts < 10) {
                            try {
                                await page.goto(url);
                                break;
                            } catch (e) { 
                                attempts++;
                                if (attempts == 10) {
                                    console.error('ERROR - 10 attempts made. Carrying on.');
                                }
                            }
                        }
    
                        try {
                            // Find opponent NFL ID for given week
                            let attempts = 0;
                            while (attempts < 10) {
                                try {
                                    await page.waitForSelector('.teamWrap-2 a', { visible: true, timeout: 5000 });
                                    break;
                                } catch (e) { 
                                    attempts++;
                                    if (attempts == 10) {
                                        console.error('ERROR - 10 attempts made. Carrying on.');
                                    }
                                }
                            }
                            await page.waitForTimeout(500);
                            let oppNflId = await page.evaluate(() => {
                                let oppData = document.querySelector('.teamWrap-2 a');
                                let opp = null;
                                if (oppData) {
                                    opp = oppData.href.match(/(\d+)(?!.*\d)/)[0];
                                }
                                return opp;
                            });

                            // Check database for opponent's internal SQL team ID
                            let oppSqlId = null;
                            if (oppNflId !== null) {
                                let result = await db.query('SELECT id FROM `teams` WHERE `year` = ' + year + ' AND `nflId` = ' + oppNflId);
                                if (result.length > 0) {
                                    oppSqlId = result[0].id;
                                }
                            }

                            // Create new matchup entry
                            try {
                                let result = await db.query('\
                                    INSERT INTO `matchups` (teamId, opponentId, week)\
                                    VALUES (' + sqlId + ', ' + oppSqlId + ', ' + w + ')'
                                );
                                console.log('Successfully added matchup for ' + team.teamName + ' in week ' + w + ' of ' + year);

                                await page.screenshot({ path: 'screenshots/' + 'matchup-' + team.id + '-' + year + '-' + w + '.png', fullPage: true });
                            }
                            catch (error) {
                                fs.appendFileSync('error.txt', 'ERROR: Could not insert matchup for ' + team.teamName + ' into DB for week ' + w + ' of ' + year + '\r\n' + error);
                                console.log('ERROR: Could not insert matchup for ' + team.teamName + ' into DB for week ' + w + ' of ' + year + '\r\n' + error);
                            }
                        }
                        catch (error) {
                            fs.appendFileSync('error.txt', 'ERROR: Could not find matchup data for player ' + team.id + ' in week ' + w + '(' + year + ')\r\n');
                            console.log('ERROR: Could not find matchup data for player ' + team.id + ' in week ' + w + '(' + year + ')\r\n');
                        }
                    }
                }
                else {
                    fs.appendFileSync('error.txt', 'ERROR: COULD NOT FIND TEAM with ID ' + team.id + ' in YEAR ' + year);
                    console.log('ERROR: COULD NOT FIND TEAM with ID ' + team.id + ' in YEAR ' + year);
                }
            }
        }
    }
}