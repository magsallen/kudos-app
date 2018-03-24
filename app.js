require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { WebClient } = require('@slack/client');

const app = express();

const authToken = process.env.SLACK_AUTH_TOKEN;
const channelId = process.env.CHANNEL_ID;;

app.use(bodyParser.urlencoded({ extended: true }));

const parseMessage = (message) => {
    console.log('message: ', message)
    // const senderName = message.user_name
    // const senderId = message.user_id
    // console.log('senderName: ', senderName)
    // console.log('senderId: ', senderId)
    const regex = /(\@\w*)([\s\S]*)/;
    const chunks = message.text.match(regex)
    console.log('chunks: ', chunks)
    const target = chunks[1];
    const kudosString = chunks[2];
    return {target, kudosString};
};

const egoFilter = (target, sender, client) => {
    console.log('');
    console.log('egoFilter');
    console.log('sender: ', sender);
   return Boolean(target.slice(1) === sender.name);
};

const egoExit = (res, sender) => {
    console.log('');
    console.log('egoExit');
    // return client.chat.postMessage(`${sender.id}`, `Sorry <@${sender.name}> you can't send kudos to yourself`, {
    //     attachments: [{
    //         text:'But kudos bot thinks you\'re great'
    //     }]
    // })
    res.json({
        text: `Sorry <@${sender.name}> you can't send kudos to yourself`,
        attachments: [{
            text:'But kudos bot thinks you\'re great'
        }]
    })
}


const sendKudos = (client, target, kudosString) => {
    console.log('sendKudos');
    return client.chat.postMessage(`${channelId}`, `:tada: Kudos to <${target}> :clap:`, {
        attachments: [{
            text:kudosString
        }]
    })
};

app.get('/', (req, res) => { console.log('GET /') || res.send('HELLO WORLD')})
app.get('/kudos', (req, res) => { console.log('GET /kudos') || res.send('KUDOS')})

app.post('/', (req, res) => {
    const sender = { name: req.body.user_name, id: req.body.user_id }
    const { target, kudosString } = parseMessage(req.body)
    const client = new WebClient(authToken);
    
    if(egoFilter(target, sender)) {
        egoExit(res, sender)
        // res.json({
        //     text: `Sorry <@${sender.name}> you can't send kudos to yourself`,
        //     attachments: [{
        //         text:'But kudos bot thinks you\'re great'
        //     }]
        // })
    } else {
        sendKudos(client, target, kudosString)
        .then(() => console.log('.then') || res.json({
            text: `Thanks for sending kudos to <${target}>`,
            attachments: [{
                text:`${kudosString}`
            }]
        }))
        .catch((err) => res.json({text: `Oops, something went wrong: ${err}`}))
    }

});

app.listen(3456);
