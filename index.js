import { create, decryptMedia } from "@open-wa/wa-automate";
import PQueue from "p-queue";
import { nanoid } from "nanoid";
import randomWords from "random-words";
import sharp from "sharp";

var clientX;

const proc = async (message) => {
  try {
    clientX.sendSeen(message.from);

    const messageId = nanoid();
    const messageDate = new Date(message.t * 1000);
    const senderId = message.sender.id; // "905511274827@c.us"
    const senderName =
      message.sender.pushname != undefined ? message.sender.pushname : "x"; // "Tarık"
    const toSticker =
      message.mimetype != undefined && message.mimetype.includes("jpeg")
        ? 1
        : 0;

    const logMessage = `[${messageId}]: ${messageDate.toUTCString()} | ${senderId} | ${senderName} | ${
      message.isMedia ? message.mimetype : message.body
    }`;
    console.log(logMessage);

    if (toSticker === 1) {
      const stickerMetadata = {
        author: randomWords(),
        pack: randomWords(),
      };
      const mediaData = await decryptMedia(message);
      sharp(mediaData)
        .resize({
          height: 400,
          width: 400,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFormat("png")
        .toBuffer()
        .then(async (data) => {
          clientX.sendImageAsSticker(message.from, data, stickerMetadata);
        });
    }
    clientX.sendSeen(message.from);
  } catch (error) {
    console.error(error);
  }
};

const queue = new PQueue({
  concurrency: 1,
  autoStart: false,
});

const processMessage = (message) => queue.add(() => proc(message));

async function start(client) {
  const unreadMessages = await client.getAllUnreadMessages();
  unreadMessages.forEach(processMessage);
  await client.onMessage(processMessage);
  queue.start();
}

create().then((client) => {
  clientX = client;
  start(client);
});
