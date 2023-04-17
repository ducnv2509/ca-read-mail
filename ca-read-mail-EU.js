import Imap from 'node-imap';
import cron from 'node-cron'
import dotenv from 'dotenv';
import myLogger from './winstonLog/winston.js';
import { simpleParser } from 'mailparser';
import { writeKafka } from './producer-eu.js';
import { getLinkUpload, uploadFile } from './services/uploadFileBase64.js';


dotenv.config();
const imap = new Imap({
    user: process.env.CA_READ_MAIL_USER_EU,
    password: process.env.CA_READ_MAIL_PASSWORD_EU,
    host: process.env.CA_READ_MAIL_HOST,
    port: process.env.CA_READ_MAIL_PORT_IMAP,
    authTimeout: 120000,
    tls: false,
    tlsOptions: { rejectUnauthorized: false },
});


// cron.schedule('*/3 * * * *', () => {
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
                                let value = parsed.text
                                let object = []
                                for (let i = 0; i < parsed.attachments.length; i++) {
                                    const e = parsed.attachments[i];
                                    const getlink = await getLinkUpload(e.filename, e.contentType, 'TuNTC23_Test_Tenant_01', 'dung.nguyenxuan.ncc@gmail.com')
                                    object.push(getlink.object)
                                    console.log(object);
                                    await uploadFile(getlink.upload, e.content, e.contentType)
                                }
                                let content = {
                                    from,
                                    name: subject,
                                    date,
                                    description: value,
                                    attachments: object,
                                    requester: from,
                                    status: "2102d392-ad11-11ed-afa1-0242ac120002",
                                    type: "9ac44878-ad20-11ed-afa1-0242ac120002",
                                    channel: "3c24b94c-ae97-11ed-afa1-0242ac120002",
                                    group: "TuNTC23_GroupSupport_L2",
                                    technician: "tu.test.tuntc23@gmail.com",
                                    priorities: "9ad60e08-ae94-11ed-afa1-0242ac120002",
                                    service: "ed54ee40-da92-11ed-ba85-a944b6bc27f2"
                                }
                                await writeKafka(content)
                                // console.log(parsed);
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
// })