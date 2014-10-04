#/usr/bin/env python
import sys, re, json
from flask import Flask, render_template
from pkg_resources import parse_version

if sys.version_info <= (3,0):
	from commands import getstatusoutput
	import urllib2 as urllib_request
else:
	from subprocess import getstatusoutput
	import urllib.request as urllib_request

def get_installed(local=False):
	pkgs = []
	command = "pip freeze"
	if local:
		command += " --local"
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
		return pkgs

def get_latest(installed):
	latest = []
	failed = []
	for name, version, editable in installed:
		req = urllib_request.Request("https://pypi.python.org/pypi/"+name+"/json/")
		try:
			handler = urllib_request.urlopen(req)
		except urllib_request.HTTPError:
			failed.append(name)
			continue
		if handler.getcode() == 200:
			rawJSON = handler.read()
			pkg_info = json.loads(rawJSON.decode('utf-8'))
			if parse_version(version) < parse_version(pkg_info['info']['version']):
				latest.append([name, version, pkg_info['info']['version'], editable])
	# do something about failed ones...
	return latest

app = Flask(__name__)

# index
@app.route('/')
def index():
    return render_template('index.html')

# refresh installed packages/latest versions
@app.route('/refresh', methods=['GET'])
def refresh():
    installed = get_installed()
    return json.dumps({'updates': get_latest(installed), 'installed': installed})

# update all packages
@app.route('/update', methods=['POST'])
def updateall():
	all_pkgs = json.loads(refresh())
	errors = []
	for u in all_pkgs['updates']:
		retcode, output = getstatusoutput("pip install "+u[0]+"=="+u[2])
		if retcode:
			errors.append({'error': output, 'code': retcode})
	return json.dumps(errors)

# update single package
@app.route('/update/<pkg_name>', methods=['POST'])
def update(pkg_name):
	retcode, output = getstatusoutput("pip install "+pkg_name)
	if retcode:
		return json.dumps({'error': output, 'code': retcode})
	else:
		return "updated"

if __name__ == '__main__':
    app.run(host="192.168.1.130")
