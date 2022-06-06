// const kafka = require("./kafka");
require("dotenv").config();
// local kafka
const { Kafka } = require("kafkajs");
const kafka = new Kafka({
    clientId: "house-producer",
    brokers: ["localhost:29092"],
});

const producer = kafka.producer();
const sendKafka = async (houseInfoList) => {
    try {
        // Producing
        await producer.send({
            topic: process.env.TOPIC,
            messages: houseInfoList,
        });
    } catch (e) {
        console.log("sending to kafka err:", e);
    }
};

const axios = require("axios");
let config = {
    method: "get",
    url: "https://rent.591.com.tw/",
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36 Edg/88.0.705.68",
    },
};

let cookieHeaders = "";
let csrf = "";
const getRentHeaders = async () => {
    const response = await axios(config, { withCredentials: true });
    let res = JSON.stringify(response.data);
    let position = res.search(`csrf-token`) + 23;
    csrf = res.substring(position, position + 40);
    cookieHeaders = response.headers["set-cookie"];
    if (cookieHeaders[2].search("urlJumpIp=1") == -1) {
        let pos = cookieHeaders[2].search("urlJumpIp") + 10;
        let ip = cookieHeaders[2].substring(pos, pos + 1);
        cookieHeaders[2] = cookieHeaders[2].replace(
            `urlJumpIp=${ip}`,
            "urlJumpIp=1"
        );
    }
};

const scraping = async (gender, rowNum) => {
    let rentInfoConfig = {
        method: "get",
        url: `https://rent.591.com.tw/home/search/rsList?is_format_data=1&is_new_list=1&type=1&multiNotice=${gender}&showMore=1&region=1&section=12&firstRow=${rowNum}`,
        headers: {
            "X-CSRF-TOKEN": csrf,
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36 Edg/88.0.705.68",
            Cookie: cookieHeaders,
        },
    };
    try {
        const {
            data: {
                records,
                data: { data },
            },
        } = await axios(rentInfoConfig);
        return { totalCount: records, data };
    } catch (error) {
        console.log("err", error);
    }
};

const trimData = (rawHouseInfo, gender) => {
    // 處理tags
    let tags = [];
    let t = rawHouseInfo.rent_tag;
    for (let n = 0; n < t.length; n++) {
        tags.push(t[n].name);
    }
    // 處理價格格式
    if (rawHouseInfo.price.includes(",")) {
        rawHouseInfo.price = parseInt(rawHouseInfo.price.replace(",", ""));
    }
    // 處理樓層格式
    if (!rawHouseInfo.floor_str) {
        rawHouseInfo.floor_str = "沒有樓層說明";
    }
    // 處理房間格式
    if (!rawHouseInfo.room_str) {
        rawHouseInfo.room_str = "沒有格局說明";
    }
    // 處理坪數格式
    if (!rawHouseInfo.area) {
        rawHouseInfo.area = null;
    } else {
        rawHouseInfo.area = parseFloat(rawHouseInfo.area);
    }
    // 處理性別限制
    let GenderLimit = { all_sex: 0, boy: 1, girl: 2 };
    let houseAttr = {
        title: rawHouseInfo.title,
        roomType: rawHouseInfo.kind_name,
        location: rawHouseInfo.location.replace("-", ""),
        ping: rawHouseInfo.area,
        price: rawHouseInfo.price,
        roomPattern: rawHouseInfo.room_str,
        floor: rawHouseInfo.floor_str,
        tags: tags,
        gender: GenderLimit[gender],
    };
    return { houseId: rawHouseInfo.post_id + "", houseAttr };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function getRandom(x) {
    return (Math.floor(Math.random() * x) + 1) * 1000;
}

const getRentList = async (gender) => {
    try {
        let end = false;
        let rowNum = 0;
        while (!end) {
            console.log(`------scraping------->rowNum=${rowNum}`);
            let { data, totalCount } = await scraping(gender, rowNum);
            let houseInfoList = [];
            for (let i = 0; i < data.length; i++) {
                const houseInfo = trimData(data[i], gender);
                console.log(houseInfo);
                houseInfoList.push({
                    key: houseInfo.houseId,
                    value: JSON.stringify(houseInfo.houseAttr),
                });
            }
            // send to kafka
            await sendKafka(houseInfoList);
            rowNum += 30;

            if (rowNum >= totalCount) {
                end = true;
                rowNum = totalCount;
            } else {
                // random delay for scraping
                await delay(getRandom(5));
            }
            console.log(`------scraping status------>${rowNum}/${totalCount}`);
        }
        console.log("------finish scraping-------");
    } catch (error) {
        console.log("error", error);
    }
};

(async () => {
    try {
        // connect to kafka
        await producer.connect();
        await getRentHeaders();
        await getRentList("girl");
        await delay(getRandom(5));
        await getRentList("boy");
        await delay(getRandom(5));
        await getRentList("all_sex");
        // disconnect kafka
        await producer.disconnect();
    } catch (e) {
        // Deal with the fact the chain failed
        console.log("e", e);
    }
})();
