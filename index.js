require("dotenv").config();
const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const setupCommands = require("./commands");

const GameBot = require("./gameBot");

const gameBot = new GameBot();
gameBot.startServer(); // 서버 시작