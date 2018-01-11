import json
import paho.mqtt.client as mqtt
import time

mqttc = mqtt.Client()
mqttc.connect("192.168.195.7") #<--- Please change IP to match the location of your MQTT broker
# 192.168.195.7
mqttc.loop_start()

GPIO.setup(ir, GPIO.IN, GPIO.PUD_DOWN)
GPIO.setup(ir2, GPIO.IN, GPIO.PUD_DOWN)

start = 0
stop = 0

def data_collect():
    GPIO.add_event_detect(ir, GPIO.FALLING, callback=post_score, bouncetime=200)
    GPIO.add_event_detect(ir2, GPIO.RISING, callback=post_speed, bouncetime=200)
    while True:
        time.sleep(0)

    """while True:

        time.sleep(0)
        t1 = time.time()
        try:
            channel = GPIO.wait_for_edge(ir,
                                         GPIO.RISING,
                                         timeout=5000)
            if channel != None:
                rpm = 0
                brokerMessage = {'Status': 'scored', 'Player': '1', 'Score': 1, 'Data': '0'}
                print("message sent")
                mqttc.publish("lights/player1", json.dumps(brokerMessage))
            else:
                brokerMessage = {"rpm": 1}
        except KeyboardInterrupt:
            connection.close()
            GPIO.cleanup()
            sys.exit(0)"""


def post_score(channel):
    global start
    start = time.time()
    print("Start time is:")
    print(start)
    brokerMessage = {'Status': 'scored', 'Player': '1', 'Score': 1, 'Data': '0'}
    print("message sent")
    mqttc.publish("lights", json.dumps(brokerMessage))

def post_speed(channel):
    global stop
    stop = time.time()
    print("Stop time is:")
    print(stop)
    if stop > start:
        elapsed = stop-start
        print("Elapsed time is:")
        print(elapsed)
        speed = .0345/elapsed #meters per second
        mph = 2.23694*speed #convert meters/s to mph
        print("posting speed")
        print(mph)
        brokerMessage = {'Status': 'speed', 'Speed':mph}
        mqttc.publish("lights/player1", json.dumps(brokerMessage))

# while GPIO.input(ir)==0:
#     start = time.time();
#     print("Start time is:")
#     print(start);

# while GPIO.input(ir)==1:
#     print("speedRead is")
#     print(speedRead)
#     if speedRead is False:
        

if __name__ == '__main__':
    data_collect()
    print("started")
