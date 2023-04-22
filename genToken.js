import axios from 'axios';
import { stringify } from 'qs';
import dotenv from 'dotenv'
dotenv.config()
export async function genToken() {
    let data = stringify({
        'scope': 'https://graph.microsoft.com/.default',
        'client_secret': process.env.CA_READ_MAIL_CLIENT_SECRET,
        'grant_type': process.env.CA_READ_MAIL_GRANT_TYPE,
        'client_id': process.env.CA_READ_MAIL_CLIENT_ID
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.CA_READ_MAIL_URL_GRAPH_API + '/' + process.env.CA_READ_MAIL_TENANT_ID + '/oauth2/v2.0/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data
    };

    const token = await axios.request(config)
    return token.data.access_token;
}
