require("dotenv").config();

const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const setupCommands = require("./commands"); // 명령어 로직 불러오기

// 기본 설정
const gameName = "GachonGame"; // 게임 이름
const webURL = process.env.WEB_URL; // 게임 URL (환경 변수에서 가져오기)
const server = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const port = process.env.PORT; // 서버 포트

// SCORE_TOKEN 환경 변수 처리
const SCORE_TOKEN = process.env.SCORE_TOKEN?.split(";").map((t) => BigInt(t)) || [];
const queries = {}; // 쿼리 저장용 객체

// 명령어 로직 초기화
setupCommands(bot, gameName, queries, webURL);

// 정적 파일 제공
server.use(express.static(path.join(__dirname, "public")));

// 점수 처리 엔드포인트
server.get("/highscore/:score", function (req, res, next) {
  const queryId = req.query.id;
  if (!queries[queryId]) return next();

  const token = SCORE_TOKEN[addAllNumbers(BigInt(queryId)) - 1];
  const query = queries[queryId];
  let options;

  if (query.message) {
    options = {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    };
  } else {
    options = {
      inline_message_id: query.inline_message_id,
    };
  }

  const obfuscatedScore = BigInt(req.params.score);
  const realScore = Math.round(Number(obfuscatedScore / token));

  if (BigInt(realScore) * token === obfuscatedScore) {
    bot
      .setGameScore(query.from.id, realScore, options)
      .then(() => res.status(200).send("Score added successfully"))
      .catch((err) => {
        if (err.response?.body?.description === "Bad Request: BOT_SCORE_NOT_MODIFIED") {
          res.status(200).send("New score is inferior to user's previous one");
        } else {
          console.error("Error setting score:", err);
          res.status(500).send("An error occurred while setting the score");
        }
      });
  } else {
    res.status(400).send("Are you cheating?");
  }
});

// 유틸 함수: addAllNumbers
function addAllNumbers(number) {
  while (number >= 10) {
    number = number
      .toString()
      .split("")
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return number;
}

// 서버 시작
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// 지워야할 수도 있는 부분
// 로그 처리 엔드포인트
server.post("/log", express.json(), (req, res) => {
  const { message } = req.body;

  if (message) {
    console.log(`[Log from Unity]: ${message}`);
    res.status(200).send({ status: "success", message: "Log received" });
  } else {
    res.status(400).send({ status: "error", message: "No log message provided" });
  }
});
