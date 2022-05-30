const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());
let database = null;

const initializeServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server Is Running At http://localhost/3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeServer();

const playersList = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const matchDetails = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

const playerMatchScore = (object) => {
  return {
    playerMatchId: object.player_match_is,
    playerId: object.player_id,
    matchId: object.match_id,
    score: object.score,
    fours: object.fours,
    sixes: object.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getAllQuery = `
    SELECT 
    * 
    FROM player_details;`;
  const details = await database.all(getAllQuery);
  response.send(details.map((each) => playersList(each)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT * FROM player_details WHERE
    player_id = ${playerId};`;
  const player = await database.get(getQuery);
  response.send(playersList(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putQuery = `UPDATE player_details SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await database.run(putQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchGetQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await database.get(matchGetQuery);
  response.send(matchDetails(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    SELECT match_details.match_id,
    match_details.match,
    match_details.year
    FROM match_details INNER JOIN
    player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const match = await database.all(playerMatchesQuery);
  response.send(match.map((each) => matchDetails(each)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const players = await database.all(getPlayersQuery);
  response.send(players.map((each) => playersList(each)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(Query);
  response.send(playersMatchDetails);
});

module.exports = app;
