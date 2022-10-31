from crypt import methods
from distutils.command.upload import upload
from subprocess import run
from flask import Flask, request, send_file
from flask_cors import CORS
import os
import json
import paramiko
from stat import S_ISDIR, S_ISREG
import functools
import shutil


app = Flask(__name__)
CORS(app)

## CHANGE THIS ##
host = None
username = None
password = None

client = paramiko.client.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
sftp = None

default_path_api = '/Users/andrewmulya/Downloads'
default_path_ssh = '/home/pi/Downloads'


@app.route('/ssh_login', methods=['POST'])
def ssh_login():
    global client, sftp, host, username, password
    content = request.get_json()
    host = content['host']
    username = content['username']
    password = content['password']
    try:
        client.connect(host, username=username, password=password)
        sftp = client.open_sftp()
        return "OK"
    except Exception as e:
        return f"{e}", 404


# HELPER FUNCTIONS


def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    d['modified'] = os.path.getmtime(path)
    if os.path.isdir(path):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        for x in os.listdir(path):
            if not x.startswith('.'):
                try:
                    d['children'].append(path_to_dict(os.path.join(path, x)))
                except:
                    continue
    else:
        d['type'] = "file"
        d['size'] = os.path.getsize(path)
    return d


def path_to_dict_ssh(path):
    global client, sftp
    d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    # file data
    fileState = sftp.stat(path)
    d['modified'] = fileState.st_mtime
    if S_ISDIR(fileState.st_mode):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        for x in sftp.listdir(path):
            try:
                d['children'].append(path_to_dict_ssh(
                    os.path.join(path, x)))
            except:
                continue
    else:
        d['type'] = "file"
        d['size'] = fileState.st_size
    return d


### ROUTING ###
@app.route('/api', methods=['GET'])
def api():
    data = [path_to_dict(default_path_api)]
    response = app.response_class(
        response=json.dumps(data),
        mimetype='application/json'
    )
    return response


@app.route('/api/delete', methods=['POST'])
def delete():
    content = request.get_json()
    try:
        if os.path.isfile(content['files']) or os.path.islink(content['files']):
            os.remove(content['files'])  # remove the file
        elif os.path.isdir(content['files']):
            shutil.rmtree(content['files'])
        return "OK"
    except Exception as e:
        return f"{e}", 404


@app.route('/api/newfolder', methods=['POST'])
def newfolder():
    content = request.get_json()
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        os.mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 404


@app.route('/api/rename', methods=['POST'])
def rename():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(sourceFile), content["fileName"])
    try:
        os.rename(sourceFile, fileName)
        return "OK"
    except Exception as e:
        return f"{e}", 404


@app.route('/api/move', methods=['POST'])
def move():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    destPath = content["destPath"]
    fileName = os.path.basename(sourceFile)
    try:
        os.rename(sourceFile, os.path.join(destPath, fileName))
        return "OK"
    except Exception as e:
        print(e)
        return f"{e}", 404

# file view/write


@app.route('/api/filedata', methods=['POST'])
def filedata():
    content = request.get_json()
    if os.path.isdir(content['filePath']):
        return "Directory", 204
    try:
        f = open(content['filePath'], 'r')
        filedata = f.read()
        f.close()
        return filedata, 200
    except Exception as e:
        return f"{e}", 404


@app.route('/api/editfile', methods=['POST'])
def editfile():
    content = request.get_json()
    try:
        f = open(content['filePath'], 'w')
        f.write(content['fileData'])
        f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 404


##### SSH ROUTES #####
@app.route('/ssh', methods=['GET'])
def ssh():
    global client
    data = [path_to_dict_ssh(default_path_ssh)]
    response = app.response_class(
        response=json.dumps(data),
        mimetype='application/json'
    )
    return response


@app.route('/ssh/delete', methods=['POST'])
def ssh_delete():
    content = request.get_json()
    try:
        deleteHandler(content['files'])
        return "OK", 200
    except Exception as e:
        return f"{e}", 404


def deleteHandler(path):
    global sftp
    print(path)
    if S_ISDIR(sftp.stat(path).st_mode):
        for x in sftp.listdir(path):
            deleteHandler(os.path.join(path, x))
        sftp.rmdir(path)
    else:
        sftp.remove(path)


@app.route('/ssh/newfolder', methods=['POST'])
def ssh_newfolder():
    global client, sftp
    content = request.get_json()
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        sftp.mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 404


