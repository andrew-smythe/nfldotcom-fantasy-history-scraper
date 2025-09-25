# nfldotcom-fantasy-history-scraper
Long, but fairly self-explanatory title

## Description

This script scrapes NFL.com fantasy football and imports the following into a MySQL database:

* Teams
* Weekly Player Stats
* Matchups
* Trades
* Draft Picks

It requires an NFL.com fantasy login, and a MySQL database with the correct schema pre-setup (see schema/nerdherd.sql).

## Disclaimer

This is very much a quick and dirty script. It was built specifically for my own personal use, and I cannot guarantee it will work if you try to use it on another league.

If you did want to use it on a different league, this probably would be a good base to build off of.

## How to Make the Scrape

1. Make sure you have node installed on your PC.

2. Use the SQL schema in /schema/nerdherd.sql to create the structure in your MySQL database of choice.

3. Create a settings.json file. See settings.json.example for an example of which fields are needed. This is required for the script to run correctly.

4. Create a screenshots folder in the root directory of this project.

5. Run the following:
  ```bash
  npm install
  node main.js
  ```

## To-do Things

https://trello.com/b/IQhQZvf0/nerdherd-fantasy-football
