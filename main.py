import os
import random
import time
import requests

render_url = os.environ['render_url']
OptikServers_url = os.environ['OptikServers_url']
OptikServers_url_2 = os.environ['OptikServers_url_2']
zeabur_url = os.environ['zeabur_url']
koyeb_url = os.environ['koyeb_url']
vercel_url = os.environ['vercel_url']
vercel_share_url = os.environ['vercel_share_url']
ua_list = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.39',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1788.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1788.0  uacq',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5666.197 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 uacq',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
]


def request(uri, head=None):
    try:
        info = requests.get(uri, headers=head, timeout=6)
        return info
    except Exception as c:
        print(c)
        return None


start_time = time.time()
number = 0
while (time.time() - start_time) < 500:
    try:
        headers = {'User-Agent': random.choice(ua_list)}
        req = request(render_url, head=headers)
        req_3 = request(zeabur_url, head=headers)
        req_1 = request(vercel_share_url, head=headers)
        req_6 = request(vercel_url, head=headers)
        print(req_3.text)
        print("----------------")
        if number % 5 == 0:
            req_2 = request(OptikServers_url, head=headers)
            req_4 = request(koyeb_url, head=headers)
            req_5 = request(OptikServers_url_2, head=headers)
        if req.status_code == 200:
            print(req.status_code)
        if req.json()["code"] == 0:
            print(req.text)
            number += 1
            time.sleep(random.randint(2, 5))
        else:
            print("失败！")
            time.sleep(random.randint(5, 8))
            number += 1
    except Exception as e:
        print(e)
        time.sleep(5)
        number += 1
