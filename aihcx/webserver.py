from flask import Flask, render_template, request, redirect, url_for
from flask_cors import CORS
import os
import sys

from requests import delete
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from client import AIJobConfig
from flask import jsonify
# from baidubce.services.aihc_v2.aihc_client import AIHCV2Client
from baidubce.services.aihc.aihc_client import AIHCClient, AihcClient
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


app = Flask(__name__, template_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'aihcx', 'templates'))
CORS(app, resources={r"/*": {"origins": "*"}})


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
    return render_template('config.html', saved=saved, **config_data)

@app.route('/datasets', methods=['GET'])
def datasets():
    return render_template('datasets.html')

@app.route('/datasets/<dataset_id>', methods=['GET'])
def dataset_detail(dataset_id):
    return render_template('dataset_detail.html', dataset_id=dataset_id)

@app.route('/models', methods=['GET'])
def models():
    return render_template('models.html')

@app.route('/resourcepools', methods=['GET'])
def resourcepools():
    return render_template('resourcepools.html')

@app.route('/jobs', methods=['GET'])
def jobs():
    cfg = AIJobConfig()
    default_pool_id = cfg.get('pool') or ''
    return render_template('jobs.html', default_pool_id=default_pool_id)

@app.route('/jobs/<job_id>', methods=['GET'])
def job_detail(job_id):
    return render_template('job_detail.html', job_id=job_id)

# 添加静态文件路由
@app.route('/aihcx/static/<path:filename>')
def static_files(filename):
    from flask import send_from_directory
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'aihcx', 'static'), filename)

@app.route('/', methods=['GET'])
def welcome():
    try:
        # 读取README文件内容
        readme_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'README.md')
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()
        
        # 将Markdown转换为HTML（简单的转换）
        import re
        # 转换标题
        readme_content = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', readme_content, flags=re.MULTILINE)
        readme_content = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', readme_content, flags=re.MULTILINE)
        readme_content = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', readme_content, flags=re.MULTILINE)
        readme_content = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', readme_content, flags=re.MULTILINE)
        
        # 转换代码块
        readme_content = re.sub(r'```(.*?)\n(.*?)```', r'<pre><code class="\1">\2</code></pre>', readme_content, flags=re.DOTALL)
        
        # 转换行内代码
        readme_content = re.sub(r'`([^`]+)`', r'<code>\1</code>', readme_content)
        
        # 转换列表
        readme_content = re.sub(r'^\* (.*?)$', r'<li>\1</li>', readme_content, flags=re.MULTILINE)
        readme_content = re.sub(r'^- (.*?)$', r'<li>\1</li>', readme_content, flags=re.MULTILINE)
        readme_content = re.sub(r'^\d+\. (.*?)$', r'<li>\1</li>', readme_content, flags=re.MULTILINE)
        
        # 转换粗体和斜体
        readme_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', readme_content)
        readme_content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', readme_content)
        
        # 转换链接
        readme_content = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank">\1</a>', readme_content)
        
        # 转换段落
        readme_content = re.sub(r'\n\n([^<].*?)\n\n', r'<p>\1</p>', readme_content, flags=re.DOTALL)
        
        # 清理多余的换行
        readme_content = re.sub(r'\n{3,}', r'\n\n', readme_content)
        
        return render_template('welcome.html', readme_content=readme_content)
    except Exception as e:
        print(f'读取README文件失败: {e}')
        return render_template('welcome.html', readme_content='<p>无法加载README内容，请检查文件是否存在。</p>')

# 代理aihc api，透传请求
@app.route('/api', methods=['POST', 'GET'])
@app.route('/api/<path:subpath>', methods=['POST', 'GET'])
def proxy_aihc(subpath=None):
    logger.info('proxy_aihc')
    try:
        # 从配置文件中读取host, ak, sk
        cfg = AIJobConfig()
        HOST = cfg.get('host')
        AK = cfg.get('access_key')
        SK = cfg.get('secret_key')
        aihc_sample_conf = BceClientConfiguration(credentials=BceCredentials(AK, SK), endpoint=HOST)

        # 解析请求参数
        http_method = http_methods.GET if request.method == 'GET' else http_methods.POST
        path = b'/'
        params = request.args
        url = request.url
        logger.info('url: %s', url)
        
        # 安全地获取JSON body
        try:
            body = request.get_json()
            print('body', body)
            body = json.dumps(body)
        except Exception as e:
            print('没有body参数:', e)
            body = json.dumps({})

        print('http_method', http_method)
        print('path', path)
        print('body', body)
        print('params', params)
        print('params keys:', list(params.keys()))

        # 检查URL路径是否包含v1或v2
        url_path = request.path
        logger.info('url_path: %s', url_path)

        # 如果query参数中包含action，则透传到aihc api
        if 'action' in params:
            print('找到action参数，开始透传请求...', params['action'])
            # 透传请求

            if params['action'] in ['DescribeResourcePools', 'DescribeResourcePool', 'DescribeQueues', 'DescribeQueue']:
                print('获取资源池/队列相关接口请求:', http_method, '/', body, params)
                aihc_client = AihcClient(aihc_sample_conf)
                print('开始请求...')
                response = aihc_client.base_client._aihc_request(
                    http_method=http_method,
                    path='/',
                    body=body,
                    params=params,
                )
                print('请求完成...')
                # print('获取资源池/队列相关接口响应:', response)         # 返回响应
                return jsonify(json.loads(response.raw_data)), 200
            else:
                print('数据集/模型/任务等相关接口请求:', http_method, path, body, params)
                aihc_client = AIHCClient(aihc_sample_conf)
                response = aihc_client._send_request(
                    http_method=http_method,
                    path=path,
                    body=body,
                    params=params,
                    headers={
                        b'version': b'v2',
                        b'X-API-Version': b'v2',
                    },
                    body_parser=parse_json
                )
                print('数据集/模型/任务等相关接口响应:', response)         # 返回响应
                return jsonify(to_dict(response)), 200

        elif '/v1/' in url_path:
            logger.info('找到v1路径，开始透传请求...')
            # 透传请求
            aihc_client = AIHCClient(aihc_sample_conf)
            response = aihc_client._send_request(
                http_method=http_method,
                path=url_path.encode('utf-8'),
                body=body,
                params=params,
                headers={
                    b'version': b'v1',
                    b'X-API-Version': b'v1',
                },
                body_parser=parse_json
            )

            print('请求response', response)

            # 返回响应
            return jsonify(to_dict(response)), 200
        elif '/v2/' in url_path:
            logger.info('找到v2路径，开始透传请求...')
            # 透传请求
            aihc_client = AIHCClient(aihc_sample_conf)
            response = aihc_client._send_request(
                http_method=http_method,
                path=url_path.encode('utf-8'),
                body=body,
                params=params,
                headers={
                    b'version': b'v2',
                    b'X-API-Version': b'v2',
                },
                body_parser=parse_json
            )

            print('请求response', response)

            # 返回响应
            return jsonify(to_dict(response)), 200
        else:
            print('未找到action参数或v1/v2路径，返回404')
            # 返回404
            return jsonify({'error': 'Not Found'}), 404
    except Exception as e:
        print('proxy_aihc函数发生异常:', e)
        return jsonify({'error': str(e)}), 500

def run_webserver(host='127.0.0.1', port=38765):
    print(f"Web服务已启动，请在浏览器中访问配置页面: http://{host}:{port}/config")
    app.run(host=host, port=port, debug=True) 