@app.route('/ssh/rename', methods=['POST'])
def ssh_rename():
    global client, sftp
    content = request.get_json()
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(
        content["sourceFile"]), content["fileName"])
    try:
        sftp.rename(sourceFile, fileName)
        return "OK"
    except Exception as e:
        return f"{e}", 404


@app.route('/ssh/move', methods=['POST'])
def ssh_move():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    destPath = content["destPath"]
    fileName = os.path.basename(sourceFile)
    try:
        sftp.rename(sourceFile, os.path.join(destPath, fileName))
        return "OK"
    except Exception as e:
        print(e)
        return f"{e}", 404


# file view/write


@app.route('/ssh/filedata', methods=['POST'])
def ssh_filedata():
    global client
    content = request.get_json()
    try:
        # f = sftp.open(content['filePath'], 'r')
        # filedata = f.read()
        # f.close()
        _, stdout, ___ = client.exec_command(
            f"cat {content['filePath']}")
        output = stdout.read().decode('utf-8')
        return output, 200
    except Exception as e:
        return f"{e}", 404


@app.route('/ssh/editfile', methods=['POST'])
def ssh_editfile():
    global client
    content = request.get_json()
    try:
        f = sftp.open(content['filePath'], 'w')
        f.write(content['fileData'])
        f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 404


# FILE TRANSFER
getting_files = {}
putting_files = {}


def byte_transferred(type, transferID, filename, xfer, to_be_xfer):
    global getting_files, putting_files
    if type == "download":
        getting_files[f"{transferID}"] = {}
        getting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"
    else:
        putting_files[f"{transferID}"] = {}
        putting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"


@app.route('/sftpget', methods=['GET', 'DELETE', 'POST'])
def sftpget():
    global getting_files
    if request.method == "GET":
        downloadID = request.args.get('downloadID')
        try:
            return getting_files[f"{downloadID}"]
        except Exception as e:
            return f"{e}", 204
    if request.method == "DELETE":
        downloadID = request.args.get('downloadID')
        getting_files.pop(f"{downloadID}")
        return "OK"
    if request.method == "POST":
        content = request.get_json()
        # destination folder
        destination_folder = os.path.dirname(content['destFile']) if not os.path.isdir(
            content['destFile']) else content['destFile']
        try:
            downloadHandler(content['sourceFile'],
                            destination_folder, content['downloadID'])
            return "OK", 200
        except Exception as e:
            return f"{e}", 404


def downloadHandler(src, dest, downloadID):
    global client, sftp
    filename = os.path.basename(src)
    # if a directory
    if S_ISDIR(sftp.stat(src).st_mode):
        # create dir in api server
        newfolder = os.path.join(dest, filename)
        if not os.path.exists(newfolder):
            os.mkdir(newfolder)
        for x in sftp.listdir(src):
            try:
                downloadHandler(os.path.join(src, x), newfolder, downloadID)
            except:
                pass
    # if not a directory
    else:
        callback_downloadID = functools.partial(
            byte_transferred, "download", downloadID, filename)
        sftp.get(src, os.path.join(
            dest, filename), callback_downloadID)


@app.route('/sftpput', methods=['GET', 'DELETE', 'POST'])
def sftpput():
    global putting_files, sftp
    if request.method == "GET":
        uploadID = request.args.get('uploadID')
        try:
            return putting_files[f"{uploadID}"]
        except Exception as e:
            return f"{e}", 204
    if request.method == "DELETE":
        uploadID = request.args.get('uploadID')
        putting_files.pop(f"{uploadID}")
        return "OK"
    if request.method == "POST":
        content = request.get_json()
        try:
            fileState = sftp.stat(content['destFile'])
        except:
            fileState = None
        # if not a directory
        if fileState is None or not S_ISDIR(fileState.st_mode):
            destination_folder = os.path.dirname(content['destFile'])
        else:
            destination_folder = content['destFile']
        try:
            uploadHandler(content['sourceFile'],
                          destination_folder, content['uploadID'])
            return "OK", 200
        except Exception as e:
            return f"{e}", 404


def uploadHandler(src, dest, uploadID):
    global client, sftp
    filename = os.path.basename(src)
    # if a directory
    if os.path.isdir(src):
        # create dir in ssh server
        newfolder = os.path.join(dest, filename)
        try:
            sftp.mkdir(newfolder)
        except:
            pass
        for x in os.listdir(src):
            try:
                uploadHandler(os.path.join(src, x), newfolder, uploadID)
            except:
                pass
    # if not a directory
    else:
        callback_uploadID = functools.partial(
            byte_transferred, "upload", uploadID, filename)
        sftp.put(src, os.path.join(
            dest, filename), callback_uploadID)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
