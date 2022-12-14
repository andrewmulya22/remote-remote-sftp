from flask import Blueprint, request
import os
import stat
import shutil
import functools
import config

copy_file = Blueprint("copy_file", __name__)


def interruptable_copy(copyID, server, *args, **kwargs):
    if copyID not in config.copy_lists:
        raise Exception("Interrupting copy operation")
    if server == "api":
        return shutil.copy2(*args, **kwargs)
    else:
        return config.ftp_host.copyfileobj(*args, **kwargs)


@copy_file.route('/api-copy', methods=['POST'])
def copy():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    copyID = content["copyID"]
    config.copy_lists.append(copyID)
    destPath = content["destPath"] if os.path.isdir(
        content["destPath"]) else os.path.dirname(content["destPath"])
    try:
        if not os.path.isdir(sourceFile):
            interruptable_copy(copyID, "api", sourceFile, destPath)
            # shutil.copy2(sourceFile, destPath)
        else:
            callback_copy = functools.partial(
                interruptable_copy, copyID, "api")
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
    content = request.get_json()
    server_type = content['server_type']
    copyID = content["copyID"]
    config.copy_lists.append(copyID)
    if server_type != "ftp":
        return "Operation not supported", 500
    try:
        SSHCopyHandler(copyID, content['sourceFile'], content['destPath'])
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return "OK"
    except Exception as e:
        if copyID in config.copy_lists:
            config.copy_lists.remove(copyID)
        return f"{e}", 500


def SSHCopyHandler(copyID, src, dst):
    dest_path = dst if config.ftp_host.path.isdir(
        dst) else os.path.dirname(dst)
    if not config.ftp_host.path.isdir(src):
        with config.ftp_host.open(src, "rb") as source:
            with config.ftp_host.open(os.path.join(
                    dest_path, os.path.basename(src)), "wb") as target:
                # ftp_host.copyfileobj(source, target)
                interruptable_copy(copyID, "ssh", source, target)
    else:
        # create folder
        newPath = os.path.join(dest_path, os.path.basename(src))
        if not config.ftp_host.path.exists(newPath):
            config.ftp_host.mkdir(newPath)
        # iterate through inside of src dir
        for x in config.ftp_host.listdir(src):
            SSHCopyHandler(copyID, os.path.join(src, x), newPath)


@copy_file.route('/abort', methods=['POST'])
def abort_copy():
    content = request.get_json()
    copyID = content['copyID']
    try:
        config.copy_lists.remove(copyID)
        return "OK", 200
    except Exception as e:
        return f"{e}", 500
