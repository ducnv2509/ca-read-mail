import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
export async function uploadFile(url, data, type) {
    let config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
            'Content-Type': type
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log('this log uploadfile ------------', error);
        });

}


export async function getLinkUpload(file_name, type, tenant, userId) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.CA_READ_MAIL_URL_GET_LINK + `/${file_name}?type=${type}&tenant=${tenant}&userId=${userId}`,
        headers: {}
    };
    const a = await axios.request(config);
    return a.data
}
