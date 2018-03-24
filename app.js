require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { WebClient } = require('@slack/client');
const app = express();

const authToken = process.env.SLACK_AUTH_TOKEN;
const channelId = process.env.CHANNEL_ID;;

const sanitiseString = (string) => {
    const regexQuoteMarks = /(^["'“‘”’]|["'“‘”’]$)/g
    return string.trim().replace(regexQuoteMarks,"");
}

const getRecipient = (text) => {
    const regexSplitUserInfo = /(|)\w+/g;
    const userInfo = text.split(" ")[0].match(/(|)\w+/g)
    return { id: userInfo[0], name: userInfo[1] }
}

const parseMessage = (message) => {
    const regexUserInfo = /.*>\s/;
    const userInfo = message.match(regexUserInfo)
    const kudosString = message.replace(userInfo, "")
    return sanitiseString(kudosString);
};

const egoFilter = (recipientId, senderId) => {
    return Boolean(recipientId === senderId);
};

const egoExit = (res, sender) => {
    res.json({
        text: `Sorry <@${sender.name}> you can't send kudos to yourself`,
        attachments: [{
            text:'But kudos bot thinks you\'re great'
        }]
    })
}

const sendKudos = (client, recipientId, kudosString) => {
    return client.chat.postMessage(`${channelId}`, `:tada: Kudos to <@${recipientId}> :clap:`, {
        attachments: [{
            text:kudosString
        }]
    })
};

const inviteToChannel = (client, recipient) => {
    return client.channels.invite(`${channelId}`, `${recipient}`);
}

const confirmKudosSent = (res, recipientId, kudosString) => {
    return () => res.json({
        text: `Thanks for sending kudos to <@${recipientId}>`,
        attachments: [{
            text:`${kudosString}`
        }]
    });
};

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => { console.log('GET /') || res.send('HELLO WORLD')})
app.get('/kudos', (req, res) => { console.log('GET /kudos') || res.send('KUDOS')})

app.post('/', (req, res) => {
    const sender = { name: req.body.user_name, id: req.body.user_id }
    const recipient = getRecipient(req.body.text);
    const kudosString = parseMessage(req.body.text)
    const client = new WebClient(authToken);

    if(egoFilter(recipient.id, sender.id)) {
        egoExit(res, sender)
    } else {
        sendKudos(client, recipient.id, kudosString)
        .then(inviteToChannel(client, recipient.id))
        .then(confirmKudosSent(res, recipient.id, kudosString))
        .catch((err) => res.json({text: `Oops, something went wrong: ${err}`}))
    };

});

app.listen(3456);
