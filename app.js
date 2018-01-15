require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { WebClient } = require('@slack/client');

const app = express();

const authToken = process.env.SLACK_AUTH_TOKEN;
const channelId = process.env.CHANNEL_ID;;

app.use(bodyParser.urlencoded());

const parseMessage = (message) => {
    const regex = /(\@\w*)([\s\S]*)/;
    const chunks = message.text.match(regex)
    const target = chunks[1];
    const kudosString = chunks[2];
    return {target, kudosString};
};

const sendKudos = (client, target, kudosString) => {
    return client.chat.postMessage(`${channelId}`, `Hey <${target}>, someone has sent you kudos :tada:`, {
        attachments: [{
            text:kudosString
        }]
    })
};

app.get('/kudos', (req, res) => {res.send('KUDOS')})

app.post('/kudos', (req, res) => {
    const {target, kudosString} = parseMessage(req.body)
    const client = new WebClient(authToken);

    sendKudos(client, target, kudosString)
    .then(() => res.json({
        text: `You send this message of appreciation to <${target}>`,
        attachments: [{
            text:`${kudosString}`
        }]
    }))
    .catch((err) => res.json({text: `Oops, something went wrong: ${err}`}))

});

app.listen(3456);
