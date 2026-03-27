import amqp from "amqplib";
import { RABBITMQ } from "../constants.js";

const RABBIT_URL = RABBITMQ.URL;

export const consumeQueue = async (queueName, processingFunction) => {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  // 🔒 CPU SAFETY LOCK
  channel.prefetch(RABBITMQ.PREFETCH_COUNT);

  console.log(`Waiting for messages in ${queueName}`);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    try {
      await processingFunction(
        data,
        () => channel.ack(msg),                // ✅ success
        () => channel.nack(msg, false, false) // ❌ fail (no retry)
      );
    } catch (err) {
      console.error("Processing error:", err);
      channel.nack(msg, false, false);
    }
  });
};