import axios from 'axios';
import dotenv from 'dotenv'
import { genToken } from './genToken.js';
import { getLinkUpload, uploadFile } from './services/uploadFileBase64.js';
import { writeKafka } from './producer-eu.js';
import cron from 'node-cron'

dotenv.config()

cron.schedule('*/3 * * * *', async () => {
    const token = await genToken();
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://graph.microsoft.com/v1.0/users/${process.env.CA_READ_MAIL_MAIL_ID}/messages/?${process.env.CA_READ_MAIL_FILTER}`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
    };
    const result = await axios.request(config)

    let config_update_isRead
    let data_update = JSON.stringify({
        "isRead": true
    });
    result.data.value.forEach(async e => {
        if (e.hasAttachments == true) {

            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://graph.microsoft.com/v1.0/users/${process.env.CA_READ_MAIL_MAIL_ID}/messages/${e.id}/attachments`,
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            };

            let config_info = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://graph.microsoft.com/v1.0/users/${process.env.CA_READ_MAIL_MAIL_ID}/messages/${e.id}`,
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            };


            const content = await axios.request(config)
            const info = await axios.request(config_info)
            let object = []
            for (let i = 0; i < content.data.value.length; i++) {
                const e = content.data.value[i];
                const getlink = await getLinkUpload(e.name, e.contentType, 'TuNTC23_Test_Tenant_01', info.data.from.emailAddress.address)
                object.push(getlink.object)
                let data = {
                    from: info.data.from.emailAddress.address,
                    name: info.data.subject,
                    date: info.data.sentDateTime,
                    description: info.data.body.content,
                    attachments: object,
                    requester: info.data.from.emailAddress.address,
                    status: "2102d392-ad11-11ed-afa1-0242ac120002",
                    type: "9ac44878-ad20-11ed-afa1-0242ac120002",
                    channel: "3c24b94c-ae97-11ed-afa1-0242ac120002",
                    group: "TuNTC23_GroupSupport_L2",
                    technician: "tu.test.tuntc23@gmail.com",
                    priorities: "9ad60e08-ae94-11ed-afa1-0242ac120002",
                    service: "ed54ee40-da92-11ed-ba85-a944b6bc27f2"
                }
                let buffer_content = Buffer.from(e.contentBytes, 'base64');
                await uploadFile(getlink.upload, buffer_content, e.contentType)
                await writeKafka(data)
                config_update_isRead = {
                    method: 'PATCH',
                    maxBodyLength: Infinity,
                    url: `https://graph.microsoft.com/v1.0/users/${process.env.CA_READ_MAIL_MAIL_ID}/messages/${e.id}`,
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    data: data_update
                };
                await axios.request(config_update_isRead)
            }
        } else {
            config_update_isRead = {
                method: 'patch',
                maxBodyLength: Infinity,
                url: `https://graph.microsoft.com/v1.0/users/${process.env.CA_READ_MAIL_MAIL_ID}/messages/${e.id}`,
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                data: data_update
            };
            let data = {
                from: e.from.emailAddress.address,
                name: e.subject,
                date: e.sentDateTime,
                description: e.body.content,
                attachments: [],
                requester: e.from.emailAddress.address,
                status: "2102d392-ad11-11ed-afa1-0242ac120002",
                type: "9ac44878-ad20-11ed-afa1-0242ac120002",
                channel: "3c24b94c-ae97-11ed-afa1-0242ac120002",
                group: "TuNTC23_GroupSupport_L2",
                technician: "tu.test.tuntc23@gmail.com",
                priorities: "9ad60e08-ae94-11ed-afa1-0242ac120002",
                service: "ed54ee40-da92-11ed-ba85-a944b6bc27f2"
            }
            await writeKafka(data)
            await axios.request(config_update_isRead)
        }
    });
})

