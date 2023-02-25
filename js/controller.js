var socket;
var timeInterval = 10;
var miliseconds = 0;
var currentState = 0;
var gameState = new Array();
var matchStartDate;
var match;
var innings;
var bestofsets;

var totalBattingNumber;
var battingState = new Array();
var curBat, curPit;
var tAbbr = new Array();
var currentBattNumber;

function countdown() {
  var interval = setInterval(function () {
    changeScreenSize();
    setMatch();
    miliseconds += timeInterval;
    if (miliseconds > 1000) {
      stepInitialize();
      miliseconds = 0;
    }
    if (matchStartDate) {
      const currentDate = new Date();
      var seconds = Math.floor((matchStartDate - currentDate.getTime()) / 1000);
      seconds = max(seconds, 0);
      var second = seconds % 60;
      var minutes = Math.floor(seconds / 60);
      var minute = minutes % 60;
      var hours = Math.floor(minutes / 60);
      var hour = hours % 24;
      var days = Math.floor(hours / 24);
      if (seconds == 0) {
        setCenterFrame("Match about to start", "")
      }
      else setCenterFrame(
        "Not Started",
        days + "D " + hour + "H " + minute + "M " + second + "S"
      );
      $("#score").text("0 - 0");
    }
    setBattingState();
  }, timeInterval);
}
function load() {
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
      handleEventData(data.d);
    }
  };
  arrangeScoreTable();
  for(let i = 0; i < 20; i++){
    battingState[i] = ''
  }
  currentBattNumber = 0;
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
  document
    .getElementById("center_rect")
    .setAttribute("width", max(380, titleWidth));
  document
    .getElementById("center_rect")
    .setAttribute("x", 400 - max(380, titleWidth) / 2);
  if (content == "") {
    document.getElementById("center_text").setAttribute("y", 300);
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
  resetCenterFrame();
  let cs = gameState[currentState];
  if (cs["batter_count"]) {
    setBatterBall(cs["batter_count"]["balls"]);
    setBatterStrike(cs["batter_count"]["strikes"]);
    setBatterOuts(cs["batter_count"]["outs"]);
    let batter_count = cs["batter_count"]["balls"] + cs["batter_count"]["strikes"];
    for(let i = batter_count; i < 20; i++) battingState[i] = '';
    currentBattNumber = min(currentBattNumber, batter_count - 1);
    currentBattNumber = max(currentBattNumber, 0);
  }
  if (cs["type"] == "play_start_baseball") { }
  if (cs["type"] == "play_over_baseball") {
    if (cs["bases"]) {
      if (cs["bases"]['1']["occupied"]) {
        // resetBattingState();
      }
      for (let i = 1; i < 4; i++) {
        if (cs["bases"]["" + i]["occupied"] == false) setBase(i, "")
        else if (cs["bases"]["" + i]["player_id"] == null) setBase(i, tAbbr[curBat]);
        else setBase(i, cs["bases"]["" + i]["player_id"]);
      }
    }
  }
  if (cs["type"] == "play_start_baseball") { }
  if (cs["advancement_type"] && cs["advancement_type"] != "unkown") setCenterFrame(cs["advancement_type"], teamNames[curBat]);
  if (cs["type"] == "batter_out") {
    setCenterFrame("Batter out", "");
    // "out_type": "ground_out"
    if(cs["out_type"] == "ground_out") setCenterFrame("Ground Out", "");
    if(cs["out_type"] == "fly_out") setCenterFrame("Fly Out", "");
    if(cs["out_type"] == "line_out") setCenterFrame("Line Out", "");
    if(cs["out_type"] == "strike_out") setCenterFrame("Strike Out", "");
    if(cs["out_type"] == "pop_out") setCenterFrame("Pop Out", "");
  }
  if (cs["type"] == "runner_out"){
    setCenterFrame("Runner out", "");
    if(cs["out_type"] == "caught_stealing") setCenterFrame("Caught stealing", "");
  }
  if (cs["type"] == 'half_inning_start'){
    if (match["p"] >= 31 && match["p"] <= 39) {
      setCenterFrame("Break", homeScore + " : " + awayScore);
      $("#period").text("Break");
      return;
    }
    setCenterFrame("MIDDLE OF THE INNING", homeScore + ' : ' + awayScore);
    resetBattingState();
    currentBattNumber = 0;
    setBase(1, "");
    setBase(2, "");
    setBase(3, "");
    setBatterBall(0);
    setBatterStrike(0);
    setBatterOuts(0);
  } 
  $("#innerBall").attr("fill-opacity", 0);
  $("#roundBall").attr("fill-opacity", 0);
  if (cs["type"] == "ball"){
    battingState[currentBattNumber] = 'Ball';
    $("#roundBall").attr("fill-opacity", 0.5);
    $("#roundBall").attr("fill", "#0f0");
    currentBattNumber ++;
  }
  if (cs["type"] == "foul_ball"){
    battingState[currentBattNumber] = 'Foul'
    if(cs["name"] == 'Foul ball') battingState[currentBattNumber] = 'Foul'
    $("#innerBall").attr("fill-opacity", 0.5);
    $("#innerBall").attr("fill", '#f00');
    currentBattNumber ++;
  }
  if (cs["type"] == "run_scored"){
    setCenterFrame("Run scored", "");
  }
  if (cs["type"] == "runners_in_motion"){
    setCenterFrame("Runner in motion", "");
  }
  if (cs["type"] == "ball_in_play"){
    battingState[currentBattNumber] = 'In play'
    $("#innerBall").attr("fill-opacity", 0.5);
    $("#innerBall").attr("fill", '#00f');
    currentBattNumber ++;
  }
}
function setBase(baseNumber, baseMember) {
  if (baseMember) {
    $("#base" + baseNumber).attr("fill-opacity", "0.8");
    $("#base" + baseNumber + "Number").attr("fill-opacity", "0.8");
    $("#base" + baseNumber + "Member").text(baseMember);
  }
  else {
    $("#base" + baseNumber).attr("fill-opacity", "0.2");
    $("#base" + baseNumber + "Number").attr("fill-opacity", "0.5");
    $("#base" + baseNumber + "Member").text("-");
  }
}
function setBatterBall(ballCount) {
  if (ballCount == 0) {
    $("#ball1").attr("fill-opacity", 0.2);
    $("#ball2").attr("fill-opacity", 0.2);
    $("#ball3").attr("fill-opacity", 0.2);
  }
  if (ballCount == 1) {
    $("#ball1").attr("fill-opacity", 0.8);
    $("#ball2").attr("fill-opacity", 0.2);
    $("#ball3").attr("fill-opacity", 0.2);
  }
  if (ballCount == 2) {
    $("#ball1").attr("fill-opacity", 0.8);
    $("#ball2").attr("fill-opacity", 0.8);
    $("#ball3").attr("fill-opacity", 0.2);
  }
  if (ballCount == 3) {
    $("#ball1").attr("fill-opacity", 0.8);
    $("#ball2").attr("fill-opacity", 0.8);
    $("#ball3").attr("fill-opacity", 0.8);
  }
}
function setBatterStrike(strikeCount) {
  if (strikeCount == 0) {
    $("#strike1").attr("fill-opacity", 0.2);
    $("#strike2").attr("fill-opacity", 0.2);
    $("#strike3").attr("fill-opacity", 0.2);
  }
  if (strikeCount == 1) {
    $("#strike1").attr("fill-opacity", 0.8);
    $("#strike2").attr("fill-opacity", 0.2);
    $("#strike3").attr("fill-opacity", 0.2);
  }
  if (strikeCount == 2) {
    $("#strike1").attr("fill-opacity", 0.8);
    $("#strike2").attr("fill-opacity", 0.8);
    $("#strike3").attr("fill-opacity", 0.2);
  }
  if (strikeCount == 3) {
    $("#strike1").attr("fill-opacity", 0.8);
    $("#strike2").attr("fill-opacity", 0.8);
    $("#strike3").attr("fill-opacity", 0.8);
  }
}
function setBatterOuts(outCount) {
  if (outCount == 0) {
    $("#outs1").attr("fill-opacity", 0.2);
    $("#outs2").attr("fill-opacity", 0.2);
    $("#outs3").attr("fill-opacity", 0.2);
  }
  if (outCount == 1) {
    $("#outs1").attr("fill-opacity", 0.8);
    $("#outs2").attr("fill-opacity", 0.2);
    $("#outs3").attr("fill-opacity", 0.2);
  }
  if (outCount == 2) {
    $("#outs1").attr("fill-opacity", 0.8);
    $("#outs2").attr("fill-opacity", 0.8);
    $("#outs3").attr("fill-opacity", 0.2);
  }
  if (outCount == 3) {
    $("#outs1").attr("fill-opacity", 0.8);
    $("#outs2").attr("fill-opacity", 0.8);
    $("#outs3").attr("fill-opacity", 0.8);
  }
}
function setBattingState() {
  totalBattingNumber = currentBattNumber;
  battingState.map((eachState, index) => {
    // if(eachState){
      $("#overNumber" + (index + 1)).text(index + 1);
      $("#overState" + (index + 1)).text(eachState);
    // }    
  })
  if (totalBattingNumber < 6) {
    for (let i = 1; i < 7; i++) {
      $("#overNumber" + i).attr("x", - 20 + i * 40);
      $("#overState" + i).attr("x", - 20 + i * 40);
    }
  }
  else {
    for (let i = 1; i <= totalBattingNumber; i++) {
      $("#overNumber" + i).attr("x", 20 + (i - 1) * 230 / (totalBattingNumber - 1));
      $("#overState" + i).attr("x", 20 + (i - 1) * 230 / (totalBattingNumber - 1));
    }
  }
  for (let i = totalBattingNumber + 1; i <= 20; i++) {
    $("#overNumber" + i).text('');
    $("#overState" + i).text('');
  }
}
function resetBattingState() {
  for (let i = 0; i < 20; i++) {
    battingState[i] = ''
    totalBattingNumber = 1;
  }
}
function setScoreTable(where, who, how) {
  $("#" + who + "Table" + where).text(how);
}
function setInPlay(){

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

function handleEventData(data) {
  if (data.info) {
    handleInfoData(data);
  }
  if (data["match"]) match = data["match"];

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

}
function handleInfoData(data) {
  var data1 = data.info;
  var jerseys = data1["jerseys"];
  homePlayerColor = jerseys["home"]["player"]["base"];
  awayPlayerColor = jerseys["away"]["player"]["base"];
  // homePlayerColor = jerseys["home"]["player"]["sleeve"];
  // awayPlayerColor = jerseys["away"]["player"]["sleeve"];
  $("#homerbox").attr("fill", "#" + homePlayerColor);
  $("#awaybox").attr("fill", "#" + awayPlayerColor);
}
function changeScreenSize() {
  screenHeight = window.innerHeight;
  screenWidth = window.innerWidth;

  scale = min(screenWidth / 800, screenHeight / 496);

  document
    .getElementById("scale")
    .setAttribute("transform", "scale(" + scale + ")");
  document.getElementById("svg").setAttribute("width", 800 * scale);
  document.getElementById("svg").setAttribute("height", 496 * scale);
}
function min(a, b) {
  if (a > b) return b;
  return a;
}
function arrangeScoreTable() {
  $("#homePeriodScore").append('<text font-size="12" x="0" y="0" text-anchor="middle" fill="#fff">11</text>')
}
function setMatch(){
  if(!match) return;
  if (match["status"]["name"] == "Interrupted") {
    isLimitedCov = true;
  } else isLimitedCov = false;
  bestofsets = match["numberofperiods"];
  var teams = match["teams"];
  periodlength = match["periodlength"];
  var hometeam = teams["home"];
  if (hometeam["name"]) hometeamname = hometeam["name"];
  var awayteam = teams["away"];
  if (awayteam["name"]) awayteamname = awayteam["name"];
  teamNames["home"] = hometeamname;
  teamNames["away"] = awayteamname;
  tAbbr["home"] = match["teams"]["home"]["abbr"];
  tAbbr["away"] = match["teams"]["away"]["abbr"];
  // hometeamname = 'This team name is longer than 19 characters'

  if (hometeamname.length > 15) {
    teamNames["home"] = hometeamname.substr(0, 13) + "...";
  }
  if (awayteamname.length > 15) {
    teamNames["away"] = awayteamname.substr(0, 13) + "...";
  }
  document.getElementById("headerHome").textContent = teamNames["home"];
  document.getElementById("headerAway").textContent = teamNames["away"];
  document.getElementById("homeMember").textContent = teamNames["home"];
  document.getElementById("awayMember").textContent = teamNames["away"];
  document.getElementById("homeTableName").textContent = tAbbr["home"];
  document.getElementById("awayTableName").textContent = tAbbr["away"];

  // Score Setting
  var result = match["result"];
  if (result["home"] > -1) homeScore = result["home"];
  if (result["away"] > -1) awayScore = result["away"];
  $("#score").text(homeScore + " - " + awayScore);
  if(homeScore!= null) $("#homeTableR").text(homeScore);
  if(awayScore!= null) $("#awayTableR").text(awayScore);
  // Period Score
  let lastperiodscoreH = homeScore;
  let lastperiodscoreA = awayScore;
  if (match["periods"]) {
    for (let i = 1; i <= 9; i++) {
      if (match["periods"]["p" + i]) {
        $("#homeTable" + i).text(match["periods"]["p" + i]["home"]);
        $("#awayTable" + i).text(match["periods"]["p" + i]["away"]);
        lastperiodscoreH -= match["periods"]["p" + i]["home"];
        lastperiodscoreA -= match["periods"]["p" + i]["away"];
      }
      else {
        $("#homeTable" + i).text(lastperiodscoreH);
        $("#awayTable" + i).text(lastperiodscoreA);
        lastperiodscoreH = '-'
        lastperiodscoreA = '-'
      }
    }
  }
  else if (homeScore!= null) {
    $("#homeTable1").text(homeScore);
    $("#awayTable1").text(awayScore);
  }
  // Period Setting
  $("#period").text(match["status"]["name"]);
  if (match["status"]["name"] == "Ended") {
    setCenterFrame("Match End", homeScore + " : " + awayScore);
    $("#period").text("Ended");
  }
  if (match["status"]["name"] == "Break") {
    setCenterFrame("Break", homeScore + " : " + awayScore);
    $("#period").text("Break");
  }
  if (match["status"]["name"] == "Not started") {
    $("#period").text("Not Yet");
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
  if (match["p"] >= 31 && match["p"] <= 39) {
    setCenterFrame("Break", homeScore + " : " + awayScore);
    $("#period").text("Break");
    resetBattingState();
    currentBattNumber = 0;
    setBase(1, "");
    setBase(2, "");
    setBase(3, "");
    setBatterBall(0);
    setBatterStrike(0);
    setBatterOuts(0);
  }
  // Batting or Pitching
  if (match["livestate"]) {
    if (match["livestate"]["batter"]["team"] == "home") {
      $("#homeRole").text("BATTER");
      $("#awayRole").text("PITCHER");
      curBat = "home";
      curPit = "away";
    }
    if (match["livestate"]["batter"]["team"] == "away") {
      $("#awayRole").text("BATTER");
      $("#homeRole").text("PITCHER");
      curBat = "away";
      curPit = "home";
    }
  }


}