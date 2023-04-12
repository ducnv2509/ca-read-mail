import { Kafka } from 'kafkajs';
import dotenv from 'dotenv'
import myLogger from './winstonLog/winston.js';
dotenv.config();

const kafka = new Kafka({
    brokers: [process.env.CA_READ_MAIL_IP_KAFKA],
    ssl: false,
    sasl: {
        mechanism: 'scram-sha-256', // scram-sha-256 or scram-sha-512
        username: process.env.CA_READ_MAIL_USERNAME, password: process.env.CA_READ_MAIL_PASSWORD_KAFKA,
    },
})

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.CA_READ_MAIL_TOPIC_GROUP })


await producer.connect();
console.log("Connected to producer.");

await consumer.connect()
console.log("Connected to consumer.");


try {
    await consumer.subscribe({ topic: process.env.CA_READ_MAIL_TOPIC_KAFKA, fromBeginning: true })
} catch (error) {
    myLogger.info("BUG NE %o", error)
}
export async function writeKafka(event_data) {
    const dataValue = {
        "data": event_data
    }
    try {
        await producer.send({
            topic: process.env.CA_READ_MAIL_TOPIC_KAFKA,
            messages: [
                {
                    value: JSON.stringify(dataValue)
                },
            ],
        });
    } catch (error) {
        myLogger.info("%o", error)
    }
}

// try {
//     await consumer.run({
//         eachMessage: async ({ topic, partition, message }) => {
//             myLogger.info('ONE FOR %o', topic)
//             myLogger.info('ONE FOR %o', partition)
//             myLogger.info('This is log user_created %o', message.value.toString())
//         },
//     })
// } catch (error) {
//     myLogger.info("BUG ----> %o", error)
// }