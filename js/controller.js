var socket;
var timeInterval = 10;
var miliseconds = 0;
var currentBatTeam;
var currentState = 0;
var gameState = new Array();
var currentBowlNumber, ballPlayMode;
var currentInningsNumber;
var homeSummary, awaySummary;
var matchStartDate;
var match;
var innings;
var coOrdY, coOrdZ;

function countdown() {
  var interval = setInterval(function () {
    changeScreenSize();
    miliseconds += timeInterval;
    if (miliseconds % 1000 == 0) stepInitialize();
    if (ballPlayMode > 0) {
      playTimer += timeInterval / 1000;
      if (playTimer > 1) {
        playTimer = 0;
        ballPlayMode++;
        if (ballPlayMode > 2) {
          ballPlayMode = 0;
          $("#ball").attr("x", 1000000);
          $("#ball").attr("y", 1000000);
        }
      }
      showBall();
    }
    if (matchStartDate) {
      const currentDate = new Date();
      var seconds = Math.floor((matchStartDate - currentDate.getTime()) / 1000);
      var second = seconds % 60;
      var minutes = Math.floor(seconds / 60);
      var minute = minutes % 60;
      var hours = Math.floor(minutes / 60);
      var hour = hours % 24;
      var days = Math.floor(hours / 24);
      setCenterFrame(
        "Not Started",
        days + "D " + hour + "H " + minute + "M " + second + "S"
      );
      $("#score").text("0 - 0");
    }
  }, timeInterval);
}
function showBall() {
  if (ballPlayMode == 1) {
    $("#ball").attr(
      "x",
      (x2 - x1) * playTimer +
        x1 -
        (20 - playTimer * 5 - (ballPlayMode - 1) * 5) / 2
    );
    $("#ball").attr(
      "y",
      (y2 - y1) * playTimer +
        y1 -
        4 * (0.25 - (playTimer - 0.5) * (playTimer - 0.5)) * 20 -
        (20 - playTimer * 5 - (ballPlayMode - 1) * 5) / 2
    );
    $("#ball").attr("width", 20 - playTimer * 5 - (ballPlayMode - 1) * 5);
  }
  if (ballPlayMode == 2) {
    $("#ball").attr(
      "x",
      (x3 - x2) * playTimer +
        x2 -
        (20 - playTimer * 5 - (ballPlayMode - 1) * 5) / 2
    );
    $("#ball").attr(
      "y",
      (y3 - y2) * playTimer +
        y2 -
        4 * (0.25 - (playTimer - 0.5) * (playTimer - 0.5)) * 20 -
        (20 - playTimer * 5 - (ballPlayMode - 1) * 5) / 2
    );
    if (coOrdY) $("#ball").attr("x", (coOrdY - x2) * playTimer + x2);
    if (coOrdZ)
      $("#ball").attr(
        "y",
        (-coOrdZ - y2) * playTimer +
          y2 -
          4 * (0.25 - (playTimer - 0.5) * (playTimer - 0.5)) * 20
      );
    $("#ball").attr("width", 20 - playTimer * 5 - (ballPlayMode - 1) * 5);
  }
}
function load() {
  homeSummary = 0;
  awaySummary = 0;
  ballPlayMode = 0;
  currentBowlNumber = 0;
  countdown();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = Number(urlParams.get("eventId"));
  socket = new WebSocket("wss://gamecast.betdata.pro:8443");
  socket.onopen = function (e) {
    socket.send(JSON.stringify({ r: "subscribe_event", a: { id: eventId } }));
  };

  socket.onmessage = function (e) {
    var data = JSON.parse(e.data);

    if (data.r == "event") {
      // New function added for websocket. Call it.
      handleEventData(data.d);
    }
  };
  // document.getElementById('link').setAttribute('href', '../tennis-2d/index.html?eventId=' + eventId)
}
function max(a, b) {
  if (a > b) return a;
  return b;
}
function setCenterFrame(title, content) {
  document.getElementById("center_rect").setAttribute("fill-opacity", 0.5);
  center_text = capitalizeWords(title.split(" ")).join(" ");
  document.getElementById("center_text").textContent = center_text;
  titleWidth = document.getElementById("center_text").getBBox().width + 40;
  document.getElementById("center_rect").setAttribute("height", 140);
  document.getElementById("bottom_text").textContent = content;
  document.getElementById("ball").setAttribute("x", 100000);
  document.getElementById("ball").setAttribute("y", 100000);
  // document.getElementById("ball_shadow").setAttribute("cx", 100000);
  // document.getElementById("ball_shadow").setAttribute("cy", 100000);
  document
    .getElementById("center_rect")
    .setAttribute("width", max(380, titleWidth));
  document
    .getElementById("center_rect")
    .setAttribute("x", 400 - max(380, titleWidth) / 2);
  if (content == "") {
    document.getElementById("center_text").setAttribute("y", 310);
  } else {
    document.getElementById("center_text").setAttribute("y", 280);
  }
}
function resetCenterFrame() {
  document.getElementById("center_rect").setAttribute("fill-opacity", 0);
  document.getElementById("center_text").textContent = "";
  document.getElementById("center_rect").setAttribute("height", 0);
  document.getElementById("bottom_text").textContent = "";
}
function capitalizeWords(arr) {
  return arr.map((word) => {
    const firstLetter = word.charAt(0).toUpperCase();
    const rest = word.slice(1).toLowerCase();

    return firstLetter + rest;
  });
}
function stepInitialize() {
  if (!gameState.length) return;
  currentState = max(currentState + 1, gameState.length - 10);
  currentState = min(currentState, gameState.length - 1);
  if (gameState[currentState]["bowling"]) {
    if (gameState[currentState]["bowling"]["coOrdZ"]) {
      coOrdY = gameState[currentState]["bowling"]["coOrdZ"]["y"] * 5;
      coOrdZ = gameState[currentState]["bowling"]["coOrdZ"]["z"] * 3;
    }
    $("#circle" + gameState[currentState]["ball"]).attr("cx", coOrdY);
    $("#circle" + gameState[currentState]["ball"]).attr("cy", -coOrdZ);
    for (let i = gameState[currentState]["ball"] + 1; i < 11; i++) {
      $("#circle" + i).attr("cx", 1000000);
      $("#circle" + i).attr("cy", 1000000);
    }
  }
  if (gameState[currentState]["inning"]) {
    $("#period").text("INN" + gameState[currentState]["inning"]);
  }
}
var dob = 0;
var gameState = new Array();
var gameType = new Array();
var newEvents = new Array();
var lastEvents = new Array();
var awayteamname, hometeamname;
var homeScore, awayScore, periodlength, getDataTime;
var teamNames = new Array();
var periodScoreH = new Array();
var periodScoreA = new Array();
const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// New function added for websocket.
function handleEventData(data) {
  /*
    data.info   => (matchinfo)
    data.match    => match (match_timelinedelta)
    data.events   => events (match_timelinedelta)
  */

  if (data.info) {
    handleInfoData(data);
  }

  if (data["match"]) {
    match = data["match"];
    if (match["status"]["name"] == "Interrupted") {
      isLimitedCov = true;
    } else isLimitedCov = false;
    if (match["status"]["name"].includes("home")) currentBatTeam = "home";
    if (match["status"]["name"].includes("away")) currentBatTeam = "away";
    if (currentBatTeam == "home") {
      $("#pitchImage").attr("href", "./media/pitch.png");
      $("#batState").attr("transform", "translate(0, 0)");
      $("#bowlState").attr("transform", "translate(0, 0)");
      $("#Batsman").text("BATSMAN");
      $("#Bowler").text("BOWLER");
    }
    if (currentBatTeam == "away") {
      $("#pitchImage").attr("href", "./media/pitch1.png");
      $("#batState").attr("transform", "translate(400, 0)");
      $("#bowlState").attr("transform", "translate(-400, 0)");
      $("#Batsman").text("BOWLER");
      $("#Bowler").text("BATSMAN");
    }
    // if(match['type'] == 'periodscore' ){
    //   isperiodscore = true
    // }
    // else isperiodscore = false
    bestofsets = match["bestofsets"];
    var teams = match["teams"];
    periodlength = match["periodlength"];
    var hometeam = teams["home"];
    if (hometeam["name"]) hometeamname = hometeam["name"];
    var awayteam = teams["away"];
    if (awayteam["name"]) awayteamname = awayteam["name"];
    teamNames["home"] = hometeamname;
    teamNames["away"] = awayteamname;
    // hometeamname = 'This team name is longer than 19 characters'

    if (hometeamname.length > 15) {
      teamNames["home"] = hometeamname.substr(0, 13) + "...";
    }
    if (awayteamname.length > 15) {
      teamNames["away"] = awayteamname.substr(0, 13) + "...";
    }
    document.getElementById("headerHome").textContent = teamNames["home"];
    document.getElementById("headerAway").textContent = teamNames["away"];

    // Score Setting
    var result = match["result"];
    if (result["home"] > -1) homeScore = result["home"];
    if (result["away"] > -1) awayScore = result["away"];
    if (!homeSummary) homeSummary = homeScore;
    if (!awaySummary) awaySummary = awayScore;
    $("#score").text(homeSummary + " - " + awaySummary);
    if (match["status"]["name"] == "Ended") {
      setCenterFrame("Match End", homeSummary + " : " + awaySummary);
      $("#period").text("Ended");
    }
    if (match["status"]["name"] == "Break") {
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["status"]["name"] == "Innings break") {
      setCenterFrame("Innings break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["status"]["name"] == "Not started") {
      $("#period").text("Not Yet");
      //Match End
      const currentDate = new Date();
      upCommingTime = currentDate.getTime() / 1000 - match["updated_uts"];
      // var seconds = Math.floor(updated_uts / 1000)
      var seconds = Math.floor(upCommingTime);
      var minute = Math.floor(seconds / 60);
      var second = seconds % 60;
      // var date = new Date(match['_dt']['date'] + '4:52:48 PM UTC');
      var matchDate = match["_dt"]["date"].split("/");
      var date = new Date(
        matchDate[1] +
          "/" +
          matchDate[0] +
          "/20" +
          matchDate[2] +
          " " +
          match["_dt"]["time"] +
          ":00 UTC"
      );

      matchStartDate = date.getTime();
    }
    if (match["resultinfo"]) {
      if (match["resultinfo"]["cricketscore"]) {
        homeSummary = match["resultinfo"]["cricketscore"]["home"][0];
        awaySummary = match["resultinfo"]["cricketscore"]["away"][0];
        $("#score").text(homeSummary + " - " + awaySummary);
      }
    }

    if (match["p"] == 31) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 32) {
      setTimer = false;
      setCenterFrame("Halftime", homeSummary + " : " + awaySummary);
      $("#period").text("Halftime");
    }
    if (match["p"] == 33) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 79) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 73) {
      resetCenterFrame();
    }
    if (match["p"] == 81) {
      setTimer = false;
      setCenterFrame("Lunch Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
  }

  var events = data["events"] || {};

  var newEvents = new Array();
  Object.values(events).forEach((event) => {
    newEvents.push(event);
  });
  newEvents.forEach((newEvent) => {
    let flag = 1;
    gameState.forEach((lastEvent) => {
      if (equals(newEvent, lastEvent)) flag = 0;
    });
    if (flag == 1) {
      gameState.push(newEvent);
    }
  });
  lastEvents = newEvents;

  var scorecard = data["scorecard"];
  if (scorecard) {
    var overs = data["scorecard"]["ballByBallSummaries"];
    currentInningsNumber = data["scorecard"]["currentInningsNumber"];
    overs.forEach((over) => {
      if (currentInningsNumber == 1) {
        if (over["firstInnings"]) {
          innings = over["firstInnings"].split(",");
          $("#over").text("OVER " + over["overNumber"]);
        }
      }
      if (currentInningsNumber == 2) {
        if (over["secondInnings"]) {
          innings = over["secondInnings"].split(",");
          $("#over").text("OVER " + over["overNumber"]);
        }
      }
      if (currentInningsNumber == 3) {
        if (over["thirdInnings"]) {
          innings = over["thirdInnings"].split(",");
          $("#over").text("OVER " + over["overNumber"]);
        }
      }
      if (currentInningsNumber == 4) {
        if (over["fourthInnings"]) {
          innings = over["fourthInnings"].split(",");
          $("#over").text("OVER " + over["overNumber"]);
        }
      }
      for (let i = 1; i < 11; i++) {
        $("#over" + i).text("");
      }
      if (innings) {
        for (let i = 1; i < innings.length + 1; i++) {
          if (innings[i - 1] == "0") $("#over" + i).text("*");
          else $("#over" + i).text(innings[i - 1]);
        }

        for (let i = innings.length; i < 11; i++) {
          $("#circle" + i).attr("cx", 1000000);
          $("#circle" + i).attr("cy", 1000000);
        }
        if (innings.length < 7) {
          for (let i = 1; i < innings.length + 1; i++)
            $("#over" + i).attr("x", 630 + 24 * i);
        } else {
          for (let i = 1; i < innings.length + 1; i++)
            $("#over" + i).attr(
              "x",
              654 + ((i - 1) * (774 - 654)) / (innings.length - 1)
            );
        }
        if (innings.length > currentBowlNumber) {
          ballPlayMode = 1;
          playTimer = 0;
          x1 = Math.random() * 180 - 100;
          y1 = -100;
          x2 = Math.random() * 80;
          y2 = 50;
          x3 = Math.random() * 20;
          y3 = -Math.random() * 100;
        }
        currentBowlNumber = innings.length;
        $("#period").text("INN" + data["scorecard"]["currentInningsNumber"]);
      }
    });
    if (scorecard["innings"]) {
      summary1 = scorecard["innings"][0]["summary"];
      summary2 = "Yet to bat";
      if (scorecard["innings"][1])
        summary2 = scorecard["innings"][1]["summary"];
      teamName1 = scorecard["innings"][0]["teamName"];
      if (scorecard["innings"][1])
        teamName2 = scorecard["innings"][1]["teamName"];
      matchTitle = scorecard["matchTitle"];
      if (matchTitle.indexOf(teamName1) == 0) {
        if (summary1) homeSummary = summary1;
        else homeSummary = homeScore;
        if (summary2) awaySummary = summary2;
        else awaySummary = awayScore;
      } else {
        if (summary2) homeSummary = summary2;
        else homeSummary = homeScore;
        if (summary1) awaySummary = summary1;
        else awaySummary = awayScore;
      }
      document.getElementById("score").textContent =
        homeSummary + " - " + awaySummary;

      batsmen =
        scorecard["innings"][scorecard["innings"].length - 1]["batsmen"];
      let batrun = 0,
        batb = 0,
        bat4s = 0,
        bat6s = 0,
        batpship = 0;
      batsmen.map((batsman) => {
        batrun += batsman["runs"];
        batb += batsman["balls"];
        bat4s += batsman["fours"];
        bat6s += batsman["sixes"];
        if (batsman["active"] == true && batsman["onStrike"] == true) {
          if (currentBatTeam == "away")
            $("#Bowler1").text(batsman["batsmanName"]);
          else $("#Batsman1").text(batsman["batsmanName"]);
          $("#batRuns").text(batsman["runs"]);
          $("#batB").text(batsman["balls"]);
          $("#bat4S").text(batsman["fours"]);
          $("#bat6S").text(batsman["sixes"]);
          if (batsman["balls"])
            $("#batPship").text(
              Math.floor((batsman["runs"] / batsman["balls"]) * 10000) / 100
            );
          else $("#batPship").text(0);
        }
        if (batsman["active"] == true && batsman["onStrike"] == false) {
          if (currentBatTeam == "away")
            $("#Bowler2").text(batsman["batsmanName"]);
          else $("#Batsman2").text(batsman["batsmanName"]);
        }
      });
      // $("#batRuns").text(batrun);
      // $("#batB").text(batb);
      // $("#bat4S").text(bat4s);
      // $("#bat6S").text(bat6s);
      // if (batb) $("#batPship").text(Math.floor((batrun / batb) * 10000) / 100);
      // else $("#batPship").text(0);
      bowlers =
        scorecard["innings"][scorecard["innings"].length - 1]["bowlers"];
      let overs = 0,
        balls = 0,
        maidens = 0,
        runs = 0,
        noBalls = 0,
        wides = 0,
        fours = 0,
        sixes = 0,
        wickets = 0;
      bowlers.map((bowler) => {
        overs += bowler["overs"];
        balls += bowler["balls"];
        maidens += bowler["maidens"];
        runs += bowler["runs"];
        noBalls += bowler["noBalls"];
        wides += bowler["wides"];
        fours += bowler["fours"];
        sixes += bowler["sixes"];
        wickets += bowler["wickets"];
        if (bowler["isActiveBowler"] == true) {
          if (currentBatTeam == "away")
            $("#Batsman1").text(bowler["bowlerName"]);
          else $("#Bowler1").text(bowler["bowlerName"]);

          $("#bowlOvers").text(bowler["overs"]);
          $("#bowlM").text(bowler["maidens"]);
          $("#bowlRuns").text(bowler["runs"]);
          $("#bowlW").text(bowler["wickets"]);
          if (bowler["overs"])
            $("#bowlECON").text(Math.trunc((bowler["runs"] / bowler["overs"]) * 100) / 100);
          else $("#bowlECON").text(0);
        }
        if (bowler["isOtherBowler"] == true)
          if (currentBatTeam == "away")
            $("#Batsman2").text(bowler["bowlerName"]);
          else $("#Bowler2").text(bowler["bowlerName"]);
      });
      $("#bowlFours").text(fours);
      $("#bowlSixes").text(sixes);
      $("#bowlExtras").text(noBalls + wides);
      // $("#bowlOvers").text(overs);
      // $("#bowlM").text(maidens);
      // $("#bowlRuns").text(runs);
      // $("#bowlW").text(wickets);
      // if (overs) $("#bowlECON").text(Math.trunc((runs / overs) * 100) / 100);
      // else $("#bowlECON").text(0);
    }

    if (match["p"] == 31) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 32) {
      setTimer = false;
      setCenterFrame("Halftime", homeSummary + " : " + awaySummary);
      $("#period").text("Halftime");
    }
    if (match["p"] == 33) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 79) {
      setTimer = false;
      setCenterFrame("Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 81) {
      setTimer = false;
      setCenterFrame("Lunch Break", homeSummary + " : " + awaySummary);
      $("#period").text("Break");
    }
    if (match["p"] == 73) {
      resetCenterFrame();
    }
  }
}
function handleInfoData(data) {
  var data1 = data.info;
  var jerseys = data1["jerseys"];
  homePlayerColor = jerseys["home"]["player"]["base"];
  awayPlayerColor = jerseys["away"]["player"]["base"];
}
function changeScreenSize() {
  screenHeight = window.innerHeight;
  screenWidth = window.innerWidth;

  scale = min(screenWidth / 800, screenHeight / 425);

  document
    .getElementById("scale")
    .setAttribute("transform", "scale(" + scale + ")");
  document.getElementById("svg").setAttribute("width", 800 * scale);
  document.getElementById("svg").setAttribute("height", 425 * scale);
}
function min(a, b) {
  if (a > b) return b;
  return a;
}
