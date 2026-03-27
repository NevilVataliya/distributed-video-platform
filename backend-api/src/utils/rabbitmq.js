import amqp from "amqplib";
import { RABBITMQ } from "../constants.js";

const RABBIT_URL = RABBITMQ.URL;

export const publishToQueue = async (queueName, dataObject) => {
  console.log("rabbitmq.js")
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(dataObject)),
    { persistent: true }
  );

  console.log(`Message sent to ${queueName}`, dataObject);

  await channel.close();
  await connection.close();
};

