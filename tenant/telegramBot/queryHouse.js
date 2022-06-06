import axios from "axios";
// 性別顯示對照
let sexMap = {
  girl: 2,
  boy: 1,
};
export const queryHouse = async (sex, price) => {
  // 推薦的房屋
  // select * from QUERYABLE_HOUSE_TABLE where gender=1 or gender=0  and price <= 8000 ;
  let houseData = [];
  let kSqlQuery = `select * from QUERYABLE_HOUSE_TABLE where price <${parseInt(
    price
  )} and gender IN (${sexMap[sex]},0) and roomType !='車位' limit 5;`;
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
    houseData = processData(rowData.data);
    return houseData;
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
};

function processData(data) {
  let originData = data;
  let dormData = [];
  originData.forEach((element) => {
    if (element.row != undefined) {
      let dormObj = {
        houseId: element.row.columns[0],
        title: element.row.columns[1],
        location: element.row.columns[2],
        roomType: element.row.columns[3],
        ping: element.row.columns[4],
        floor: element.row.columns[5],
        price: element.row.columns[6],
        roomPattern: element.row.columns[7],
        tags: element.row.columns[8],
      };
      dormData.push(dormObj);
    }
  });
  return dormData;
}
