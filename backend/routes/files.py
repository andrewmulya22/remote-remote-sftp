from flask import Blueprint, request
import os
import json
import mimetypes
import stat
import paramiko
import config

files = Blueprint("files", __name__)

# HELPER FUNCTIONS


def path_to_dict(path):
    if(path == "/" or path == ""):
        d = {'name': "/"}
    else:
        d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    d['modified'] = os.path.getmtime(path)
    if os.path.isdir(path):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        d['mimetype'] = None
    else:
        d['type'] = "file"
        d['size'] = os.path.getsize(path)
        d['mimetype'] = mimetypes.guess_type(path)
    return d


def path_to_dict_ssh(path, sftp):
    if(path == "/" or path == ""):
        d = {'name': "/"}
    else:
        d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    # file data
    fileState = sftp.stat(path)
    d['modified'] = fileState.st_mtime
    if stat.S_ISDIR(fileState.st_mode):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        d['mimetype'] = None
    else:
        d['type'] = "file"
        d['size'] = fileState.st_size
        d['mimetype'] = mimetypes.guess_type(path)
    return d


def path_to_dict_ftp(path, socketID):
    if(path == "/" or path == ""):
        d = {'name': "/"}
    else:
        d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    # file data
    try:
        d['modified'] = config.ftp_host[f"{socketID}"].path.getmtime(path)
    except:
        d['modified'] = None
    if config.ftp_host[f"{socketID}"].path.isdir(path):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        d['mimetype'] = None
    else:
        d['type'] = "file"
        d['mimetype'] = mimetypes.guess_type(path)
        try:
            d['size'] = config.ftp_host[f"{socketID}"].path.getsize(path)
        except:
            d['size'] = 0
    return d


@files.route('/api', methods=['GET'])
def api():
    socketID = request.args.get('socketID')
    data = [path_to_dict(config.default_path_api)]
    return json.dumps(data)


@files.route('/ssh', methods=['GET'])
def ssh():
    socketID = request.args.get('socketID')
    server_type = request.args.get('server_type')
    data = []
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            data = [path_to_dict_ssh(config.default_path_ssh, sftp)]
            sftp.close()
        elif server_type == "ftp":
            try:
                data = [path_to_dict_ftp("/", socketID)]
            except:
                data = [path_to_dict_ftp("/home/", socketID)]
        return json.dumps(data)
    except Exception as e:
        return f"{e}", 500


@files.route('/api-children', methods=['POST'])
def api_children():
    content = request.get_json()
    children = []
    try:
        for x in os.listdir(content['path']):
            try:
                children.append(path_to_dict(os.path.join(content['path'], x)))
            except:
                continue
        return json.dumps(children)
    except Exception as e:
        return f"{e}", 500


@files.route('/ssh-children', methods=['POST'])
def ssh_children():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    children = []
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            for x in sftp.listdir(content['path']):
                try:
                    children.append(path_to_dict_ssh(
                        os.path.join(content['path'], x), sftp))
                except Exception as e:
                    continue
            sftp.close()
        elif server_type == "ftp":
            for x in config.ftp_host[f"{socketID}"].listdir(content['path']):
                try:
                    children.append(path_to_dict_ftp(
                        os.path.join(content['path'], x), socketID))
                except Exception as e:
                    continue
        return json.dumps(children)
    except Exception as e:
        print(e)
        return f"{e}", 500
