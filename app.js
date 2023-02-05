const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// 1. Getting a list of all the players in the player table

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
          SELECT 
           * 
          FROM 
           player_details
      `;

  const dbResponse = await database.all(getPlayersQuery);

  response.send(
    dbResponse.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

// 2.Getting a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
       SELECT 
        * 
       FROM 
        player_details 
       WHERE 
        player_id = ${playerId};
      `;

  const player = await database.get(getPlayerQuery);

  response.send(convertPlayerObjectToResponseObject(player));
});

// 3. Updating the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayerDetailsQuery = `
         UPDATE 
           player_details 
        SET 
           player_name = '${playerName}';
    `;

  const dbResponse = await database.run(updatePlayerDetailsQuery);

  response.send("Player Details Updated");
});

// 4.Getting the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `
      SELECT 
        match_id AS matchId, match, year 
      FROM 
        match_details 
      WHERE 
       match_id = ${matchId};
    `;

  const match = await database.get(getMatchQuery);

  response.send(match);
});

// 5.Getting a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getMatchesOfPlayerQuery = `
         SELECT 
           match_id AS matchId, match, year
         FROM 
           (SELECT * FROM player_details NATURAL JOIN player_match_score)
           NATURAL JOIN match_details
        WHERE 
           player_id = ${playerId};
    `;

  const matches = await database.all(getMatchesOfPlayerQuery);

  response.send(matches);
});

// 6 .Getting a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
         SELECT 
           *
         FROM 
          player_details NATURAL JOIN player_match_score
        WHERE 
           match_id = ${matchId};
    `;
  const players = await database.all(getPlayersOfMatchQuery);
  response.send(
    players.map((eachPlayer) => convertPlayerObjectToResponseObject(eachPlayer))
  );
});

// 7. Getting the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayerQuery = `
         SELECT 
           player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours,
           SUM(sixes) AS totalSixes
         FROM 
           player_match_score NATURAL JOIN player_details
        WHERE 
           player_id = ${playerId}
    `;
  const playerStats = await database.get(getStatsOfPlayerQuery);
  response.send(playerStats);//
});
