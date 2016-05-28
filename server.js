var restify = require('restify');
var builder = require('botbuilder');
var caniuse = require('caniuse-api')

// ************************************************

// Get secrets from server environment
var botConnectorOptions = {
    appId: process.env.BOTFRAMEWORK_APPID,
    appSecret: process.env.BOTFRAMEWORK_APPSECRET
};

// Create bot
var bot = new builder.BotConnectorBot(botConnectorOptions);

bot.add('/', [
    function (session) {

        var query = session.message.text;
        var seach_flag, res;

        // 受け取った文字列でCan I useのデータを取得
        try {
            res = caniuse.getSupport(query, true); //ヒットしないとエラーを投げてくる
        } catch (e) {
            seach_flag = 1;
        }

        // 完全一致するかどうか判定
        if (seach_flag == false) {

            // Can I useの結果を表示
            console.log(res);
            session.endDialog(JSON.stringify(res));

        } else {

            // 検索して候補を取得
            var search_res = caniuse.find(query);

            if (search_res.length > 0) {

                // 候補を表示。選択肢を提示
                console.log(search_res);
                builder.Prompts.choice(session, "pick one.", search_res);

            } else {
                // 見つかりませんでした... XP
                session.endDialog("sorry, not found.");
            }
        }

},function (session, results) {

        var res = caniuse.getSupport(results.response.entity, true);

        // Can I useの結果を表示
        console.log(res);
        session.endDialog(JSON.stringify(res));

}]);


// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
// Bot用のエンドポイントだよーん
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// Serve a static web page
// Webブラウザでアクセスされた時には、静的HTMLを表示させる
server.get(/.*/, restify.serveStatic({
    'directory': './static/',
    'default': 'index.html'
}));

// サーバ起動やねん
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
