# kafka_RentBot

## 說明

使用 telegram bot 為政大房東媒合租屋案件並透過撈取 Kafka KSQL 內的資料為房東提供潛在的房客資訊，並提供房東進行修改或刪除方屋資訊的功能。

## Install and Run
### step 1 取得 telegram token
開啟 telegram 找 @BotFather 申請一個 Bot (請參考 https://hackmd.io/@truckski/HkgaMUc24?type=view )。

然後至telegram-landlord.js 找到 "MY-TOKEN" 的地方換上剛剛取得的token

### step 2 run telegram-landlord.js 
```sh
cd ./landlord
npm install
node telegram-landlord.js
```
