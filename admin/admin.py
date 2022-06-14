from confluent_kafka import Consumer, KafkaError
from telegram.ext import Updater, CommandHandler
from telegram import Bot
from ksql import KSQLAPI

flag = 0 #flag = 1 if delete data

adminChatID = 0

setting = {
        'bootstrap.servers':'localhost:29092',
        'group.id':'admin.py',
        'default.topic.config': {'auto.offset.reset': 'latest'}
}
c = Consumer(setting)
c.subscribe(['house_info'])

client = KSQLAPI('http://localhost:8088')

token = 'MY-TOKEN'

bot = Bot(token)

updater = Updater(token=token)

dispatcher = updater.dispatcher

# 定義收到訊息後的動作(新增handler)
def start(update, context): # 新增指令/start
    message = update.message
    chat = message['chat']
    update.message.reply_text(text='HI  ' + str(chat['id']))
    adminChatID = chat['id']
    print(message.text)

def delete(update, context):
    house_id = update.message.text[8:]
    if(house_id == ''):
        update.message.reply_text(text='請輸入房屋ID!')
    else:
        global flag 
        flag = 1
        query_statment = 'insert into house_stream_deleted (houseid, dummy) VALUES (' +'\'' + house_id + '\'' +', cast(null as varchar))'
        client.ksql(query_statment)
        update.message.reply_text(text='房屋ID: '+ house_id + '已刪除')
        

dispatcher.add_handler(CommandHandler('start', start))
dispatcher.add_handler(CommandHandler('delete', delete))
updater.start_polling()
#updater.idle()

while True:
    msg = c.poll(0.1)
    if msg is None:
        continue
    elif not msg.error():
        if flag == 1:
            flag = 0 # continue if poll deletion from broker
            continue
     #   print(msg.error().code())
        key = msg.key().decode('utf-8')
        print("msg:\n", msg)
        if msg.value() is None:
            print("delete ...")
            bot.send_message(600381337,'房屋: ' + key  + '\n' + '已被房東刪除')
            continue
        data = msg.value().decode('utf-8')
        print('ID      :' + str(key))
        temp = data.replace('{', '')
        temp = temp.replace('}', '')
        temp = temp.replace('[', '')
        temp = temp.replace(']', '')
        temp = temp.replace(',', '\n')
        temp = temp.replace('\"', '')
        temp = temp.replace('title:',       '案名    :')
        temp = temp.replace('location:',    '地址    :')
        temp = temp.replace('roomType:',    '房型    :')
        temp = temp.replace('ping:',        '坪數    :')
        temp = temp.replace('floor:',       '樓層    :')
        temp = temp.replace('price:',       '價格    :')
        temp = temp.replace('roomPattern:', '格局    :')
        temp = temp.replace('tags:',        '標籤    :')
        temp = temp.replace('gender:',      '性別    :')
        if(temp[-1] == '0'):
            temp = temp[:-1] + '無限制'
        elif(temp[-1] == '1'):
            temp = temp[:-1] + '限男'
        else:
            temp = temp[:-1] + '限女'
        print(temp)
        bot.send_message(adminChatID,'ID        :' + key  + '\n' + temp)
    else:
        print('nothing')
        continue
