# Scraping rent591 data with node.js

---

下列 kafka 和 ksqldb 的操作使用 Docker.

## Step 1: Start kafka service

### start all services

```sh
docker-compose up -d
```

## Step 2: Create topic, stream and table

### create topic house_info

```sh
docker exec broker \
kafka-topics --bootstrap-server broker:29092 \
             --create \
             --topic house_info
```

### create stream house_stream and table house_table

先進入 ksqldb-cli，再執行 ksql query。house_stream 和 house_table 分別設 houseId 為 key 和 primary key。

```sh
docker exec -it ksqldb-cli ksql http://ksqldb-server:8088
create stream house_stream(houseId VARCHAR KEY,title VARCHAR,location VARCHAR,roomType VARCHAR,ping DOUBLE,floor VARCHAR,price INT,roomPattern VARCHAR,tags ARRAY<VARCHAR>,gender INT) WITH (KAFKA_TOPIC='house_info',VALUE_FORMAT='json');
create table house_table(houseId VARCHAR PRIMARY KEY,title VARCHAR,location VARCHAR,roomType VARCHAR,ping DOUBLE,floor VARCHAR,price INT,roomPattern VARCHAR,tags ARRAY<VARCHAR>,gender INT) WITH (KAFKA_TOPIC='house_info',VALUE_FORMAT='json');

```

### house_stream 欄位

| **項次** | **欄位名稱** | **型態** | **說明**                          |
| -------- | ------------ | -------- | --------------------------------- |
| **1**    | houseId      | VARCHAR  | key                               |
| **2**    | title        | VARCHAR  | 租屋案名                          |
| **3**    | location     | VARCHAR  | 租屋地址                          |
| **4**    | roomType     | VARCHAR  | 租屋類型                          |
| **5**    | ping         | DOUBLE   | 坪數                              |
| **6**    | floor        | VARCHAR  | 樓層                              |
| **7**    | price        | INT      | 價格                              |
| **8**    | roomPattern  | VARCHAR  | 租屋格局                          |
| **9**    | tags         | ARRAY    | 租屋標籤                          |
| **10**   | gender       | INT      | (0：無性別限制，1：限男，2：限女) |

### house_table 欄位（和 house_stream 相同欄位，houseId 為 primary key）

| **項次** | **欄位名稱** | **型態** | **說明**                          |
| -------- | ------------ | -------- | --------------------------------- |
| **1**    | houseId      | VARCHAR  | primary key                       |
| **2**    | title        | VARCHAR  | 租屋案名                          |
| **3**    | location     | VARCHAR  | 租屋地址                          |
| **4**    | roomType     | VARCHAR  | 租屋類型                          |
| **5**    | ping         | DOUBLE   | 坪數                              |
| **6**    | floor        | VARCHAR  | 樓層                              |
| **7**    | price        | INT      | 價格                              |
| **8**    | roomPattern  | VARCHAR  | 租屋格局                          |
| **9**    | tags         | ARRAY    | 租屋標籤                          |
| **10**   | gender       | INT      | (0：無性別限制，1：限男，2：限女) |

## Step 3: Install and Run

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

houseInfo object 的架構如下。

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

## Step 4: Check status

### ksql query 檢查 table 和 stream 狀態

| :exclamation: This is very important |
| ------------------------------------ |

注意！！如果要取得當下之前的資料要 set auto offset reset。[參考](https://myapollo.com.tw/zh-tw/kafka-auto-offset-reset/)

```sh
SET 'auto.offset.reset' = 'earliest';
```

以下列出幾種 query 不需依序執行，單個執行即可。詳細請參考[ksqlDB Documentation](https://docs.ksqldb.io/en/latest/)。

```sh
select * from house_stream emit changes;
select * from house_table emit changes;
SELECT COUNT(*) FROM `HOUSE_TABLE` GROUP BY 1 EMIT CHANGES;
SELECT COUNT(*) FROM `HOUSE_STREAM` GROUP BY 1 EMIT CHANGES;
describe house_stream extended;
describe house_table extended;
CREATE TABLE QUERYABLE_HOUSE_TABLE AS SELECT * FROM HOUSE_TABLE;
```
