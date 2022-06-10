# kafka_RentBot

## 說明

使用 telegram bot 為政大房東媒合租屋案件並透過撈取 Kafka KSQL 內的資料為房東提供潛在的房客資訊

## Install and Run
### step 1 取得 telegram token
開啟 telegram 找 @BotFather 申請一個 Bot。
1. /newbot
2. 輸入名稱
3. 輸入 username
4. 記下 token

<img width="614" alt="image" src="https://user-images.githubusercontent.com/71476388/173061395-3b33bbc7-6cab-4fb5-ba6c-a53b1eef41e0.png">

然後至telegram-landlord.js 找到 "MY-TOKEN" 的地方換上剛剛取得的token

### step 2 run telegram-landlord.js 
```sh
cd ./kafka_RentBot/landlord
npm i
node telegram-landlord.js
```
