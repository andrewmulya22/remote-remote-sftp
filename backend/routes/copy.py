from flask import Blueprint, request
import os
import stat
import shutil
import functools
import config

copy_file = Blueprint("copy_file", __name__)


def interruptable_copy(socketID, copyID, server, *args, **kwargs):
    if copyID not in config.copy_lists:
        raise Exception("Interrupting copy operation")
    if server == "api":
        return shutil.copy2(*args, **kwargs)
    else:
        return config.ftp_host[f"{socketID}"].copyfileobj(*args, **kwargs)


@copy_file.route('/api-copy', methods=['POST'])
def copy():
    socketID = request.args.get('socketID')
    content = request.get_json()
    sourceFile = content["sourceFile"]
    copyID = content["copyID"]
    config.copy_lists.append(copyID)
    destPath = content["destPath"] if os.path.isdir(
        content["destPath"]) else os.path.dirname(content["destPath"])
    try:
        if not os.path.isdir(sourceFile):
            interruptable_copy(socketID, copyID, "api", sourceFile, destPath)
            # shutil.copy2(sourceFile, destPath)
        else:
            callback_copy = functools.partial(
                interruptable_copy, socketID, copyID, "api")
            shutil.copytree(sourceFile, os.path.join(
                destPath, os.path.basename(sourceFile)), copy_function=callback_copy)
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return "OK"
    except Exception as e:
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return f"{e}", 500


@copy_file.route('/ssh-copy', methods=['POST'])
def ssh_copy():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    copyID = content["copyID"]
    config.copy_lists.append(copyID)
    if server_type != "ftp":
        return "Operation not supported", 500
    try:
        print(content['sourceFile'], content['destPath'])
        SSHCopyHandler(socketID, copyID,
                       content['sourceFile'], content['destPath'])
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return "OK"
    except Exception as e:
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return f"{e}", 500

# ftp only


def SSHCopyHandler(socketID, copyID, src, dst):
    dest_path = dst if config.ftp_host[f"{socketID}"].path.isdir(
        dst) else os.path.dirname(dst)
    if not config.ftp_host[f"{socketID}"].path.isdir(src):
        if os.path.dirname(src) == dst:
            raise Exception(f"{src} and {src} are the same file")
        with config.ftp_host[f"{socketID}"].open(src, "rb") as source:
            with config.ftp_host[f"{socketID}"].open(os.path.join(
                    dest_path, os.path.basename(src)), "wb") as target:
                # ftp_host.copyfileobj(source, target)
                interruptable_copy(socketID, copyID, "ssh", source, target)
    else:
        if src == dst:
            raise Exception(f"{src} and {dst} are the same file")
        # create folder
        newPath = os.path.join(dest_path, os.path.basename(src))
        if not config.ftp_host[f"{socketID}"].path.exists(newPath):
            config.ftp_host[f"{socketID}"].mkdir(newPath)
        # iterate through inside of src dir
        for x in config.ftp_host[f"{socketID}"].listdir(src):
            SSHCopyHandler(socketID, copyID, os.path.join(src, x), newPath)


@copy_file.route('/abort', methods=['POST'])
def abort_copy():
    # socketID = request.args.get('socketID')
    content = request.get_json()
    copyID = content['copyID']
    try:
        config.copy_lists.remove(copyID)
        return "OK", 200
    except Exception as e:
        return f"{e}", 500
