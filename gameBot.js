const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const path = require("path");
const express = require("express");
const setupCommands = require("./commands");
const { Log, Score } = require("./models");

class GameBot {
  constructor() {
    this.gameName = "GachonDonutShotbot";
    this.webURL = process.env.WEB_URL;
    this.port = process.env.PORT || 8000;
    this.mongoURI = process.env.MONGODB_URI;
    this.scoreToken = this._parseScoreToken(process.env.SCORE_TOKEN);
    this.queries = {};

    this._checkEnvVars();

    // TelegramBot 초기화
    this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    this.server = express();

    this._connectToMongoDB();
    setupCommands(this.bot, this.gameName, this.queries, this.webURL);
    this.server.use(express.static(path.join(__dirname, "public")));

    this._setupRoutes();
  }

  _checkEnvVars() {
    const requiredEnvVars = ["BOT_TOKEN", "WEB_URL", "MONGODB_URI", "SCORE_TOKEN"];
    for (let envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }

  _connectToMongoDB() {
    const connect = () => {
      mongoose
        .connect(this.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
          console.log("MongoDB connected successfully");
        })
        .catch((err) => {
          console.error("MongoDB connection error:", err);
          setTimeout(connect, 5000);
        });
    };
    connect();
  }

  _parseScoreToken(scoreToken) {
    return scoreToken?.split(";").map((t) => BigInt(t)) || [];
  }

  _setupRoutes() {
    this.server.get("/highscore/:score", (req, res, next) => this._handleHighScore(req, res, next));
    this.server.post("/log", express.json(), (req, res) => this._handleLog(req, res));
    this.server.get("/checkscore/:id", (req, res) => this._checkScore(req, res));
    this.server.get("/get-score/:playerId", async (req, res) => this._getPlayerScore(req, res));

    this.server.get("/ping", (req, res) => {
      res.status(200).send("Pong!"); // Unity 요청에 대한 응답
    });

    this.server.post("/submit-score", express.json(), async (req, res) => {
      console.log("Received data:", req.body); 
      try {
        const { playerName, score } = req.body;
    
        if (!playerName || !score) {
          return res.status(400).json({ error: "Player name and score are required" });
        }
    
        // MongoDB에 점수 저장
        const newScore = new Score({ playerName, score });
        await newScore.save();
    
        res.status(200).json({ message: "Score submitted successfully", score: newScore });
      } catch (error) {
        console.error("Error saving score:", error);
        res.status(500).json({ error: "Error saving score to database" });
      }
    });
    
  }

  startServer() {
    this.server.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

module.exports = GameBot;
