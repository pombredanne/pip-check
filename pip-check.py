#/usr/bin/env python
import sys, re, json, logging, argparse, uuid
from flask import Flask, render_template, request, session, abort
from flask_wtf.csrf import CsrfProtect
from pkg_resources import parse_version

if sys.version_info <= (3, 0):
    from commands import getstatusoutput
    import urllib2 as urllib_request
else:
    from subprocess import getstatusoutput
    import urllib.request as urllib_request

app = Flask(__name__)
app.secret_key = str(uuid.uuid4())
CsrfProtect(app)

def get_installed(local):
    pkgs = []
    if args.pip3:
        command = "pip3 freeze"
    else:
        command = "pip freeze"
    if local:
        command += " --local"
    logging.info("Running "+command)
    code, output = getstatusoutput(command)
    if not code:
        for line in output.split("\n"):
            if line and not line.startswith("##"):
                if line.startswith("-e"):
                    name = line.split("#egg=", 1)[1]
                    if name.endswith("-dev"):
                        name = name[:-4]
                    pkgs.append([name, "dev", True])
                else:
                    name, version = line.split("==")
                    pkgs.append([name, version, False])
    else:
        logging.info(command+" failed with error code "+str(code)+".")
    return pkgs

def get_latest(installed):
    latest = []
    failed = []
    for name, version, editable in installed:
        logging.info("Fetching https://pypi.python.org/pypi/"+name+"/json/.")
        req = urllib_request.Request("https://pypi.python.org/pypi/"+name+"/json/")
        try:
            handler = urllib_request.urlopen(req)
        except urllib_request.HTTPError:
            logging.error("Fetching https://pypi.python.org/pypi/"+name+"/json/ failed.")
            failed.append(name)
            continue
        if handler.getcode() == 200:
            rawJSON = handler.read()
            pkg_info = json.loads(rawJSON.decode('utf-8'))
            if parse_version(version) < parse_version(pkg_info['info']['version']):
                latest.append([name, version, pkg_info['info']['version'], editable])
    # do something about failed ones...
    return latest

# index
@app.route('/')
def index():
    return render_template('index.html')

# refresh installed packages/latest versions
@app.route('/refresh', methods=['GET'])
def refresh():
    installed = get_installed(args.local)
    return json.dumps({'updates': get_latest(installed), 'installed': installed})

# update single package
@app.route('/update/<pkg_name>', methods=['POST'])
def update(pkg_name):
    logging.info("Attempting to update package "+pkg_name+".")
    if args.pip3:
        retcode, output = getstatusoutput("pip3 install "+pkg_name)
    else:
        retcode, output = getstatusoutput("pip install "+pkg_name)
    if retcode:
        logging.error("Failed to install "+pkg_name.split("==")[0]+", `pip install "+pkg_name+"` returned error code "+str(retcode)+".")
        return json.dumps({'error': output, 'code': retcode})
    else:
        return ""

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Web App to display updates for installed pip packages on your system.")
    parser.add_argument("-H", "--host", help="Specify host to serve on (be careful, this can expose pip to the network), defaults to 127.0.0.1.")
    parser.add_argument("-P", "--port", help="Specify port to server on, defaults to 5000.")
    parser.add_argument("-L", "--local", action="store_true", help="Hide global packages if inside a virtualenv.")
    parser.add_argument("--log", help="Log to specified file.")
    parser.add_argument("--pip3", action="store_true", help="Use pip3, default is pip.")
    args = parser.parse_args()
    # detect if inside a virtualenv/pyenv
    if not args.local and hasattr(sys, 'real_prefix'):
        msg = "You are inside a virtualenv, are you sure you want to include globally installed packages? [y/N] # "
        if sys.version_info <= (3, 0):
            while True:
                answer = raw_input(msg)
                if answer in ['y', 'n', 'Y', 'N', '']:
                    break
        else:
            while True:
                answer = input(msg)
                if answer in ['y', 'n', 'Y', 'N', '']:
                    break
        if answer in ['n', 'N', '']:
            args.local = True
    if args.log:
        logging.basicConfig(filename=args.l, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
    host = args.host or '127.0.0.1'
    port = int(args.port) if args.port else 5000
    app.run(host=host, port=port, debug=True)
