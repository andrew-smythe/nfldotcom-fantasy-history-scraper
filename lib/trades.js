const fs = require('fs');

module.exports = {
    downloadAllTrades: async function(db, page, baseUrl, firstYear, lastYear) {
        for (let year = firstYear; year <= lastYear; year++) {
            try {
                // Load all teams from given year from DB
                let teams = Array.from(await db.query('SELECT * from `teams` WHERE `year` = ' + year));

                try {
                    // Navigate to trades page and scrape data
                    let url = baseUrl + '/' + year + '/transactions?transactionType=trade';
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
                        let attempts = 0;
                        while (attempts < 10) {
                            try {
                                await page.waitForSelector('tr[class^=transaction-trade-]', { visible: true, timeout: 5000 });
                                break;
                            } catch (e) { 
                                attempts++;
                                if (attempts == 10) {
                                    console.error('ERROR - 10 attempts made. Carrying on.');
                                }
                            }
                        }

                        await page.waitForTimeout(500);
                        await page.screenshot({ path: 'screenshots/' + 'trades-' + year + '.png', fullPage: true });
                        let trades = await page.evaluate(() => {
                            let allTrades = document.querySelectorAll('tr[class^=transaction-trade-]');
                            let tradesFrom = Array.from(allTrades).filter(t => /-1$/.test(t.classList[0]));
                            
                            let tradeIds = tradesFrom.map(t => parseInt(t.classList[0].match(/-(\d+)-/)[1]));

                            let trades = [];
                            for (let t of tradeIds) {
                                let players = [];

                                // Get players from first team of trade
                                let firstTeamRow = document.querySelector('tr.transaction-trade-' + t + '-1');
                                let firstTeamPlayerTags = firstTeamRow.querySelectorAll('td.playerNameAndInfo ul li');
                                let team1NflId = parseInt(firstTeamRow.querySelector('td.transactionFrom a').href.match(/(\d+)(?!.*\d)/)[0]);
                                let team2NflId = parseInt(firstTeamRow.querySelector('td.transactionTo a').href.match(/(\d+)(?!.*\d)/)[0]);
                                for (let p of firstTeamPlayerTags) {
                                    players.push({
                                        name: p.querySelector('a').innerHTML,
                                        position: p.querySelector('em').innerHTML.match(/\w+/g)[0],
                                        team: p.querySelector('em').innerHTML.match(/\w+/g)[1] ? p.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g)[1] : null,
                                        originalTeamNflId: team1NflId,
                                        newTeamNflId: team2NflId,
                                    });
                                }

                                // Get players from second team of trade
                                let secondTeamRow = document.querySelector('tr.transaction-trade-' + t + '-2');
                                let secondTeamPlayerTags = secondTeamRow.querySelectorAll('td.playerNameAndInfo ul li');
                                for (let p of secondTeamPlayerTags) {
                                    players.push({
                                        name: p.querySelector('a').innerHTML,
                                        position: p.querySelector('em').innerHTML.match(/\w+/g)[0],
                                        team: p.querySelector('em').innerHTML.match(/\w+/g)[1] ? p.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g)[1] : null,
                                        originalTeamNflId: team2NflId,
                                        newTeamNflId: team1NflId,
                                    });
                                }

                                // Get any players that may have been dropped
                                let droppedPlayersRow = document.querySelector('tr.transaction-trade-' + t + '-3,tr.transaction-trade-' + t + '-4');
                                if (droppedPlayersRow) {
                                    let droppedPlayerTags = droppedPlayersRow.querySelectorAll('td.playerNameAndInfo ul li');
                                    for (let p of droppedPlayerTags) {
                                        players.push({
                                            name: p.querySelector('a').innerHTML,
                                            position: p.querySelector('em').innerHTML.match(/\w+/g)[0],
                                            team: p.querySelector('em').innerHTML.match(/\w+/g)[1] ? p.querySelector('td.playerNameAndInfo em').innerHTML.match(/\w+/g)[1] : null,
                                            originalTeamNflId: parseInt(droppedPlayersRow.querySelector('td.transactionFrom a').href.match(/(\d+)(?!.*\d)/)[0]),
                                            newTeamNflId: null,
                                        });
                                    }
                                }
                                
                                // Check if trade was vetoed
                                let vetoed = firstTeamRow.querySelector('td.transactionType').innerHTML === 'Trade Vetoed' ? true : false;

                                trades.push({
                                    players: players,
                                    vetoed: vetoed,
                                    team1NflId: team1NflId,
                                    team2NflId: team2NflId,
                                });
                            }
                            return trades;
                        });

                        for (let t of trades) {
                            // Get SQL team IDs and add to trades
                            let team1Id = teams.find(e => e.nflId === t.team1NflId && e.year === year)?.id;
                            if (!team1Id) {
                                throw new Error('Could not find team for NFL ID ' + t.team1NflId);
                            }

                            let team2Id = teams.find(e => e.nflId === t.team2NflId && e.year === year)?.id;
                            if (!team2Id) {
                                throw new Error('Could not find team for NFL ID ' + t.team2NflId);
                            }

                            // Add trades to DB
                            try {
                                let result = await db.query('INSERT INTO `trades` (team1, team2, vetoed, year) VALUES (' + team1Id + ', ' + team2Id + ', ' + t.vetoed + ', ' + year + ')');
                                let tradeId = result.insertId;

                                for (let p of t.players) {
                                    // Get SQL team IDs and add to players
                                    let originalTeamId = teams.find(e => e.nflId === p.originalTeamNflId && e.year === year)?.id;
                                    if (!originalTeamId) {
                                        throw new Error('Could not find team for player ' + p.name + ' from team with NFL ID ' + p.originalTeamNflId);
                                    }
        
                                    // Second team can be null - this means the player has been dropped
                                    // as a result of the trade
                                    let newTeamId = teams.find(e => e.nflId === p.newTeamNflId && e.year === year)?.id;
                                    if (!newTeamId) {
                                        newTeamId = null;
                                    }

                                    try {
                                        let team = p.team ? '"' + p.team + '"' : null;
                                        await db.query('\
                                            INSERT INTO `tradeplayers`\
                                            (tradeId, originalTeamId, newTeamId, name, team, position)\
                                            VALUES (' + tradeId + ', ' + originalTeamId + ', ' + newTeamId + ', "' + p.name + '", ' + team + ', "' + p.position + '")'
                                        );
                                    }
                                    catch (error) {
                                        fs.appendFileSync('error.txt', 'ERROR: Could not create new trade player entry in DB for ' + p.name + '\r\n' + error);
                                        console.log('ERROR: Could not create new trade player entry in DB for ' + p.name + '\r\n' + error);
                                    }
                                }
                            }
                            catch (error) {
                                fs.appendFileSync('error.txt', 'ERROR: Could not create new trade entry in DB\r\n' + error);
                                console.log('ERROR: Could not create new trade entry in DB\r\n' + error);
                            }
                        }

                    }
                    catch(error) {
                        fs.appendFileSync('error.txt', 'ERROR: Could not load trades for ' + year + '\r\n' + error);
                        console.log('ERROR: Could not load trades for ' + year + '\r\n' + error);
                    }
                }
                catch (error) {
                    fs.appendFileSync('error.txt', 'ERROR: Could not scrape trades data for ' + year + '\r\n' + error);
                    console.log('ERROR: Could not scrape trades data for ' + year + '\r\n' + error);
                }
            }
            catch (error) {
                fs.appendFileSync('error.txt', 'ERROR: Could not load teams for year ' + year + '\r\n' + error);
                console.log('ERROR: Could not load teams for year ' + year + '\r\n' + error);
            }
        }
    }
}