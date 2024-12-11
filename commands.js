const axios = require("axios"); // HTTP 요청을 위한 axios 추가
require('dotenv').config(); // 환경 변수 로드

module.exports = function setupCommands(bot, gameName, queries) {
  const webURL = process.env.WEBHOOK_URL;

  // Unity의 웹훅 URL 설정 (Unity 서버의 엔드포인트)
  const unityWebhookUrl = process.env.WEB_URL; // Unity 서버 주소 및 엔드포인트

  bot.onText(/\/start|\/game/, (msg) => {
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name;
    const username = msg.from.username;
    const userId = msg.from.id;

    let displayName;
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (username) {
      displayName = username;
    } else {
      displayName = `User ID: ${userId}`;
    }

    console.log("User's Telegram Name (Start or Game): " + displayName);

    // Unity 서버로 displayName 전송
    axios
      .post(unityWebhookUrl, { displayName, isPlaying: true })  // isPlaying을 함께 전송
      .then((response) => {
        console.log("Sent to Unity: ", response.data);
      })
      .catch((error) => {
        console.error("Error sending to Unity: ", error.message);
      });

    bot.sendGame(msg.from.id, gameName);
  });

  bot.on("callback_query", (query) => {
    const firstName = query.from.first_name;
    const lastName = query.from.last_name;
    const username = query.from.username;
    const userId = query.from.id;

    let displayName;
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (username) {
      displayName = username;
    } else if (userId) {
      displayName = `User ID: ${userId}`;
    } else {
      displayName = `Unity Test`;
    }

    console.log("User's Telegram Name (Callback): " + displayName);

    // Unity 서버로 displayName 전송
    axios
      .post(unityWebhookUrl, { displayName, isPlaying: true })  // isPlaying을 함께 전송
      .then((response) => {
        console.log("Sent to Unity: ", response.data);
      })
      .catch((error) => {
        console.error("Error sending to Unity: ", error.message);
      });

    if (query.game_short_name !== gameName) {
      bot.answerCallbackQuery(
        query.id,
        "Sorry, '" + query.game_short_name + "' is not available."
      );
    } else {
      queries[query.id] = query;
      const gameurl = `${webURL}/index.html?id=${encodeURIComponent(query.id)}`;
      console.log("Generated Game URL:", gameurl);

      if (gameurl) {
        bot.answerCallbackQuery(query.id, { url: gameurl });
      } else {
        bot.answerCallbackQuery(query.id, { text: "Invalid URL for the game." });
      }
    }
  });

  // Unity에서 데이터를 받았는지 확인하는 엔드포인트 추가
  const express = require("express");
  const app = express();
  const PORT = 8080;

  app.use(express.json());

  app.post("/unity-receive", (req, res) => {
    const { displayName, isPlaying } = req.body;
    console.log("Request body:", req.body);  // 데이터가 잘 오는지 로그로 확인

    if (displayName) {
      console.log(`Received data from Unity: ${displayName}, Playing: ${isPlaying}`);
      res.status(200).send(`Data received successfully: ${displayName}`);
    } else {
      console.error("No data received from Unity.");
      res.status(400).send("Error: No data received");
    }
  });

  app.listen(PORT, () => {
    console.log(`Unity receiver server running on port ${PORT}`);
  });
};
