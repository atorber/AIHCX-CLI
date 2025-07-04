from flask import Flask, render_template_string, request, redirect, url_for
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from client import AIJobConfig

app = Flask(__name__)

HTML = """
<!doctype html>
<html lang='zh-CN'>
<head>
  <meta charset='utf-8'>
  <title>AIHCX 参数配置</title>
  <style>
    body { font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif; background: #f7f7f9; margin: 0; padding: 0; }
    .container { max-width: 420px; margin: 60px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px 36px 24px 36px; }
    h2 { text-align: center; color: #333; margin-bottom: 28px; }
    form { display: flex; flex-direction: column; gap: 18px; }
    label { color: #555; font-size: 15px; margin-bottom: 4px; }
    input[type=text], input[type=password] {
      padding: 8px 12px; border: 1px solid #d0d0d5; border-radius: 5px; font-size: 15px; background: #fafbfc;
      transition: border 0.2s;
    }
    input[type=text]:focus, input[type=password]:focus {
      border: 1.5px solid #409eff; outline: none;
    }
    .btn-row { display: flex; gap: 12px; }
    input[type=submit], button[type=button] {
      background: #409eff; color: #fff; border: none; border-radius: 5px; padding: 10px 0; font-size: 16px; cursor: pointer; margin-top: 10px;
      transition: background 0.2s;
      flex: 1;
    }
    input[type=submit]:hover, button[type=button]:hover {
      background: #3076c9;
    }
    .msg { text-align: center; color: #52c41a; margin-top: 18px; font-size: 15px; }
    .field { display: flex; flex-direction: column; }
  </style>
</head>
<body>
  <div class="container">
    <h2>参数配置</h2>
    <form method="post">
      <div class="field">
        <label for="host">Host</label>
        <input type="text" id="host" name="host" value="{{ host|default('') }}">
      </div>
      <div class="field">
        <label for="access_key">Access Key</label>
        <input type="text" id="access_key" name="access_key" value="{{ access_key|default('') }}">
      </div>
      <div class="field">
        <label for="secret_key">Secret Key</label>
        <input type="password" id="secret_key" name="secret_key" value="{{ secret_key|default('') }}">
      </div>
      <div class="field">
        <label for="pool">Pool</label>
        <input type="text" id="pool" name="pool" value="{{ pool|default('') }}">
      </div>
      <div class="field">
        <label for="queue">Queue</label>
        <input type="text" id="queue" name="queue" value="{{ queue|default('') }}">
      </div>
      <div class="field">
        <label for="path">Path</label>
        <input type="text" id="path" name="path" value="{{ path|default('') }}">
      </div>
      <div class="btn-row">
        <input type="submit" value="保存">
        <button type="button" onclick="window.location.href='{{ url_for('config') }}'">重置</button>
      </div>
    </form>
    {% if saved %}
    <div class="msg">参数已保存！</div>
    {% endif %}
  </div>
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def config():
    cfg = AIJobConfig()
    saved = False
    if request.method == 'POST':
        for key in ['host', 'access_key', 'secret_key', 'pool', 'queue', 'path']:
            value = request.form.get(key, '')
            if value:
                cfg.set(key, value)
        saved = True
    # 读取最新配置
    config_data = {k: cfg.get(k) or '' for k in ['host', 'access_key', 'secret_key', 'pool', 'queue', 'path']}
    return render_template_string(HTML, saved=saved, **config_data)

def run_webserver(host='127.0.0.1', port=38765):
    print(f"Web服务已启动，请在浏览器中访问: http://{host}:{port}")
    app.run(host=host, port=port) 