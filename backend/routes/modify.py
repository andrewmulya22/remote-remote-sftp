from flask import Blueprint, request
from pathlib import Path
import os
import stat
import shutil
import paramiko
import config

modify = Blueprint("modify", __name__)


@modify.route('/api-delete', methods=['POST'])
def delete():
    content = request.get_json()
    try:
        if os.path.isfile(content['files']) or os.path.islink(content['files']):
            os.remove(content['files'])  # remove the file
        elif os.path.isdir(content['files']):
            shutil.rmtree(content['files'])
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/api-newfolder', methods=['POST'])
def newfolder():
    content = request.get_json()
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        os.mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/api-rename', methods=['POST'])
def rename():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(sourceFile), content["fileName"])
    if sourceFile != fileName:
        try:
            os.rename(sourceFile, fileName)
            return "OK"
        except Exception as e:
            return f"{e}", 500
    return "No Change", 204


@modify.route('/api-move', methods=['POST'])
def move():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    destPath = content["destPath"]
    fileName = os.path.basename(sourceFile)
    try:
        os.rename(sourceFile, os.path.join(destPath, fileName))
        return "OK"
    except Exception as e:
        return f"{e}", 500

# file view/write


@modify.route('/api-filedata', methods=['POST'])
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
        return f"{e}", 500


@modify.route('/api-editfile', methods=['POST'])
def editfile():
    content = request.get_json()
    try:
        f = open(content['filePath'], 'w')
        f.write(content['fileData'])
        f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


@modify.route('/api-properties', methods=['POST'])
def properties():
    content = request.get_json()
    try:
        filestat = os.stat(content['sourceFile'])
        d = {'name': os.path.basename(content['sourceFile'])}
        d['size'] = filestat.st_size
        d['mode'] = oct(filestat.st_mode)
        d['uid'] = filestat.st_uid
        d['gid'] = filestat.st_gid
        d['mtime'] = filestat.st_mtime
        d['atime'] = filestat.st_atime
        return d, 200
    except Exception as e:
        return f"{e}", 500


@modify.route('/api-changeMod', methods=['POST'])
def changePerm():
    content = request.get_json()
    try:
        Path(content['path']).chmod(int(content['newMod'], 8))
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/api-newfile', methods=['POST'])
def newFile():
    content = request.get_json()
    try:
        Path(os.path.join(content['path'], content['folderName'])).touch()
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/ssh-delete', methods=['POST'])
def ssh_delete():
    socketID = request.args.get('socketID')
    content = request.get_json()
    try:
        sftp = paramiko.SFTPClient.from_transport(
            config.sftp_host[f"{socketID}"]) if content['server_type'] == "sftp" else None
        deleteHandler(content['files'], content['server_type'], sftp, socketID)
        if sftp is not None:
            sftp.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


def deleteHandler(path, server_type, sftp, socketID):
    if server_type == "sftp":
        dir_check = stat.S_ISDIR(sftp.stat(path).st_mode)
        if dir_check:
            for x in sftp.listdir(path):
                deleteHandler(os.path.join(path, x),
                              server_type, sftp, socketID)
            sftp.rmdir(path)
        else:
            sftp.remove(path)
    elif server_type == "ftp":
        dir_check = config.ftp_host[f"{socketID}"].path.isdir(path)
        if dir_check:
            for x in config.ftp_host[f"{socketID}"].listdir(path):
                deleteHandler(os.path.join(path, x),
                              server_type, sftp, socketID)
            config.ftp_host[f"{socketID}"].rmdir(path)
        else:
            config.ftp_host[f"{socketID}"].remove(path)


@modify.route('/ssh-newfolder', methods=['POST'])
def ssh_newfolder():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            sftp.mkdir(folderName)
            sftp.close()
        elif server_type == "ftp":
            config.ftp_host[f"{socketID}"].mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/ssh-rename', methods=['POST'])
def ssh_rename():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(
        content["sourceFile"]), content["fileName"])
    if sourceFile != fileName:
        try:
            if server_type == "sftp":
                sftp = paramiko.SFTPClient.from_transport(
                    config.sftp_host[f"{socketID}"])
                sftp.rename(sourceFile, fileName)
                sftp.close()
            elif server_type == "ftp":
                config.ftp_host[f"{socketID}"].rename(sourceFile, fileName)
            return "OK"
        except Exception as e:
            return f"{e}", 500
    return "No Change", 204


@modify.route('/ssh-move', methods=['POST'])
def ssh_move():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    sourceFile = content["sourceFile"]
    destPath = content["destPath"]
    fileName = os.path.basename(sourceFile)
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            sftp.rename(sourceFile, os.path.join(destPath, fileName))
            sftp.close()
        elif server_type == "ftp":
            config.ftp_host[f"{socketID}"].rename(
                sourceFile, os.path.join(destPath, fileName))
        return "OK"
    except Exception as e:
        return f"{e}", 500


@modify.route('/ssh-newfile', methods=['POST'])
def ssh_newFile():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            f = sftp.open(os.path.join(
                content['path'], content['folderName']), 'a')
            f.flush()
            sftp.close()
        elif server_type == "ftp":
            f = config.ftp_host[f"{socketID}"].open(os.path.join(
                content['path'], content['folderName']), 'w')
            f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500
# file view/write


@modify.route('/ssh-filedata', methods=['POST'])
def ssh_filedata():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    # try:
    if server_type == "sftp":
        sftp = paramiko.SFTPClient.from_transport(
            config.sftp_host[f"{socketID}"])
        f = sftp.open(content['filePath'], 'r')
        filedata = f.read()
        f.close()
        sftp.close()
        return filedata, 200
    elif server_type == "ftp":
        f = config.ftp_host[f"{socketID}"].open(content['filePath'], 'r')
        filedata = f.read()
        f.close()
        return filedata, 200
    # except Exception as e:
    #     return f"{e}", 500


@modify.route('/ssh-editfile', methods=['POST'])
def ssh_editfile():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            f = sftp.open(content['filePath'], 'w')
            f.write(content['fileData'])
            f.close()
            sftp.close()
        elif server_type == "ftp":
            f = config.ftp_host[f"{socketID}"].open(content['filePath'], 'w')
            f.write(content['fileData'])
            f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


@modify.route('/ssh-properties', methods=['POST'])
def ssh_properties():
    socketID = request.args.get('socketID')
    content = request.get_json()
    try:
        server_type = content['server_type']
        sftp = paramiko.SFTPClient.from_transport(
            config.sftp_host[f"{socketID}"]) if server_type == "sftp" else None
        filestat = sftp.stat(content['sourceFile']) if server_type == "sftp" else config.ftp_host[f"{socketID}"].stat(
            content['sourceFile'])
        if sftp is not None:
            sftp.close()
        d = {'name': os.path.basename(content['sourceFile'])}
        d['size'] = filestat.st_size
        d['mode'] = oct(filestat.st_mode)
        d['uid'] = filestat.st_uid
        d['gid'] = filestat.st_gid
        d['mtime'] = filestat.st_mtime
        d['atime'] = filestat.st_atime
        return d, 200
    except Exception as e:
        return f"{e}", 500
