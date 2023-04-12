import Imap from 'node-imap';
import cron from 'node-cron'
import dotenv from 'dotenv';
import myLogger from './winstonLog/winston.js';
import { simpleParser } from 'mailparser';
import { writeKafka } from './producer.js';


dotenv.config();
const imap = new Imap({
    user: process.env.CA_READ_MAIL_USER,
    password: process.env.CA_READ_MAIL_PASSWORD,
    host: process.env.CA_READ_MAIL_HOST,
    port: process.env.CA_READ_MAIL_PORT_IMAP,
    authTimeout: 120000,
    tls: false,
    tlsOptions: { rejectUnauthorized: false },
});


cron.schedule('*/0.3 * * * *', () => {
    imap.once('ready', function () {
        try {
            imap.openBox('INBOX', false, function (err, mailbox) {
                if (err) myLogger.info("This log INBOX %o", err);
                imap.search(['UNSEEN'], function (err, results) {
                    if (err) myLogger.info("This log UNSEEN %o", err);


                    try {
                        const f = imap.fetch(results, { bodies: '' });
                        f.on('message', function (msg, seqno) {
                            myLogger.info(`Message #${seqno}:`);
                            const prefix = `(#${seqno}) `;
                            msg.on('body', function (stream, info) {
                                simpleParser(stream, async (err, parsed) => {
                                    // const {from, subject, textAsHtml, text} = parsed;
                                    let from = parsed.from.value[0].address
                                    let subject = parsed.subject
                                    let date = parsed.date
                                    let value = parsed.text.replace(/#/g, '\"');
                                    let data = {
                                        from,
                                        subject,
                                        date, content: JSON.parse(value)
                                    }
                                    let value_convert = JSON.parse(value)
                                    if (from == 'centreonnotify@srv.fis.vn' && value_convert.SVDInfo.REQUESTER == 'monitor@test.com' && value_convert.SVDInfo.TENANT == "FIS.DTCM") {
                                        Object.assign(data, {
                                            "channel": "Monitor",
                                            "group": "TuNTC23_GroupSupport_L1",
                                            "technician": "tunguyen.0497@gmail.com",
                                            "priority": "9ad60e08-ae94-11ed-afa1-0242ac120002",
                                            "service": "b296f6a0-cc63-11ed-a775-ed9a75b07b12",
                                            "sub_service": "f055ee40-cc65-11ed-a775-ed9a75b07b12",
                                        })
                                        await writeKafka(data)
                                    } else {
                                        await writeKafka(data)
                                    }
                                    // console.log(JSON.stringify(data));
                                });
                                // let buffer = '';
                                // stream.on('data', function (chunk) {
                                //     buffer += chunk.toString('utf8');
                                // });
                                // stream.on('end', function () {
                                //     console.log(`${prefix}Body: ${buffer}`);
                                // });
                            });
                            msg.once('attributes', function (attrs) {
                                console.log(`${prefix}UID: ${attrs.uid}`);
                                console.log(`${prefix}Flags: ${attrs.flags}`);
                                const { uid } = attrs;
                                imap.addFlags(uid, ['\\Seen'], () => {
                                    // Mark the email as read after reading it
                                    console.log('Marked as read!', uid);
                                });
                            });
                            msg.once('end', function () {
                                console.log(`${prefix}Finished`);
                            });
                        });
                        f.once('error', function (err) {
                            console.log('Fetch error: ' + err);
                        });
                        f.once('end', function () {
                            console.log('Done fetching all messages.');
                            imap.end();
                        });
                    } catch (error) {
                        console.log("error %o", error);
                    }
                });
            });
        } catch (error) {
            console.log(error);
        }
    });
    imap.connect()
})