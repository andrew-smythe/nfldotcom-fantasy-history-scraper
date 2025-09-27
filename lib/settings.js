const fs = require('fs');

module.exports = {
    downloadAllSettings: async function(db, page, baseUrl, firstYear, lastYear) {
        for (let year = firstYear; year <= lastYear; year++) {

            try {
                // Navigate to draft page and scrape data
                let url = baseUrl + '/' + year + '/settings';
                console.log('Navigating to ' + url);
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
                    // Get each player from the current year's draft
                    console.log('Downloading league settings for ' + year);
                    let attempts = 0;
                    while (attempts < 10) {
                        try {
                            await page.waitForSelector('.settingsContent .formItems li div', { visible: true, timeout: 5000 });
                            break;
                        } catch (e) { 
                            attempts++;
                            if (attempts == 10) {
                                console.error('ERROR - 10 attempts made. Carrying on.');
                            }
                        }
                    }

                    await page.waitForTimeout(500);
                    await page.screenshot({ path: 'screenshots/' + 'settings-' + year + '.png', fullPage: true });
                    
                    // Find data on the page
                    let settings = await page.evaluate(() => {
                        let numTeamsHtml = document.querySelectorAll('.settingsContent .formItems li div')[3].innerHTML;
                        let settings = {};
                        settings.numTeams = parseInt(numTeamsHtml);

                        let rawWeeksHtml = document.querySelectorAll('.settingsContent .formItems li div')[2].innerHTML;
                        let matches = rawWeeksHtml.match(/(\d+)/g);
                        let numMatches = matches.length;
                        settings.numPlayoffTeams = parseInt(matches[numMatches-1]);
                        settings.numRegSeasonWeeks = parseInt(matches[0] - 1);
                        settings.numPlayoffWeeks = numMatches - 1;

                        return settings;
                    });
                    settings.year = year;
                    
                    try {
                        // Add settings to DB
                        await db.query('\
                            INSERT INTO `leaguesettings` (year, numWeeksRegular, numWeeksPlayoffs, numTeams, numTeamsPlayoffs)\
                            VALUES (' + settings.year + ', ' + settings.numRegSeasonWeeks + ', ' + settings.numPlayoffWeeks + ', ' + settings.numTeams + ', ' + settings.numPlayoffTeams + ')'
                        );
                    }
                    catch(error) {
                        fs.appendFileSync('error.txt', 'ERROR: Could not write league settings for year ' + year + '\r\n' + error);
                        console.log('ERROR: Could not write league settings for year ' + year + '\r\n' + error);
                    }
                    
                }
                catch (error) {
                    fs.appendFileSync('error.txt', 'ERROR: Could not scrape league settings for year ' + year + '\r\n' + error);
                    console.log('ERROR: Could not scrape league settings for year ' + year + '\r\n' + error);
                }
            }
            catch (error) {
                fs.appendFileSync('error.txt', 'ERROR: Could not navigate to league settings for year ' + year + '\r\n' + error);
                console.log('ERROR: Could not navigate to league settings for year ' + year + '\r\n' + error);
            }
        }
    }
};