const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();

const databasePath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost/3000/`);
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateObjToResponse = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};
const convertDistrictToResponse = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * FROM state; `;
  const states = await database.all(getAllStatesQuery);
  response.send(states.map((each) => convertStateObjToResponse(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesOnStateId = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const state = await database.get(getStatesOnStateId);
  response.send(convertStateObjToResponse(state));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO 
    district (state_id,district_name,cases,cured,active,deaths)
    VALUES
    (${stateId},'${districtName}',${cases},${cured},${active},${deaths});
    `;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district 
    WHERE district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictToResponse(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const putQuery = `
   UPDATE district 
   SET district_name = '${districtName}',
   state_id = '${stateId}',
   cases = ${cases},
   cured = ${cured},
   active = ${active},
   deaths = ${deaths}
   WHERE 
   district_id = ${districtId};
   `;
  await database.run(putQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
    sum(cases),
    sum(cured),
    sum(active),
    sum(deaths)
    FROM
    district
    WHERE state_id = ${stateId};
     `;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const Query = `
    SELECT state_name FROM district
    NATURAL JOIN state
    WHERE district_id = ${districtId};`;
  const state = await database.get(Query);
  response.send({
    stateName: state.state_name,
  });
});
module.exports = app;
