from flask import Blueprint, request
import paramiko
import ftputil
import config
import io

login = Blueprint("login", __name__)


@login.route('/api', methods=['POST'])
def api_login():
    content = request.get_json()
    if content['host']:
        config.login_state = True
    return "OK", 200


@login.route('/test', methods=['POST'])
def filetest():
    # print(request.form['type'])
    PKFILE = None
    try:
        PKFILE = request.files['pkfile']
    except:
        pass
    if PKFILE != None:
        print(PKFILE.read())
    return "OK"


@login.route('/ssh', methods=['POST'])
# @login_required
def ssh_login():
    try:
        config.sftp_host.close() or config.ftp_host.close()
    except:
        pass
    server_type = request.form['server_type']
    host = request.form['host']
    username = request.form['username']
    portNum = 22 if server_type == "sftp" else 21
    if request.form['port'] != '' and request.form['port'] != None:
        portNum = int(request.form['port'])
    # check if password or file is used
    authMethod = "password"
    auth = None
    try:
        auth = request.form['password']
    except:
        authMethod = "pkey"
        auth = request.files['pkfile'].read().decode("utf-8")
    if server_type == "sftp":
        print(auth)
        try:
            config.sftp_host = paramiko.Transport((host, portNum))
            if authMethod == "password":
                config.sftp_host.connect(username=username, password=auth)
            else:
                rsa_key = paramiko.RSAKey.from_private_key(io.StringIO(auth))
                config.sftp_host.connect(username=username, pkey=rsa_key)
            return "OK"
        except Exception as e:
            return f"{e}", 500
    elif server_type == "ftp":
        try:
            config.ftp_host = ftputil.FTPHost(host, username, request.form['password'], session_factory=ftputil.session.session_factory(
                encoding="UTF-8", port=portNum))
            config.ftp_host.use_list_a_option = True
            # config.ftp_host.keep_alive()
            return "OK"
        except Exception as e:
            return f"{e}", 500
