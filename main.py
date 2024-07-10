import os
import random
import time
import requests
render_url = os.environ['render_url']
OptikServers_url = os.environ['OptikServers_url']
zeabur_url = os.environ['zeabur_url']
ua_list = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.39',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1788.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1788.0  uacq',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5666.197 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 uacq',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
]
number = 0
while number < 5:
    try:
        headers = {'User-Agent': random.choice(ua_list)}
        req = requests.get(render_url, headers=headers)
        req_2 = requests.get(OptikServers_url, headers=headers)
        if req.status_code == 200:
            print(req.status_code)
        if req.json()["code"] == 0:
            print(req.text)
            number += 1
            time.sleep(3.5)
        else:
            print("失败！")
            time.sleep(10)
    except Exception as e:
        print(e)
