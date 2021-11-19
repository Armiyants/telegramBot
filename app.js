require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const moment = require('moment');
const cron = require('node-cron');


const {TOKEN, SERVER_URL} = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`; //TOKEN -> in order to make it unique
// and make sure that the request is coming from Telegram
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI; //the URL we are going to provide to Telegram

const users = [];

const task = cron.schedule('30 12-13 1-4 * *', async function() {
    for (let userId of users) {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: userId,
            text: 'Kind reminder. \n' +
                'For that cash.'
        }).catch(err => {
            console.log("Error while sending message", err);
        });
    }
});


const app = express();
app.use(bodyParser.json());


app.post(URI, async (req, res) => {
    console.log(req.body)

    const chatId = req?.body?.message?.chat?.id;
    users.push(chatId);

    if (['done', 'Done', 'DONE', 'DoNe'].includes(req?.body?.message?.text)) {
        task.stop();
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: 'Thank You!'
        }).catch(err => {
            console.log("Error while sending message", err);
        });
    } else {
        let day = parseInt(moment().format("D"), 10);

        if ([1, 2, 3, 4, 28, 29, 30, 31].includes(day)) {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: 'Kind reminder. \n' +
                    'For that cash.'
            }).catch(err => {
                console.log("Error while sending message", err);
            });
        } else {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: `It's ${day}th day of the month, so I guess you have already paid, haven't you?`
            }).catch(err => {
                console.log("Error while sending message", err);
            });
        }
    }

    res.status(200);
    return res.send()
});

const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

app.listen(process.env.PORT || 5000, async () => {
    console.log('App is running on port', process.env.PORT || 5000)
    await init();
    task.start();
});

