require('dotenv').config();  // 환경 변수 로드를 위해 dotenv 추가

module.exports = function setupCommands(bot, gameName, queries) {
  // .env 파일에서 환경 변수 가져오기
  let webURL = process.env.WEBHOOK_URL;

  // /help 명령어
  bot.onText(/\/help/, (msg) =>
    bot.sendMessage(
      msg.from.id,
      "이 봇은 간단한 게임을 구현합니다. 게임을 플레이 하려면 /game을 전송하세요."
    )
  );

  // /start 및 /game 명령어
  bot.onText(/\/start|\/game/, (msg) => bot.sendGame(msg.from.id, gameName));

  // 콜백 쿼리 처리
  bot.on("callback_query", (query) => {
    if (query.game_short_name !== gameName) {
      bot.answerCallbackQuery(
        query.id,
        "Sorry, '" + query.game_short_name + "' is not available."
      );
    } else {
      queries[query.id] = query;

      // URL 생성 및 로그 출력
      const gameurl = `${webURL}/index.html?id=${encodeURIComponent(query.id)}`;
      console.log('Generated Game URL:', gameurl); // URL을 로깅하여 점검

      // Callback Query 응답
      if (gameurl) {
        bot.answerCallbackQuery(query.id, { url: gameurl });
      } else {
        bot.answerCallbackQuery(query.id, { text: 'Invalid URL for the game.' });
      }
    }
  });

  // 인라인 쿼리 처리
  bot.on("inline_query", (iq) => {
    bot.answerInlineQuery(iq.id, [
      { type: "game", id: "0", game_short_name: gameName },
    ]);
  });
};