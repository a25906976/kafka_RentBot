import TelegramBot from "node-telegram-bot-api/lib/telegram.js";
import { queryUser } from "./queryUser.js";
import { queryHouseList, deleteHouse } from "./queryUser.js";

// replace the value below with the Telegram token you receive from @BotFather
const token = "5402488567:AAHs7lYyiuZQmpDw4Gjom5YL4dQeP5lJxuc";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

let isEmpty = [0, 0, 0, 0, 0]; 
// kafka js
import { Kafka } from "kafkajs";
const kafka = new Kafka({
    clientId: "my-producer",
    brokers: ["localhost:29092"],
});
const producer = kafka.producer();
const topic = "house_info";


// 紀錄house資訊
let houseId = "";
let houseInfo = {
    title: "",
    location: "",  // 0.0,
    roomType: "",
    ping: 0.0,
    floor: "",
    price: 0,
    roomPattern: "",
    tags: [""],  //"",
    gender: 0,
};

const sendKafka = async (houseInfoList) => {
	await producer.connect(); 
	try {
		// Producing
		await producer.send({
			//topic: process.env.TOPIC,
			topic: topic,
			messages: houseInfoList,
		}); 
	} catch (e) {
		console.log("sending to kafka err:", e);
	}
	await producer.disconnect();
};



const replyHouseList = async (chatId) => {
	let houseList = await queryHouseList(chatId);
	bot.sendMessage(
			chatId,
			`歡迎來到政大租屋卡夫，您目前有${houseList.length}間房屋。`
			)
        .then((payload) => {
				if (houseList[0] != undefined) {
				Object.keys(houseList).forEach((key) => {
						let element = houseList[key];
						isEmpty[element.houseId.slice(-1)] = 1;
						console.log(element);
						bot.sendMessage(
								chatId,
								`您目前的房屋資訊：
								\n房屋ID:${element.houseId.slice(-1)}
								\n房屋title:${element.title}
								`
								);
						});
				}
				else{
					console.log("you don't have any house.\n");
				}
				houseIdInfoInput(chatId);
            
		});

}


const replyUser = async (chatId) => {
	//console.log(`gender1: ${houseInfoList[0].gender}`);
	//console.log(`gender2: ${houseInfoList.gender}`);
	//console.log(`3: ${houseInfoList}`);
	let userData = await queryUser(houseInfo.gender, houseInfo.price);
	if (userData[0] != undefined) {
		Object.keys(userData).forEach((key) => {
				let element = userData[key];
				console.log(element);
				bot.sendMessage(
						chatId,
						`符合您房屋資訊預算的租客：
						\n租客姓名:${element.name}
						\n租客性別:${element.sex}
						\n租客預算:${element.price}
						\n租客聯絡電話:${element.contact_information}`
						);
				});
	}
}
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    let sendMsg = "";
    console.log("user chatID :  " + chatId);
    console.log("msg: " + msg.text);
    if (msg.text === "/start") {
        sendMsg =
            "歡迎使用政大租屋卡夫，請您先輸入一些房屋的基本資料，以方便找到符合條件的房客。";
       // houseIdInfoInput(chatId, sendMsg);
		replyHouseList(msg.chat.id);

		//console.log(houseInfo);
		//run(houseInfo).catch(console.error);
    }
});

function houseIdInfoInput(chatId) {
    bot.sendMessage(chatId, "\n請點選房屋的Id：", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "房屋A", callback_data: "1" },
                    { text: "房屋B", callback_data: "2" },
                    { text: "房屋C", callback_data: "3" },
                    { text: "房屋D", callback_data: "4" },
                    { text: "房屋E", callback_data: "5" },
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
    if (action === "1" || action === "2" || action === "3" || action === "4" || action === "5") {
        //houseId = (msg.chat.id + Number(action)).toString()
        houseId = ((msg.chat.id).toString() + action);
		if(isEmpty[parseInt(action)] === 0){
			let text = "此房屋的ID編號為" + action + "尚無房屋資訊，請新增。";
			console.log(text);
        	bot.editMessageText(text, opts);
        	housetitleInfoInput(msg.chat.id);
		}
		else{
			let text = "此房屋的ID編號為" + action ;
        	bot.editMessageText(text, opts);
			console.log(text);
			modifyOrDelete(msg.chat.id);
        	//housetitleInfoInput(msg.chat.id);
			// delete this houseInfo.

		}

    } else if (action === "套房" || action === "雅房" || action === "整層住家") {
        let text = "您輸入的租屋類型為" + action;
        bot.editMessageText(text, opts);
        houseInfo.roomType = action;
        housepingInfoInput(msg.chat.id);

    } else if (action === "限男" || action === "限女" || action === "無限制") {
        if (action === "限男") {
            houseInfo.gender = 1;
        } else if (action === "限女") {
            houseInfo.gender = 2;
        } else {
            houseInfo.gender = 0;
        }
        let text = "您輸入的性別限制為" + action;
        bot.editMessageText(text, opts);
        //houseInfo.gender = action;
        houseInfoOutput(msg.chat.id);
    }
		else if (action === "delete"){
			// do delete this houseInfo.
        	let text = `已刪除房屋${houseId.slice(-1)}`;
        	bot.editMessageText(text, opts);
			deleteHouse(houseId);
		}
		else if (action === "modify"){
			// do modify this houseInfo.
        	let text = `請修改房屋${houseId.slice(-1)}`;
        	bot.editMessageText(text, opts);
        	housetitleInfoInput(msg.chat.id);
		}
		else {
        // debug
        console.log(action)
    }
});

function housetitleInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的租屋案名：", {
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
                    houseInfo.title = msg.text;
                    if (msg.text) {
                        houselocationInfoInput(chatId);
                    }
                }
            );
        });
}

function houselocationInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的租屋地址：", {
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
                    houseInfo.location = msg.text;
                    if (msg.text) {
                        houseroomTypeInfoInput(chatId);
                    }
                }
            );
        });
}

function houseroomTypeInfoInput(chatId, sendMsg) {
    bot.sendMessage(chatId, "\n請點選租屋類型：", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "整層住家", callback_data: "整層住家" },
                    { text: "套房", callback_data: "套房" },
                    { text: "雅房", callback_data: "雅房" },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        },
    });
}

function modifyOrDelete(chatId){
	bot.sendMessage(chatId, "\n請選擇要修改或刪除房屋資訊。",{
		reply_markup: {
			inline_keyboard: [
				[
					{text: "修改", callback_data: "modify" },
					{text: "刪除", callback_data: "delete" },
				],
			],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        },
    });

}

function housepingInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的房屋坪數：", {
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
                    houseInfo.ping = parseInt(msg.text);
                    if (msg.text) {
                        housefloorInfoInput(chatId);
                    }
                }
            );
        });
}

function housefloorInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的房屋樓層：", {
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
                    houseInfo.floor = msg.text;
                    if (msg.text) {
                        housepriceInfoInput(chatId);
                    }
                }
            );
        });
}

function housepriceInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的房屋價格：", {
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
                    houseInfo.price = parseInt(msg.text);
                    if (msg.text) {
                        houseroomPatternInfoInput(chatId);
                    }
                }
            );
        });
}

function houseroomPatternInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的房屋格局 ex.一房一廳一衛：", {
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
                    houseInfo.roomPattern = msg.text;
                    if (msg.text) {
                        housetagsInfoInput(chatId);
                    }
                }
            );
        });
}

function housetagsInfoInput(chatId) {
    bot
        .sendMessage(chatId, "\n請輸入您的房屋的其他標註(請以空白鍵分隔)", {
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
                    houseInfo.tags = (msg.text).split(' ');
                    if (msg.text) {
                        houseGenderInfoInput(chatId);
                    }
                }
            );
        });
}

function houseGenderInfoInput(chatId) {
    bot.sendMessage(chatId, "\n請點選房屋的性別限制：", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "限男", callback_data: "限男" },
                    { text: "限女", callback_data: "限女" },
                    { text: "無限制", callback_data: "無限制" },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        },
    });
}

async function houseInfoOutput(chatId) {
    bot.sendMessage(chatId, `謝謝您的配合，已完成資料登入，您輸入的資料為
                            \n房屋Id:${houseId}
                            \n租屋案名:${houseInfo.title}
                            \n租屋地址:${houseInfo.location}
                            \n租屋格局:${houseInfo.roomPattern}
							\n房屋類型:${houseInfo.roomType}
                            \n房屋坪數:${houseInfo.ping}
                            \n房屋樓層:${houseInfo.floor}
                            \n租屋價格:${houseInfo.price}
                            \n租屋標籤:${houseInfo.tags}
                            \n性別限制:${houseInfo.gender}
                            \n將為您發送合適的租客資訊！`, {
    })
	let newHouseInfo = {houseId: houseId+"", houseInfo};
	let houseInfoList = [];
	houseInfoList.push({
		key: newHouseInfo.houseId,
		value: JSON.stringify(newHouseInfo.houseInfo),
	});
	console.log(newHouseInfo);
	//console.log(houseInfoList);
	await sendKafka(houseInfoList);
	await replyUser(chatId);
}




/*
// Producer: put house data into house
const run = async (houseInfo) => {
  console.log("run...");
  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [
      {
		key: houseInfo.houseId,
    	value: JSON.stringify({
			title: houseInfo.title,
    		location: houseInfo.location,
    		roomType: houseInfo.roomType,
    		ping: houseInfo.ping,
    		floor: houseInfo.floor,
    		price: houseInfo.price,
    		roomPattern: houseInfo.roomPattern,
    		tags: houseInfo.tags,
    		gender: houseInfo.gender,
			}),
	  },
    ],
  });
  await producer.disconnect();
};
*/
