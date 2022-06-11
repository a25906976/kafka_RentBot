# Scraping rent591 data with node.js

---

## Step 1: Install and Run

### npm install packages

```sh
npm i
```

### 建立一個.env 檔案

請設定 TOPIC 為使用的 topic 名稱（這裡以 house_info 為例），除 TOPIC 外其他的 environment variables 是 optional(雲端才會使用到)。

```
KAFKA_BOOTSTRAP_SERVER=<your server endpoint>
KAFKA_USERNAME=<your api key>
KAFKA_PASSWORD=<your api secret>
TOPIC=house_info
```

### run the script

```sh
node rent.js
```

houseInfo object 的架構如下

```javascript
{
  houseId: '12417982',
  houseAttr: {
    title: '木柵辛亥捷運站旁雅緻南洋風透天厝',
    roomType: '整層住家',
    location: '文山區辛亥路四段101巷',
    ping: 40,
    price: 45000,
    roomPattern: '2房2廳',
    floor: '整棟/2F',
    tags: [ '近捷運', '拎包入住', '有電梯', '隨時可遷入', '可開伙', '免管理費' ],
    gender: 0
  }
}
```

### run sh file（optional)

執行此檔會每十分鐘執行一次 rent.js，每十分鐘爬取資料塞入 ksqldb。

```sh
sh run.sh
```

## Step 2: Check status

### ksql query 檢查 table 和 stream 狀態

| :exclamation: This is very important |
| ------------------------------------ |

注意！！如果要取得當下之前的資料要 set auto offset reset [參考](https://myapollo.com.tw/zh-tw/kafka-auto-offset-reset/)。

```sh
SET 'auto.offset.reset' = 'earliest';
```

以下列出幾種 query 不需依序執行，單個執行即可。詳細請參考 [ksqlDB Documentation](https://docs.ksqldb.io/en/latest/)。

```sh
select * from house_stream emit changes;
select * from house_table emit changes;
SELECT COUNT(*) FROM `HOUSE_TABLE` GROUP BY 1 EMIT CHANGES;
SELECT COUNT(*) FROM `HOUSE_STREAM` GROUP BY 1 EMIT CHANGES;
describe house_stream extended;
describe house_table extended;
CREATE TABLE QUERYABLE_HOUSE_TABLE AS SELECT * FROM HOUSE_TABLE;
```
