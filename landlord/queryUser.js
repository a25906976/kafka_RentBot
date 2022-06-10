import axios from "axios";
// 性別顯示對照
let sexMap = {
  2: 'girl',
  1: 'boy',
};

export const queryHouseList = async (chatId) => {

	let num = 0;
	let id1 = chatId.toString() + "1";
	let id2 = chatId.toString() + "2";
	let id3 = chatId.toString() + "3";
	let id4 = chatId.toString() + "4";
	let id5 = chatId.toString() + "5";
	
	let kSqlQuery = `SELECT houseId,title FROM queryable_house_table WHERE houseId in ('${id1}', '${id2}', '${id3}', '${id4}', '${id5}');`;
	//let kSqlQuery = `SELECT title FROM QUERYABLE_HOUSE_TABLE;`;

	let rowData = '';
	try {
		rowData = await axios
			.post("http://0.0.0.0:8088/query", {
				ksql: kSqlQuery,
				streamsProperties: {},
			})
		.catch((error) => {
			console.error(error);
		});
		return (processHouseData(rowData.data));
	} catch (e) {
		console.log(e);
		res.status(400).send(e.message);
		return [];
	}
};

export const deleteHouse = async (houseId) => {
	//
	let kSqlQuery = `insert into house_stream_deleted (houseid, dummy) VALUES ('${houseId}', CAST(NULL AS VARCHAR));`;
	let rowData = '';
	try {
		 await axios
			.post("http://0.0.0.0:8088/ksql", {
				ksql: kSqlQuery,
				streamsProperties: {},
			})
		.catch((error) => {
			console.error(error);
		});
		//return (processHouseData(rowData.data));
	} catch (e) {
		console.log(e);
		res.status(400).send(e.message);
		return [];
	}

}


export const queryUser = async (sex, price) => {
  // 推薦的房屋
  // select * from QUERYABLE_HOUSE_TABLE where gender=1 or gender=0  and price <= 8000 ;
  let userData = [];
  let kSqlQuery = "";
  if( sex == 0 ){
	  console.log('HOHO');
	  kSqlQuery = `select * from QUERYABLE_USER_TABLE where price >= ${price} limit 5;`;

  }
  else if(sex == 1){
	  kSqlQuery = `select * from QUERYABLE_USER_TABLE where price >=${parseInt(
			  price
			  )} and sex = 'boy'  limit 5;`;
  }
  else{
	  kSqlQuery = `select * from QUERYABLE_USER_TABLE where price >=${parseInt(
			  price
			  )} and sex = 'girl'  limit 5;`;
  }
  try {
    let rowData = await axios
      .post("http://0.0.0.0:8088/query", {
        ksql: kSqlQuery,
        streamsProperties: {},
      })
      .catch((error) => {
        console.error(error);
      });

    // 整理資料
    userData = processData(rowData.data);
    return userData;
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
};

function processData(data) {
  let originData = data;
  let userData = [];
  originData.forEach((element) => {
    if (element.row != undefined) {
      let userObj = {
        userId: element.row.columns[0],
        sex: element.row.columns[1],
        name: element.row.columns[2],
        price: element.row.columns[3],
        contact_information: element.row.columns[4],
      };
      userData.push(userObj);
    }
  });
  return userData;
}

function processHouseData(data) {
  let originData = data;
  let houseData = [];
  originData.forEach((element) => {
    if (element.row != undefined) {
      let houseObj = {
       houseId: element.row.columns[0],
		title:element.row.columns[1]
      };
      houseData.push(houseObj);
    }
  });
  return houseData;
}
(async () => {
	let houseData = await queryUser(0, 10000);
	if (houseData[0] != undefined) {
    Object.keys(houseData).forEach((key) => {
      let element = houseData[key];
      console.log(element);
    });
  }
})();
