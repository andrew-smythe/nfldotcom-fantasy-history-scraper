const fs = require('fs');

module.exports = {
    get: async function(page, year) {
        console.log('Finding teams from ' + year);
        let teams = await page.evaluate(() => {
            let teamElements = Array.from(document.querySelectorAll('tr[class*=team-]'));
            return teamElements.map((team, i) => ({
                owner: team.querySelector('td.teamOwnerName li .userName').innerHTML,
                teamName: team.querySelector('td.teamImageAndName .teamName').innerHTML,
                id: parseInt(team.querySelector('td.teamImageAndName .teamName').href.match(/(\d+)(?!.*\d)/)[0]),
            }));
        });
        return {
            year: year,
            teams: teams,
        }
    },
    createAndUpdateTeams: async function(db, managers) {
        // Insert each team into the database
        for (let i = 0; i < managers.length; i++) {
            console.log('Checking DB for teams from ' + managers[i].year + '...');
            
            for (let j = 0; j < managers[i].teams.length; j++) {
                let dbManager;
                let dbTeam;
                let sqlId;
                let team = managers[i].teams[j];

                // Check if manager exists in database. Add them if they do not.
                let result = await db.query('SELECT id, username FROM `users` WHERE username = "' + team.owner + '" LIMIT 1');
                if (result.length > 0) {
                    dbManager = result[0];
                }
                
                if (dbManager === undefined) {
                    console.log(team.owner + ' not found in DB.');
                    let result = await db.query('INSERT INTO `users` (`username`) VALUES ("' + team.owner + '")');
                    if (result) {
                        sqlId = result.insertId;
                        console.log('Added ' + team.owner + ' to DB with ID ' + sqlId);
                    }
                }
                else {
                    sqlId = dbManager.id;
                }

                // Check if team exists in the database
                result = await db.query('SELECT name, year, userId, nflId FROM `teams` WHERE year = ' + managers[i].year + ' AND userId = ' + sqlId);
                if (result.length > 0) {
                    dbTeam = result[0];
                }
    
                // Add team to database if it doesn't already exist
                if (dbTeam === undefined) {
                    console.log(team.teamName + ' (NFL ID ' + team.id + ') not found in DB.');
                    let result = await db.query('INSERT INTO `teams` (`name`, `year`, `userId`, `nflId`)\
                                                 VALUES ("' + team.teamName + '", ' + managers[i].year + ', ' + sqlId + ', ' + team.id + ')');
                    if (result) {
                        console.log('Added ' + team.teamName + ' (' + managers[i].year + ', NFL ID ' + team.id + ') to DB.');
                    }
                }
            }
            console.log('');
        }
    },
    downloadAllWeeklyPlayerStats: async function(db, page, baseUrl, managers) {
        for (let i = 0; i < managers.length; i++) {
            // Configure weeks (all NFL fantasy seasons prior to 2021 had 16 weeks, all after had 17)
            let year = managers[i].year;
            let weeks = 16;
            if (year > 2020) {
                weeks = 17;
            }

            // Get Roster Position IDs from DB
            let rosterPositions = await db.query('SELECT id, position FROM `rosterpositions`');
            if (rosterPositions.length > 0) {
                // Download all player stats for each week of the season for each team
                for (let j = 0; j < managers[i].teams.length; j++) {
                    for (let k = 1; k <= weeks; k++) {
                        console.log('Reading player stats for ' + managers[i].teams[j].teamName + ' (Team ' + managers[i].teams[j].id + ', ' + year + ' - Week ' + k + ')');
                        await module.exports.downloadPlayerStats(db, page, baseUrl, rosterPositions, managers[i].year, k, managers[i].teams[j].id);
                    }
                }
            }
            else {
                fs.appendFileSync('error.txt', 'ERROR: Could not load roster positions from DB\r\n',);
                console.log('ERROR: Could not load roster positions from DB');
            }
        }
    },
    downloadPlayerStats: async function (db, page, baseUrl, rosterPositions, year, week, teamId) {
        // When I ran this script for the first time, a few weeks were missed. This was
        // because the page did not load correctly, and the script just moved on. You can
        // uncomment these lines and specify certain players' weeks/years to only allow the script
        // to download that missing player data.
        /*if (!(teamId == 9 && (week == 8 || week == 14) && year == 2016)) {
            return;
        }*/

        // Go to the specified team's roster for the given week
        let url = baseUrl + '/' + year + '/teamhome?statCategory=stats&statSeason=' + year + '&statType=weekStats' + '&statWeek=' + week + '&teamId=' + teamId + '&week=' + week;
        console.log('Navigating to ' + url + '...');
        await page.goto(url); 

        try {
            // Pull all player data for given week
            let players = await page.evaluate(() => {
                let playerElements = Array.from(document.querySelectorAll('tr[class^=player-]'));

                return playerElements.map((team, i) => ({
                    name: team.querySelector('td.playerNameAndInfo a') ? team.querySelector('td.playerNameAndInfo a').innerHTML : null,
                    position: team.querySelector('td.playerNameAndInfo em') ? team.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g)[0] : null,
                    rosterPosition: team.querySelector('td.teamPosition span').innerHTML,
                    team: team.querySelector('td.playerNameAndInfo em') ? (team.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g).length > 1 ? team.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g)[1] : null) : null,
                    opponent: team.querySelector('td.playerOpponent').innerHTML.length > 0 ? (!team.querySelector('td.playerOpponent .bye') ? team.querySelector('td.playerOpponent').innerHTML : 'BYE') : null,
                    passingYards: !isNaN(parseInt(team.querySelector('td.stat_5 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_5 span')?.innerHTML) : null,
                    passingTds: !isNaN(parseInt(team.querySelector('td.stat_6 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_6 span')?.innerHTML) : null,
                    passingInts: !isNaN(parseInt(team.querySelector('td.stat_7 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_7 span')?.innerHTML) : null,
                    rushingYards: !isNaN(parseInt(team.querySelector('td.stat_14 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_14 span')?.innerHTML) : null,
                    rushingTds: !isNaN(parseInt(team.querySelector('td.stat_15 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_15 span')?.innerHTML) : null,
                    receivingYards: !isNaN(parseInt(team.querySelector('td.stat_21 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_21 span')?.innerHTML) : null,
                    receivingTds: !isNaN(parseInt(team.querySelector('td.stat_22 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_22 span')?.innerHTML) : null,
                    fumbles: !isNaN(parseInt(team.querySelector('td.stat_30 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_30 span')?.innerHTML) : null,
                    twoPoints: !isNaN(parseInt(team.querySelector('td.stat_32 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_32 span')?.innerHTML) : null,
                    pats: !isNaN(parseInt(team.querySelector('td.stat_33 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_33 span')?.innerHTML) : null,
                    nineteenFgs: !isNaN(parseInt(team.querySelector('td.stat_35 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_35 span')?.innerHTML) : null,
                    twentynineFgs: !isNaN(parseInt(team.querySelector('td.stat_36 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_36 span')?.innerHTML) : null,
                    thirtynineFgs: !isNaN(parseInt(team.querySelector('td.stat_37 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_37 span')?.innerHTML) : null,
                    fourtynineFgs: !isNaN(parseInt(team.querySelector('td.stat_38 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_38 span')?.innerHTML) : null,
                    fiftyFgs: !isNaN(parseInt(team.querySelector('td.stat_39 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_39 span')?.innerHTML) : null,
                    sacks: !isNaN(parseInt(team.querySelector('td.stat_45 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_45 span')?.innerHTML) : null,
                    defenseInts: !isNaN(parseInt(team.querySelector('td.stat_46 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_46 span')?.innerHTML) : null,
                    fumbleRecoveries: !isNaN(parseInt(team.querySelector('td.stat_47 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_47 span')?.innerHTML) : null,
                    safeties: !isNaN(parseInt(team.querySelector('td.stat_49 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_49 span')?.innerHTML) : null,
                    defenseTds: !isNaN(parseInt(team.querySelector('td.stat_50 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_50 span')?.innerHTML) : null,
                    returnTds: !isNaN(parseInt(team.querySelector('td.stat_53 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_53 span')?.innerHTML) : null,
                    pointsAllowed: !isNaN(parseInt(team.querySelector('td.stat_54 span')?.innerHTML)) ? parseInt(team.querySelector('td.stat_54 span')?.innerHTML) : null,
                    totalPoints: !isNaN(parseFloat(team.querySelector('td.statTotal span')?.innerHTML)) ? parseFloat(team.querySelector('td.statTotal span')?.innerHTML) : null,
                    gameUrl: team.querySelector('td.playerGameStatus .sg a')?.href ?? null,
                }));
            });
            
            // Get SQL ID for current team / year
            let sqlId = 0;
            let result = await db.query('SELECT id FROM `teams` WHERE `year` = ' + year + ' AND `nflId` = ' + teamId);
            if (result.length > 0) {
                sqlId = result[0].id;
            }
            if (sqlId > 0) {
                for (let i = 0; i < players.length; i++) {
                    // Skip empty roster slots
                    if (players[i].name === null) {
                        continue;
                    }
                    // Find roster position ID
                    let rosterPositionId = rosterPositions.find(rp => rp.position === players[i].rosterPosition)?.id;
                    if (rosterPositionId) {
                        // Insert players into database
                        try {
                            // String fields that could be null
                            let team = players[i].team !== null ? '"' + players[i].team + '"' : null;
                            let position = players[i].position !== null ? '"' + players[i].position + '"' : null;
                            let gameUrl = players[i].gameUrl !== null ? '"' + players[i].gameUrl + '"' : null;

                            let result = await db.query('\
                                INSERT INTO `weeklyplayerstats` \
                                (teamId, week, name, team, opponent, playerPosition, rosterPositionId, \
                                passingYards, passingTds, passingInts, \
                                rushingYards, rushingTds, \
                                receivingYards, receivingTds, \
                                fumbles, twoPoints, \
                                nineteenFgs, twentynineFgs, thirtynineFgs, fourtynineFgs, fiftyFgs, \
                                sacks, defenseInts, fumbleRecoveries, safeties, defenseTds, returnTds, pointsAllowed, \
                                totalPoints, gameUrl) \
                                VALUES (' + sqlId + ', ' + week + ', "' + players[i].name + '", ' + team + ', "' + players[i].opponent + '", ' + position + ', ' + rosterPositionId + ', '
                                + players[i].passingYards + ', ' + players[i].passingTds + ', ' + players[i].passingInts
                                + ', ' + players[i].rushingYards + ', ' + players[i].rushingTds
                                + ', ' + players[i].receivingYards + ', ' + players[i].receivingTds
                                + ', ' + players[i].fumbles + ', ' + players[i].twoPoints
                                + ', ' + players[i].nineteenFgs + ', ' + players[i].twentynineFgs + ', ' + players[i].thirtynineFgs + ', ' + players[i].fourtynineFgs + ', ' + players[i].fiftyFgs
                                + ', ' + players[i].sacks + ', ' + players[i].defenseInts + ', ' + players[i].fumbleRecoveries + ', ' + players[i].safeties + ', ' + players[i].defenseTds + ', ' + players[i].returnTds + ', ' + players[i].pointsAllowed
                                + ', ' + players[i].totalPoints + ', ' + gameUrl + '\
                            )');

                            console.log('Successfully added stats for ' + players[i].name + ' on week ' + week + ' of ' + year + ' for team ID ' + teamId);

                        } catch (error) {
                            fs.appendFileSync('error.txt', 'ERROR: Could not insert ' + players[i].name + ' into DB for team ' + teamId + ' (YEAR ' + year + ', week ' + week + ')\r\n' + error);
                            console.log('ERROR: Could not insert ' + players[i].name + ' into DB for team ' + teamId + ' (YEAR ' + year + ', week ' + week + ')', error);
                        }
                    }
                }
            }
            else {
                fs.appendFileSync('error.txt', 'ERROR: COULD NOT FIND TEAM with ID ' + teamId + ' in YEAR ' + year);
                console.log('ERROR: COULD NOT FIND TEAM with ID ' + teamId + ' in YEAR ' + year);
            }
        }
        catch (error) {
            fs.appendFileSync('error.txt', 'ERROR reading players for team ' + teamId + ' from week ' + week + ' of year ' + year + '\r\n' + error + '\r\n');
            console.log('ERROR reading players for team ' + teamId + ' from week ' + week + ' of year ' + year + '\r\n' + error + '\r\n');
        }

        await page.screenshot({ path: 'screenshots/' + 'players-' + teamId + '-' + year + '-' + week + '.png', fullPage: true });
        await page.waitForTimeout(500);


    }
}