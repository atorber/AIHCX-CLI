from flask import Flask, render_template_string, request, redirect, url_for
from flask_cors import CORS
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from client import AIJobConfig
from flask import jsonify
# from baidubce.services.aihc_v2.aihc_client import AIHCV2Client
from baidubce.services.aihc.aihc_client import AIHCClient
import logging
from baidubce.bce_client_configuration import BceClientConfiguration
from baidubce.auth.bce_credentials import BceCredentials
from baidubce.http import http_methods
import json
from baidubce.utils import Expando

def parse_json(http_response, response):
    body = http_response.read()
    if body:
        response.__dict__.update(json.loads(
            body, object_hook=dict_to_python_object).__dict__)
        
        # 移除metadata key（如果存在）
        if 'metadata' in response.__dict__:
            del response.__dict__['metadata']
    http_response.close()
    return True

def dict_to_python_object(d):
    """

    :param d:
    :return:
    """
    attr = {}
    for k, v in list(d.items()):
        k = str(k)
        attr[k] = v
    return Expando(attr)

def to_dict(obj):
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    elif hasattr(obj, '__dict__'):
        return {k: to_dict(v) for k, v in obj.__dict__.items()}
    elif isinstance(obj, list):
        return [to_dict(i) for i in obj]
    else:
        return obj


logger = logging.getLogger('baidubce.http.bce_http_client')
fh = logging.FileHandler('sample.log')
fh.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
logger.setLevel(logging.DEBUG)
logger.addHandler(fh)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

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

@app.route('/config', methods=['GET', 'POST'])
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

# 代理aihc api，透传请求
@app.route('/', methods=['POST', 'GET'])
def proxy_aihc():
    try:
        # 从配置文件中读取host, ak, sk
        cfg = AIJobConfig()
        HOST = cfg.get('host')
        AK = cfg.get('access_key')
        SK = cfg.get('secret_key')
        print('HOST', HOST)
        print('AK', AK)
        print('SK', SK)
        aihc_sample_conf = BceClientConfiguration(credentials=BceCredentials(AK, SK), endpoint=HOST)
        print('aihc_sample_conf', aihc_sample_conf)
        print('proxy_aihc....')

        # 解析请求参数
        http_method = http_methods.GET if request.method == 'GET' else http_methods.POST
        path = b'/'
        params = request.args
        
        # 安全地获取JSON body
        try:
            body = request.get_json()
            print('body', body)
            body = json.dumps(body)
        except Exception as e:
            print('获取JSON body失败:', e)
            body = json.dumps({})

        print('http_method', http_method)
        print('path', path)
        print('body', body)
        print('params', params)
        print('params keys:', list(params.keys()))

        # 如果query参数中包含action，则透传到aihc api
        if 'action' in params:
            print('找到action参数，开始透传请求...')
            # 透传请求
            aihc_client = AIHCClient(aihc_sample_conf)
            response = aihc_client._send_request(
                http_method=http_method,
                path=path,
                body=body,
                params=params,
                headers={
                    # b'version': b'v2',
                    b'X-API-Version': b'v2',
                },
                body_parser=parse_json
            )

            print('请求response', response)

            # 返回响应
            return jsonify(to_dict(response)), 200
        else:
            print('未找到action参数，返回404')
            # 返回404
            return jsonify({'error': 'Not Found'}), 404
    except Exception as e:
        print('proxy_aihc函数发生异常:', e)
        return jsonify({'error': str(e)}), 500

def run_webserver(host='127.0.0.1', port=38765):
    print(f"Web服务已启动，请在浏览器中访问配置页面: http://{host}:{port}/config")
    app.run(host=host, port=port, debug=True) 