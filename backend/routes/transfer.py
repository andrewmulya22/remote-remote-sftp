from flask import Blueprint, request
import os
import stat
import paramiko
import functools
import config

transfer = Blueprint("transfer", __name__)


def byte_transferred(type, transferID, filename, xfer, to_be_xfer):
    if type == "download":
        config.getting_files[f"{transferID}"] = {}
        config.getting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"
    else:
        config.putting_files[f"{transferID}"] = {}
        config.putting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"


def byte_transferred_ftp(type, transferID, filename, to_be_xfer, bytes):
    if type == "download":
        config.getting_files[f"{transferID}"] = {}
        config.getting_files_byte[f"{transferID}"][filename] = config.getting_files_byte[f"{transferID}"][filename] + len(
            bytes)
        xfer = config.getting_files_byte[f"{transferID}"][filename]
        config.getting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"
    else:
        config.putting_files[f"{transferID}"] = {}
        config.putting_files_byte[f"{transferID}"][filename] = config.putting_files_byte[f"{transferID}"][filename] + len(
            bytes)
        xfer = config.putting_files_byte[f"{transferID}"][filename]
        config.putting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"


def delete_progress(type, transferID, server_type):
    if type == "download":
        if f"{transferID}" in config.getting_files:
            config.getting_files.pop(f"{transferID}")
        if server_type == "ftp" and f"{transferID}" in config.getting_files_byte:
            config.getting_files_byte.pop(f"{transferID}")
    elif type == "upload":
        if f"{transferID}" in config.putting_files:
            config.putting_files.pop(f"{transferID}")
        if server_type == "ftp" and f"{transferID}" in config.putting_files_byte:
            config.putting_files_byte.pop(f"{transferID}")


def downloadHandler(src, dest, downloadID, server_type, sftp, socketID):
    filename = os.path.basename(src)
    dir_check = stat.S_ISDIR(
        sftp.stat(src).st_mode) if server_type == "sftp" else config.ftp_host[f"{socketID}"].path.isdir(src)
    # if a directory
    if dir_check:
        # create dir in api server
        newfolder = os.path.join(dest, filename)
        if not os.path.exists(newfolder):
            os.mkdir(newfolder)
        for x in (sftp.listdir(src) if server_type == "sftp" else config.ftp_host[f"{socketID}"].listdir(src)):
            downloadHandler(os.path.join(src, x), newfolder,
                            downloadID, server_type, sftp, socketID)
    # if not a directory
    else:
        if server_type == "sftp":
            callback_downloadID = functools.partial(
                byte_transferred, "download", downloadID, filename)
            sftp.get(src, os.path.join(
                dest, filename), callback_downloadID)
        else:
            config.getting_files_byte[f"{downloadID}"][filename] = 0
            callback_downloadID = functools.partial(
                byte_transferred_ftp, "download", downloadID, filename, config.ftp_host[f"{socketID}"].path.getsize(src))
            config.ftp_host[f"{socketID}"].download(src, os.path.join(
                dest, filename), callback_downloadID)


def uploadHandler(src, dest, uploadID, server_type, sftp, socketID):
    filename = os.path.basename(src)
    # if a directory
    if os.path.isdir(src):
        # create dir in ssh server
        newfolder = os.path.join(dest, filename)
        sftp.mkdir(newfolder) if server_type == "sftp" else config.ftp_host[f"{socketID}"].mkdir(
            newfolder)
        for x in os.listdir(src):
            # try:
            uploadHandler(os.path.join(src, x), newfolder,
                          uploadID, server_type, sftp, socketID)
    # if not a directory
    else:
        if server_type == "sftp":
            callback_uploadID = functools.partial(
                byte_transferred, "upload", uploadID, filename)
            sftp.put(src, os.path.join(
                dest, filename), callback_uploadID)
        else:
            config.putting_files_byte[f"{uploadID}"][filename] = 0
            callback_uploadID = functools.partial(
                byte_transferred_ftp, "upload", uploadID, filename, os.path.getsize(src))
            config.ftp_host[f"{socketID}"].upload(src, os.path.join(
                dest, filename), callback_uploadID)


@transfer.route('/download', methods=['POST'])
def sftpget():
    socketID = request.args.get('socketID')
    content = request.get_json()
    # destination folder
    destination_folder = os.path.dirname(content['destFile']) if not os.path.isdir(
        content['destFile']) else content['destFile']
    # return "OK"
    try:
        sftp: paramiko.SFTPClient = None
        if content['server_type'] == "sftp":
            sftp = paramiko.SFTPClient.from_transport(
                config.sftp_host[f"{socketID}"])
            config.download_sftps[f"{content['downloadID']}"] = sftp
        if content['server_type'] == "ftp":
            config.getting_files_byte[f"{content['downloadID']}"] = {}
        for src in content['sourceFile']:
            downloadHandler(src,
                            destination_folder, content['downloadID'], content['server_type'], sftp, socketID)
        if sftp is not None:
            sftp.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


@transfer.route('/upload', methods=['POST'])
def sftpput():
    socketID = request.args.get('socketID')
    content = request.get_json()
    server_type = content['server_type']
    destination_folder = None
    sftp: paramiko.SFTPClient = None
    if server_type == "sftp":
        sftp = paramiko.SFTPClient.from_transport(
            config.sftp_host[f"{socketID}"])
        config.upload_sftps[f"{content['uploadID']}"] = sftp
        try:
            fileState = sftp.stat(content['destFile'])
        except:
            fileState = None
        # if not a directory
        if fileState is None or not stat.S_ISDIR(fileState.st_mode):
            destination_folder = os.path.dirname(content['destFile'])
        else:
            destination_folder = content['destFile']
    elif server_type == "ftp":
        destination_folder = os.path.dirname(content['destFile']) if not config.ftp_host[f"{socketID}"].path.isdir(
            content['destFile']) else content['destFile']
    try:
        config.putting_files_byte[f"{content['uploadID']}"] = {}
        for src in content['sourceFile']:
            uploadHandler(src,
                          destination_folder, content['uploadID'], server_type, sftp, socketID)
        if server_type == "sftp":
            sftp.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500
