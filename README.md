# kafka_RentBot
---
## Preprocess before we start using kafka_RentBot

### 1. start all services (kafka and ksqldb)

```sh
cd kafka_RentBot/tenant/rent
docker-compose up -d
```
### 2. Create topic, stream and table

### create topic user_info

```sh
docker exec broker \
kafka-topics --bootstrap-server broker:29092 \
             --create \
             --topic user_info
```

### create topic house_info

```sh
docker exec broker \
kafka-topics --bootstrap-server broker:29092 \
             --create \
             --topic house_info
```
### create stream and table in ksqldb-CLI

```sh
docker exec -it ksqldb-cli ksql http://ksqldb-server:8088
CREATE STREAM user_stream(userID VARCHAR KEY,sex VARCHAR, name VARCHAR, price INT, contact_information VARCHAR )WITH (kafka_topic='
user_info',value_format='json',partitions=1 );
CREATE TABLE user_table (userID VARCHAR PRIMARY KEY, sex VARCHAR, name VARCHAR, price INT, contact_information VARCHAR ) WITH (kafka_topic='user_info',
value_format='json',partitions=1);
CREATE TABLE QUERYABLE_USER_TABLE AS SELECT * FROM USER_TABLE;
create stream house_stream(houseId VARCHAR KEY,title VARCHAR,location VARCHAR,roomType VARCHAR,ping DOUBLE,floor VARCHAR,price INT,roomPattern VARCHAR,tags ARRAY<VARCHAR>,gender INT) WITH (KAFKA_TOPIC='house_info',VALUE_FORMAT='json');
create table house_table(houseId VARCHAR PRIMARY KEY,title VARCHAR,location VARCHAR,roomType VARCHAR,ping DOUBLE,floor VARCHAR,price INT,roomPattern VARCHAR,tags ARRAY<VARCHAR>,gender INT) WITH (KAFKA_TOPIC='house_info',VALUE_FORMAT='json');
CREATE TABLE QUERYABLE_HOUSE_TABLE AS SELECT * FROM HOUSE_TABLE;
```

### user_table 欄位（和 user_stream 相同欄位，userId 為 primary key）

| **項次** | **欄位名稱** | **型態** | **說明**                          |
| -------- | ------------ | -------- | --------------------------------- |
| **1**    | userId       | VARCHAR  | key                               |
| **2**    | sex          | VARCHAR  | 性別                          |
| **3**    | name         | VARCHAR  | 姓名                          |
| **4**    | price        | INT      | 價格                          |
| **5**    | conctact_information| VARCHAR   | 電話                              |


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

## Congrats! Now you have done all preprocesses with kafka topics and ksql tables.
## Please go to 'tenant/rent' folder to get more information about how to scraping rent591 data with node.js


