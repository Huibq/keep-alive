import os
import traceback
import requests

render_url = os.environ['render_url']
render_key = os.environ['render_key']
header_key = os.environ['header_key']

headers = {
  'User-Agent': "Reqable/9.9.9",
  'X-Request-Key': render_key,
  'X-Forwarded-For': header_key
}

try:
    req = requests.get(render_url, headers=headers, timeout=10)
    print(req.text)
except:
    traceback.print_exc()
