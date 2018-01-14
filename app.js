const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded());

const parseMessage = (message) => {
    const regex = /(\@\w*)(.*)/;
    const chunks = message.text.match(regex)
    const target = chunks[1];
    const kudosString = chunks[2];
    return {target, kudosString};
};

const echo = (target, kudosString) => {
    return {
        "text": `Kudos <${target}> :tada:`,
        "attachments": [
            {
                "text":kudosString
            }
        ]
    }
}

app.get('/kudos', (req, res) => {res.send('KUDOS')})

app.post('/kudos', (req, res) => {
    const {target, kudosString} = parseMessage(req.body)
    res.json(echo(target, kudosString));
});

app.listen(3456);
