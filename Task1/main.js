// GAPI Connection
const API_KEY = "AIzaSyB2nv4Uw3ebeoe794HhbblywuyGEukiXiI";
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4",];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
// GAPI Connection

// Global variables
let options = ["this", "this not", "this either"];
let correct_answer_index = 0;
let currentQuestion;
let selectedOption = null;
let questions = [];
let nextQuestion;
let freezeOptions = false;
let feedbackText;
let score = 0;
let totalScore = 0;

// DOM elements
let proceedButton;
let evalButton;
let evalMsg;
let slide;
let positiveAudio;
let negativeAudio;
let nextAudio;

/*Progres bar*/
let progress;
let prev;
let next;
let circles;
let currentActive = 1;

function nextProgress() {
  currentActive++;
  if (currentActive > circles.length) {
    currentActive = circles.length;
    currentActive = 1;
  }
  update();
}

function update() {
  circles.forEach((circle, idx) => {
    if (idx < currentActive) {
      circle.classList.add("active");
    } else {
      circle.classList.remove("active");
    }
  });

  const actives = document.querySelectorAll(".active");
  const ratio = ((actives.length - 1) / (circles.length - 1)) * 100;
  progress.style.width = `${ratio}%`;
}
 
async function myEvaluation() {
  if (selectedOption === null) {
     swal("Please select your option!");
    return;
  }
  freezeOptions = true;
  proceedButton.style.display = "block";
  evalButton.style.display = "none";

  // Getting the previous question's answer
  const [correctAnswerIndex, score] = await getExerciseData(
    "A" + currentQuestion.raw,
    "F" + currentQuestion.raw,
    "single"
  );

  const prgs = document.getElementById("prgs-" + currentActive);
  prgs.style.color = "white";
  if (selectedOption == correctAnswerIndex) {
    totalScore += score;
    prgs.style.backgroundColor = "#43aa8b";
    positiveAudio.play();
    evalMsg.innerHTML = `Correct! <br> You added +${score} Points To Your Score`;
    feedbackText.innerHTML = `Yes, the Correct Answer Is: <br> ${currentQuestion.options[correctAnswerIndex]}`;
    feedbackAction("up", "correct");
  } else {
    prgs.style.backgroundColor = "#f94144";
    negativeAudio.play();
    evalMsg.innerHTML = "Wrong! <br>";
    feedbackText.innerHTML = `The Correct Answer Is: <br> ${currentQuestion.options[correctAnswerIndex]}`;
    feedbackAction("up", "wrong");
  }

  // Getting the next question
  nextQuestion = nextRandomQuestion();
  currentQuestion = nextQuestion;
}

function proceed() {
  if (currentQuestion === "no more questions") {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".feedback-container").style.display = "none";
    document.querySelector(".score").textContent = `${(totalScore/56*100).toFixed(2)} %`;
    document.querySelector("#final-result").style.display = "block";
    document.getElementById("final-audio").play();
    return;
  }
  nextAudio.play();
  nextProgress();
  freezeOptions = false;
  selectedOption = null;
  feedbackAction("down", "wrong");
  evalMsg.innerHTML = "";
  proceedButton.style.display = "none";
  evalButton.style.display = "block";
  // Updating the question statement
  let questionStamentContainer = document.querySelector(".question");
  questionStamentContainer.innerHTML = nextQuestion.statement;
  let optionsContainer = document.querySelector("#options-wrapper");
  optionsContainer.innerHTML = "";
  for (let i = 0; i < nextQuestion.options.length; i++) {
    optionsContainer.innerHTML +=
      `<div onClick={selectOption(${i})} id="opt-${i}" class='unchosen option'><p class='text'>` +
      nextQuestion.options[i] +
      "</p></div>";
  }
}

// GAPI Connection
// collect dom elements
function handleClientLoad() {
  circles = document.querySelectorAll(".circle");
  progress = document.getElementById("progress");
  positiveAudio = document.getElementById("positive-audio");
  negativeAudio = document.getElementById("negative-audio");
  nextAudio = document.getElementById("next-audio");
  proceedButton = document.getElementById("proceed-btn");
  evalButton = document.getElementById("eval-btn");
  evalMsg = document.getElementById("eval-msg");
  slide = document.querySelector(".feedback-item");
  feedbackText = document.querySelector(".feedback-text");
  proceedButton.style.display = "none";
  proceedButton.addEventListener("click", proceed);
  gapi.load("client", initClient);
}

function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    })
    .then(
      function () {
        getExerciseData("A2", "D10", false);
      },
      function (error) {
        console.log(JSON.stringify(error, null, 2));
      }
    );
}

async function getExerciseData(start, end, single) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: "1hzA42BEzt2lPvOAePP6RLLRZKggbg0RWuxSaEwd5xLc",
    range: `Learning!${start}:${end}`,
  });

  if (!single) {
    startTest(response.result.values);
  } else {
    correct_answer_index = parseInt(response.result.values[0][4]);
    score = parseInt(response.result.values[0][5]);
  }
  return [correct_answer_index, score];
}

// My Code

function selectOption(index) {
  if (freezeOptions) return;
  options = document.querySelectorAll(".option");
  options.forEach((option) => {
    option.classList.remove("choosen");
    option.classList.add("unchosen");
  });
  selected = document.getElementById(`opt-${index}`);
  selected.classList.add("choosen");
  selected.classList.remove("unchosen");
  selectedOption = index;
}

function startTest(data) {
  // Decorating the data
  questions = data.map((question, index) => {
    const topic = question[0];
    const statement = question[2];
    const options = question[3].split(";");
    const raw = index + 2;
    return {
      topic,
      statement,
      options,
      raw,
    };
  });

  let max = questions.length;
  let nextIndex = Math.floor(Math.random() * max);
  // currentQuestion = questions[nextIndex];
  currentQuestion = nextRandomQuestion();
  let questionStamentContainer = document.querySelector(".question");
  questionStamentContainer.innerHTML = currentQuestion.statement;
  let optionsContainer = document.querySelector("#options-wrapper");
  for (let i = 0; i < currentQuestion.options.length; i++) {
    optionsContainer.innerHTML +=
      `<div onClick={selectOption(${i})} id="opt-${i}" class='unchosen option'><p class='text'>` +
      currentQuestion.options[i] +
      "</p></div>";
  }
}

function nextRandomQuestion() {
  if (questions.length > 0) {
    let max = questions.length;
    let nextIndex = Math.floor(Math.random() * max);
    let nextQuestion = questions[nextIndex];
    questions.splice(nextIndex, 1);
    return nextQuestion;
  }
  selectedOption = null;
  return "no more questions";
}

function feedbackAction(direction, status) {
  if (direction === "down") {
    slide.classList.add("slideDown");
    slide.classList.remove("slideUp");
  } else if (direction === "up") {
    slide.classList.remove("slideDown");
    slide.classList.add("slideUp");
    if (status === "correct") {
      slide.classList.add("correct");
      slide.classList.remove("wrong");
    } else if (status === "wrong") {
      slide.classList.add("wrong");
      slide.classList.remove("correct");
    }
  }
}
