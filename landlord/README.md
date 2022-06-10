# kafka_RentBot

## Install and Run

### step 1 取得telegram token
開啟 telegram 找 @BotFather 申請一個 Bot。
1. /newbot
2. 輸入名稱
3. 輸入 username
4. 記下 token

<img width="614" alt="image" src="https://user-images.githubusercontent.com/71476388/173061395-3b33bbc7-6cab-4fb5-ba6c-a53b1eef41e0.png">

然後至telegram-landlord.js 找到 "MY-TOKEN" 的地方換上剛剛取得的token

### step 2
```sh
npm i
```

```sh
node telegram-landlord.js
```

userInfo object 的架構如下:
```javascript
{
  houseId: '12417982',
  houseAttr: {
    sex: '男',
    name: '鄭家宇',
    price: 20000,
    contact_information: 0966123777,
  }
}
```
