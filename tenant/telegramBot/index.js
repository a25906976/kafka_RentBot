import TelegramBot from "node-telegram-bot-api/lib/telegram.js";
import { queryHouse } from "./queryHouse.js";

// replace the value below with the Telegram token you receive from @BotFather
const token = "5548795941:AAGDOqU17eTFwXNX10TaaS9SQFOWbqIC74I";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
// kafka js
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-producer",
  brokers: ["localhost:29092"],
});
const producer = kafka.producer();
const topic = "user_info";

// 性別顯示對照
let sexMap = {
  girl: "女",
  boy: "男",
};
// 紀錄user資訊
let userInfo = {
  chatId: "",
  sex: "",
  name: "",
  price: 0,
  contact_information: "",
};

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  let sendMsg = "";
  console.log("user chatID :  " + chatId);
  console.log("msg: " + msg.text);
  if (msg.text === "/start") {
    sendMsg =
      "歡迎使用政大租屋卡夫，因為您是第一次使用，需要請您先輸入一些基本資料，以方便找到符合條件的物件。";
    userSexInfoInput(chatId, sendMsg);
  }
});

function userSexInfoInput(chatId, sendMsg) {
  bot.sendMessage(chatId, sendMsg + "\n請點選您的生理性別：", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "男", callback_data: "boy" },
          { text: "女", callback_data: "girl" },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
      force_reply: true,
    },
  });
}

bot.on("callback_query", (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };

  if (action === "girl") {
    userInfo.sex = action;
    let text = "您輸入的性別「女」";
    bot.editMessageText(text, opts);
    userNameInfoInput(msg.chat.id);
  } else if (action === "boy") {
    userInfo.sex = action;
    let text = "您輸入的性別「男」";
    bot.editMessageText(text, opts);
    userNameInfoInput(msg.chat.id);
  } else {
    // 改預算範圍format
    userInfo.price = parseInt(action);
    let text = `您輸入的價格範圍為${action}`;
    bot.editMessageText(text, opts);
    userContactInfoInput(msg.chat.id);
  }
});

function userNameInfoInput(chatId) {
  bot
    .sendMessage(chatId, "\n請輸入您的真實姓名：", {
      reply_markup: {
        force_reply: true,
      },
    })
    .then((payload) => {
      const replyListenerId = bot.onReplyToMessage(
        payload.chat.id,
        payload.message_id,
        (msg) => {
          bot.removeReplyListener(replyListenerId);
          console.log(msg.text); // here's the reply which is I think what you want
          userInfo.name = msg.text;
          if (msg.text) {
            userPriceInfoInput(chatId);
          }
        }
      );
    });
}

function userPriceInfoInput(chatId) {
  bot.sendMessage(chatId, "\n請點選您的預算上限：", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "5k", callback_data: "5000" },
          { text: "8k", callback_data: "8000" },
          { text: "10k", callback_data: "10000" },
          { text: "12k", callback_data: "12000" },
          { text: "15k", callback_data: "15000" },
          { text: "20k", callback_data: "20000" },
        ],
      ],
      // resize_keyboard: true,
      one_time_keyboard: true,
      force_reply: true,
    },
  });
}
function userContactInfoInput(chatId) {
  bot
    .sendMessage(chatId, "\n請輸入您的手機號碼：", {
      reply_markup: {
        force_reply: true,
      },
    })
    .then((payload) => {
      const replyListenerId = bot.onReplyToMessage(
        payload.chat.id,
        payload.message_id,
        (msg) => {
          bot.removeReplyListener(replyListenerId);
          userInfo.contact_information = msg.text;
          if (msg.text) {
            bot.sendMessage(
              chatId,
              `謝謝您的配合，已完成資料登入，您輸入的資料為
              \n性別:${sexMap[userInfo.sex]}
              \n姓名:${userInfo.name}
              \n預算範圍:${userInfo.price}
              \n手機號碼:${userInfo.contact_information}
              \n將為您發送合適的租屋資訊！`
            );
          }
          userInfo.chatId = chatId.toString();
          // 把資料放到 K SQL
          run(userInfo).catch(console.error);
        }
      );
    });
}

const run = async (user) => {
  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [
      {
        key: user.chatId,
        value: JSON.stringify({
          sex: user.sex,
          name: user.name,
          price: user.price,
          contact_information: user.contact_information,
        }),
      },
    ],
  });
  await producer.disconnect();
  let houseData = await queryHouse(userInfo.sex, userInfo.price);
  if (houseData[0] != undefined) {
    Object.keys(houseData).forEach((key) => {
      let element = houseData[key];
      console.log(element);
      bot.sendMessage(
        user.chatId,
        `符合您需求的房屋資訊：
      \n租屋案名:${element.title}
      \n租屋地址:${element.location}
      \n租屋類型:${element.roomType}
      \n坪數:${element.ping}
      \n樓層:${element.floor}
      \n價格:${element.price}
      \n租屋格局:${element.roomPattern}
      \n租屋標籤:${element.tags}`
      );
    });
  }
};
