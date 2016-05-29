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


// ************************************************

function result_format(session, query, obj) {

    var result_text = "Support information\n\n";

    // 結果テキストを作成
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {

            if( 'y' in obj[key] ){
                result_text += browser_name_from_key(key) + ": >= " + obj[key].y +"\n\n";
            }else if( 'a' in obj[key] ){
                result_text += browser_name_from_key(key) + ": " + obj[key].a +" (Partial support)\n\n";
            }

        }
    }

    // Message作成
    var msg = new builder.Message()
        .setText(session, result_text)
        .addAttachment({
            "text": "more information here.",
            "title": query + " - Can I use?",
            "TitleLink": "http://caniuse.com/#search=" + query
        });

    console.log("Message with attachments:");
    console.log(msg);

    return msg;

}

//result_format(test);

// ************************************************

var browsers_names = {
    "and_chr": "Chrome for Android​",
    "and_ff": "Firefox for Android​",
    "and_uc": "UC Browser for Android​",
    "android": "Android Browser",
    "bb": "Blackberry Browser​",
    "chrome": "Chrome​",
    "edge": "Edge",
    "firefox": "Firefox​",
    "ie_mob": "IE Mobile​",
    "ie": "IE​",
    "ios_saf": "iOS Safari",
    "op_mini": "Opera Mini",
    "op_mob": "Opera Mobile",
    "opera": "Opera​",
    "safari": "Safari​"
};

function browser_name_from_key(key) {
    return browsers_names[key] || key;
}

// ************************************************


bot.add('/', [
    function (session) {

        // クエリーを成型
        var query = session.message.text.replace(/^@\w+:\s+/, "").replace(/\s/g, "");

        // クエリーの文字数が3字以下ならばエラー
        if(query.length < 3){
            session.endDialog("Plz enter more than 3 characters! XP");
        }

        // 検索して候補を取得
        console.log(session.message.text);
        var search_res = caniuse.find(query); // ヒット数が複数or0の場合、配列が。1つだけヒットの場合、文字型が返される。

        console.log(search_res);
        console.log(Array.isArray(search_res));
        console.log("\nlengh:" + search_res.length);

        //debug用
        //session.send("query:"+query + ", search_res:"+search_res );

        // 候補の数を調べる
        if (Array.isArray(search_res) === false) {

            // ****候補が1つだけの時****

            // Can I useの結果を表示
            var res = caniuse.getSupport(query, true);
            session.endDialog(result_format(session, query, res));


        } else if (search_res.length >= 2) {

            // ****候補が複数ある時****

            // 候補を表示。選択肢を提示
            //            console.log(search_res);
            builder.Prompts.choice(session, "pick one.", search_res);

        } else {

            // ****候補が0の時****

            // 見つかりませんでした... XP
            session.endDialog("sorry, not found... XP");

        }

},
    function (session, results) {

        var res = caniuse.getSupport(results.response.entity, true);

        // Can I useの結果を表示
        //        console.log(res);
        session.endDialog(result_format(session, results.response.entity, res));

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
