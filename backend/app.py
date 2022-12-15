from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask import Flask, request
import functools
import time
import config

# route import
from routes.login import login
from routes.files import files
from routes.modify import modify
from routes.copy import copy_file
from routes.transfer import transfer, delete_progress

app = Flask(__name__)
app.register_blueprint(login, url_prefix="/login")
app.register_blueprint(files, url_prefix="/files")
app.register_blueprint(modify, url_prefix="/modify")
app.register_blueprint(copy_file, url_prefix="/copy_file")
app.register_blueprint(transfer, url_prefix="/transfer")
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


def login_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        if config.login_state:
            return f(*args, **kwargs)
        return "Error", 404
    return wrapper

# Socket Transfer


@socketio.on('connect')
def manage_connect():
    config.login_state[f"{request.sid}"] = True


@socketio.on('transferProgress')
def transfer_progress(data):
    transferID = data['transferID']
    # wait for the array to be made
    time.sleep(0.5)
    while True:
        try:
            if data['type'] == "download":
                emit("downloadProgressUpdate", {
                    "downloadID": transferID,
                    "files": config.getting_files[f"{transferID}"]
                })
            if data['type'] == "upload":
                emit("uploadProgressUpdate", {
                    "uploadID": transferID,
                    "files": config.putting_files[f"{transferID}"]
                })
            time.sleep(1)
        except:
            break


@socketio.on('deleteProgress')
def delete_progress_array(data):
    transfer_type = data['type']
    transferID = data['transferID']
    server_type = data['server_type']
    delete_progress(transfer_type, transferID, server_type)


@socketio.on('abortOperations')
def abortOperations(data):
    type = data['type']
    if type == "download":
        config.download_sftps[f"{data['transferID']}"].close()
    if type == "upload":
        config.upload_sftps[f"{data['transferID']}"].close()
    return "OK", 200


@socketio.on('ftpKeepAlive')
def ftp_keep_alive():
    while request.sid in config.ftp_host:
        time.sleep(60)
        config.ftp_host[f"{request.sid}"].keep_alive()


if __name__ == '__main__':
    # app.run(debug=True, host='0.0.0.0', threaded=True)
    socketio.run(app, host="0.0.0.0", debug=True)
