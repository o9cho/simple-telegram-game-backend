const mongoose = require("mongoose");

// 점수 스키마
const scoreSchema = new mongoose.Schema({
  playerName: String,
  score: Number,
  timestamp: { type: Date, default: Date.now }
});

// 모델 정의
const Score = mongoose.model("Score", scoreSchema);

module.exports = { Score };
