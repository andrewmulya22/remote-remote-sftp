from flask import Flask, request
from flask_cors import CORS
import os
import json
import paramiko
import ftputil
import stat
import functools
import shutil
import mimetypes
from pathlib import Path
app = Flask(__name__)
CORS(app)

# paramiko.util.log_to_file('./paramiko.log')
login_state = False
ftp_host: ftputil.FTPHost = None
sftp_host: paramiko.SFTPClient = None

default_path_api = '/'
default_path_ssh = '/'

# WRAPPER


# class Interrupt(Exception):
#     """ interrupts the copy operation """


def login_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        if login_state:
            return f(*args, **kwargs)
        return "Error", 404
    return wrapper


# LOGIN ROUTE

@app.route('/api_login', methods=['POST'])
def api_login():
    global login_state
    content = request.get_json()
    if content['host']:
        login_state = True
    return "OK", 200


@app.route('/ssh_login', methods=['POST'])
# @login_required
def ssh_login():
    global ftp_host, sftp_host
    try:
        sftp_host.close() or ftp_host.close()
    except:
        pass
    content = request.get_json()
    server_type = content['server_type']
    host = content['host']
    username = content['username']
    password = content['password']
    if content['port'] == '' or content['port'] == None:
        portNum = 22 if server_type == "sftp" else 21
    if server_type == "sftp":
        try:
            sftp_host = paramiko.Transport((host, portNum))
            # rsa_key = paramiko.RSAKey.from_private_key_file(PRIVATEKEY)
            sftp_host.connect(username=username, password=password)
            # sftp_host.connect(username=username, password=password, pkey=rsa_key)
            return "OK"
        except Exception as e:
            return f"{e}", 500
    elif server_type == "ftp":
        try:
            ftp_host = ftputil.FTPHost(host, username, password, session_factory=ftputil.session.session_factory(
                encoding="UTF-8", port=portNum))
            ftp_host.use_list_a_option = True
            ftp_host.keep_alive()
            return "OK"
        except Exception as e:
            return f"{e}", 500

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


def path_to_dict_ftp(path):
    global ftp_host
    if(path == "/" or path == ""):
        d = {'name': "/"}
    else:
        d = {'name': os.path.basename(path)}
    d['path'] = os.path.abspath(path)
    # file data
    try:
        d['modified'] = ftp_host.path.getmtime(path)
    except:
        d['modified'] = None
    if ftp_host.path.isdir(path):
        d['type'] = "folder"
        d['size'] = 0
        d['children'] = []
        d['mimetype'] = None
    else:
        d['type'] = "file"
        d['mimetype'] = mimetypes.guess_type(path)
        try:
            d['size'] = ftp_host.path.getsize(path)
        except:
            d['size'] = 0
    return d


# FETCH CHILDREN DATA #


@app.route('/api/children', methods=['POST'])
def api_children():
    content = request.get_json()
    children = []
    try:
        for x in os.listdir(content['path']):
            try:
                children.append(path_to_dict(os.path.join(content['path'], x)))
            except:
                continue
        response = app.response_class(
            response=json.dumps(children),
            mimetype='application/json'
        )
        return response
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/children', methods=['POST'])
def ssh_children():
    global sftp_host, ftp_host
    content = request.get_json()
    server_type = content['server_type']
    children = []
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            for x in sftp.listdir(content['path']):
                try:
                    children.append(path_to_dict_ssh(
                        os.path.join(content['path'], x), sftp))
                except Exception as e:
                    continue
            sftp.close()
        elif server_type == "ftp":
            for x in ftp_host.listdir(content['path']):
                try:
                    children.append(path_to_dict_ftp(
                        os.path.join(content['path'], x)))
                except Exception as e:
                    continue
        response = app.response_class(
            response=json.dumps(children),
            mimetype='application/json'
        )
        return response
    except Exception as e:
        return f"{e}", 500


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
        return f"{e}", 500


@app.route('/api/newfolder', methods=['POST'])
def newfolder():
    content = request.get_json()
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        os.mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


@app.route('/api/rename', methods=['POST'])
def rename():
    content = request.get_json()
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(sourceFile), content["fileName"])
    try:
        os.rename(sourceFile, fileName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


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
        return f"{e}", 500

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
        return f"{e}", 500


@app.route('/api/editfile', methods=['POST'])
def editfile():
    content = request.get_json()
    try:
        f = open(content['filePath'], 'w')
        f.write(content['fileData'])
        f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


@app.route('/api/properties', methods=['POST'])
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


@app.route('/api/changeMod', methods=['POST'])
def changePerm():
    content = request.get_json()
    try:
        Path(content['path']).chmod(int(content['newMod'], 8))
        return "OK"
    except Exception as e:
        return f"{e}", 500


##### SSH ROUTES #####


@app.route('/ssh', methods=['GET'])
def ssh():
    global sftp_host
    server_type = request.args.get('server_type')
    data = []
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            data = [path_to_dict_ssh(default_path_ssh, sftp)]
            sftp.close()
        elif server_type == "ftp":
            try:
                data = [path_to_dict_ftp("/")]
            except:
                data = [path_to_dict_ftp("/home/")]
        response = app.response_class(
            response=json.dumps(data),
            mimetype='application/json'
        )
        return response
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/delete', methods=['POST'])
def ssh_delete():
    global sftp_host
    content = request.get_json()
    try:
        sftp = paramiko.SFTPClient.from_transport(
            sftp_host) if content['server_type'] == "sftp" else None
        deleteHandler(content['files'], content['server_type'], sftp)
        if sftp is not None:
            sftp.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


def deleteHandler(path, server_type, sftp):
    global ftp_host
    if server_type == "sftp":
        dir_check = stat.S_ISDIR(sftp.stat(path).st_mode)
        if dir_check:
            for x in sftp.listdir(path):
                deleteHandler(os.path.join(path, x), server_type, sftp)
            sftp.rmdir(path)
        else:
            sftp.remove(path)
    elif server_type == "ftp":
        dir_check = ftp_host.path.isdir(path)
        if dir_check:
            for x in ftp_host.listdir(path):
                deleteHandler(os.path.join(path, x), server_type, sftp)
            ftp_host.rmdir(path)
        else:
            ftp_host.remove(path)


@app.route('/ssh/newfolder', methods=['POST'])
def ssh_newfolder():
    global sftp_host, ftp_host
    content = request.get_json()
    server_type = content['server_type']
    folderName = os.path.join(content["path"], content["folderName"])
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            sftp.mkdir(folderName)
            sftp.close()
        elif server_type == "ftp":
            ftp_host.mkdir(folderName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/rename', methods=['POST'])
def ssh_rename():
    global sftp_host
    content = request.get_json()
    server_type = content['server_type']
    sourceFile = content["sourceFile"]
    fileName = os.path.join(os.path.dirname(
        content["sourceFile"]), content["fileName"])
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            sftp.rename(sourceFile, fileName)
            sftp.close()
        elif server_type == "ftp":
            ftp_host.rename(sourceFile, fileName)
        return "OK"
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/move', methods=['POST'])
def ssh_move():
    global sftp_host, ftp_host
    content = request.get_json()
    server_type = content['server_type']
    sourceFile = content["sourceFile"]
    destPath = content["destPath"]
    fileName = os.path.basename(sourceFile)
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            sftp.rename(sourceFile, os.path.join(destPath, fileName))
            sftp.close()
        elif server_type == "ftp":
            ftp_host.rename(sourceFile, os.path.join(destPath, fileName))
        return "OK"
    except Exception as e:
        return f"{e}", 500

# file view/write


@app.route('/ssh/filedata', methods=['POST'])
def ssh_filedata():
    global ftp_host, sftp_host
    content = request.get_json()
    server_type = content['server_type']
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            f = sftp.open(content['filePath'], 'r')
            filedata = f.read()
            f.close()
            sftp.close()
            return filedata, 200
        elif server_type == "ftp":
            f = ftp_host.open(content['filePath'], 'r')
            filedata = f.read()
            f.close()
            return filedata, 200
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/editfile', methods=['POST'])
def ssh_editfile():
    global ftp_host, sftp_host
    content = request.get_json()
    server_type = content['server_type']
    try:
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
            f = sftp.open(content['filePath'], 'w')
            f.write(content['fileData'])
            f.close()
            sftp.close()
        elif server_type == "ftp":
            f = ftp_host.open(content['filePath'], 'w')
            f.write(content['fileData'])
            f.close()
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


@app.route('/ssh/properties', methods=['POST'])
def ssh_properties():
    global sftp_host, ftp_host
    content = request.get_json()
    try:
        server_type = content['server_type']
        sftp = paramiko.SFTPClient.from_transport(
            sftp_host) if server_type == "sftp" else None
        filestat = sftp.stat(content['sourceFile']) if server_type == "sftp" else ftp_host.stat(
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


# copy handler

copy_lists = []


def interruptable_copy(copyID, server, *args, **kwargs):
    global ftp_host
    if copyID not in copy_lists:
        raise Exception("Interrupting copy operation")
    if server == "api":
        return shutil.copy2(*args, **kwargs)
    else:
        return ftp_host.copyfileobj(*args, **kwargs)


@app.route('/api/copy', methods=['POST'])
def copy():
    global copy_lists
    content = request.get_json()
    sourceFile = content["sourceFile"]
    copyID = content["copyID"]
    copy_lists.append(copyID)
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
        if copyID in copy_lists:
            copy_lists.remove(copyID)
        return "OK"
    except Exception as e:
        if copyID in copy_lists:
            copy_lists.remove(copyID)
        return f"{e}", 500


@app.route('/ssh/copy', methods=['POST'])
def ssh_copy():
    global copy_lists
    content = request.get_json()
    server_type = content['server_type']
    copyID = content["copyID"]
    copy_lists.append(copyID)
    if server_type != "ftp":
        return "Operation not supported", 500
    try:
        SSHCopyHandler(copyID, content['sourceFile'], content['destPath'])
        if copyID in copy_lists:
            copy_lists.remove(copyID)
        return "OK"
    except Exception as e:
        if copyID in copy_lists:
            copy_lists.remove(copyID)
        return f"{e}", 500


def SSHCopyHandler(copyID, src, dst):
    global sftp_host, copy_lists
    # if copyID not in copy_lists:
    #     raise Exception("canceled")
    dest_path = dst if ftp_host.path.isdir(dst) else os.path.dirname(dst)
    if not ftp_host.path.isdir(src):
        with ftp_host.open(src, "rb") as source:
            with ftp_host.open(os.path.join(
                    dest_path, os.path.basename(src)), "wb") as target:
                # ftp_host.copyfileobj(source, target)
                interruptable_copy(copyID, "ssh", source, target)
    else:
        # create folder
        newPath = os.path.join(dest_path, os.path.basename(src))
        if not ftp_host.path.exists(newPath):
            ftp_host.mkdir(newPath)
        # iterate through inside of src dir
        for x in ftp_host.listdir(src):
            SSHCopyHandler(copyID, os.path.join(src, x), newPath)


@app.route('/abortcopy', methods=['POST'])
def abort_copy():
    global copy_lists
    content = request.get_json()
    copyID = content['copyID']
    try:
        copy_lists.remove(copyID)
        return "OK", 200
    except Exception as e:
        return f"{e}", 500


# FILE TRANSFER
getting_files = {}
putting_files = {}

getting_files_byte = {}
putting_files_byte = {}

upload_sftps = {}


def byte_transferred(type, transferID, filename, xfer, to_be_xfer):
    global getting_files, putting_files
    if type == "download":
        getting_files[f"{transferID}"] = {}
        getting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"
    else:
        putting_files[f"{transferID}"] = {}
        putting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"


def byte_transferred_ftp(type, transferID, filename, to_be_xfer, bytes):
    global getting_files, putting_files, getting_files_byte
    if type == "download":
        getting_files[f"{transferID}"] = {}
        getting_files_byte[f"{transferID}"][filename] = getting_files_byte[f"{transferID}"][filename] + len(
            bytes)
        xfer = getting_files_byte[f"{transferID}"][filename]
        getting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"
    else:
        putting_files[f"{transferID}"] = {}
        putting_files_byte[f"{transferID}"][filename] = putting_files_byte[f"{transferID}"][filename] + len(
            bytes)
        xfer = putting_files_byte[f"{transferID}"][filename]
        putting_files[f"{transferID}"][filename] = f"{xfer/to_be_xfer*100}%"


@app.route('/sftpget', methods=['GET', 'DELETE', 'POST'])
def sftpget():
    global getting_files, getting_files_byte, sftp_host
    if request.method == "GET":
        downloadID = request.args.get('downloadID')
        try:
            return getting_files[f"{downloadID}"]
        except Exception as e:
            return f"{e}", 204
    elif request.method == "DELETE":
        downloadID = request.args.get('downloadID')
        try:
            if getting_files[f"{downloadID}"]:
                getting_files.pop(f"{downloadID}")
            if request.args.get('server_type') == "ftp" and getting_files_byte[f"{downloadID}"]:
                getting_files_byte.pop(f"{downloadID}")
            return "OK"
        except Exception as e:
            return f"{e}", 500
    elif request.method == "POST":
        content = request.get_json()
        # destination folder
        destination_folder = os.path.dirname(content['destFile']) if not os.path.isdir(
            content['destFile']) else content['destFile']
        try:
            sftp = paramiko.SFTPClient.from_transport(
                sftp_host) if content['server_type'] == "sftp" else None
            if content['server_type'] == "ftp":
                getting_files_byte[f"{content['downloadID']}"] = {}
            downloadHandler(content['sourceFile'],
                            destination_folder, content['downloadID'], content['server_type'], sftp)
            if sftp is not None:
                sftp.close()
            return "OK", 200
        except Exception as e:
            return f"{e}", 500


def downloadHandler(src, dest, downloadID, server_type, sftp):
    global ftp_host, getting_files_byte
    filename = os.path.basename(src)
    dir_check = stat.S_ISDIR(
        sftp.stat(src).st_mode) if server_type == "sftp" else ftp_host.path.isdir(src)
    # if a directory
    if dir_check:
        # create dir in api server
        newfolder = os.path.join(dest, filename)
        if not os.path.exists(newfolder):
            os.mkdir(newfolder)
        for x in (sftp.listdir(src) if server_type == "sftp" else ftp_host.listdir(src)):
            downloadHandler(os.path.join(src, x), newfolder,
                            downloadID, server_type, sftp)
    # if not a directory
    else:
        if server_type == "sftp":
            callback_downloadID = functools.partial(
                byte_transferred, "download", downloadID, filename)
            sftp.get(src, os.path.join(
                dest, filename), callback_downloadID)
        else:
            getting_files_byte[f"{downloadID}"][filename] = 0
            callback_downloadID = functools.partial(
                byte_transferred_ftp, "download", downloadID, filename, ftp_host.path.getsize(src))
            ftp_host.download(src, os.path.join(
                dest, filename), callback_downloadID)


@app.route('/sftpput', methods=['GET', 'DELETE', 'POST'])
def sftpput():
    global putting_files, sftp_host, ftp_host, putting_files_byte
    if request.method == "GET":
        uploadID = request.args.get('uploadID')
        try:
            return putting_files[f"{uploadID}"]
        except Exception as e:
            return f"{e}", 204
    elif request.method == "DELETE":
        uploadID = request.args.get('uploadID')
        try:
            if putting_files[f"{uploadID}"]:
                putting_files.pop(f"{uploadID}")
            if request.args.get('server_type') == "ftp" and putting_files_byte[f"{uploadID}"]:
                putting_files_byte.pop(f"{uploadID}")
            return "OK"
        except Exception as e:
            return f"{e}", 500
    elif request.method == "POST":
        content = request.get_json()
        server_type = content['server_type']
        destination_folder = None
        if server_type == "sftp":
            sftp = paramiko.SFTPClient.from_transport(sftp_host)
        if server_type == "sftp":
            try:
                fileState = sftp.stat(content['destFile'])
                upload_sftps[f"{content['uploadID']}"] = sftp
            except:
                fileState = None
            # if not a directory
            if fileState is None or not stat.S_ISDIR(fileState.st_mode):
                destination_folder = os.path.dirname(content['destFile'])
            else:
                destination_folder = content['destFile']
        elif server_type == "ftp":
            destination_folder = os.path.dirname(content['destFile']) if not ftp_host.path.isdir(
                content['destFile']) else content['destFile']
        try:
            putting_files_byte[f"{content['uploadID']}"] = {}
            uploadHandler(content['sourceFile'],
                          destination_folder, content['uploadID'], server_type, sftp)
            if server_type == "sftp":
                sftp.close()
            return "OK", 200
        except Exception as e:
            return f"{e}", 500


def uploadHandler(src, dest, uploadID, server_type, sftp):
    global ftp_host, putting_files_byte
    filename = os.path.basename(src)
    # if a directory
    if os.path.isdir(src):
        # create dir in ssh server
        newfolder = os.path.join(dest, filename)
        sftp.mkdir(newfolder) if server_type == "sftp" else ftp_host.mkdir(
            newfolder)
        for x in os.listdir(src):
            # try:
            uploadHandler(os.path.join(src, x), newfolder,
                          uploadID, server_type, sftp)
    # if not a directory
    else:
        if server_type == "sftp":
            callback_uploadID = functools.partial(
                byte_transferred, "upload", uploadID, filename)
            sftp.put(src, os.path.join(
                dest, filename), callback_uploadID)
        else:
            putting_files_byte[f"{uploadID}"][filename] = 0
            callback_uploadID = functools.partial(
                byte_transferred_ftp, "upload", uploadID, filename, os.path.getsize(src))
            ftp_host.upload(src, os.path.join(
                dest, filename), callback_uploadID)


@app.route('/abortOperations', methods=['GET', 'POST'])
def abortOperations():
    global upload_sftps
    uploadID = request.args.get('uploadID')
    upload_sftps[f"{uploadID}"].close()
    return "OK", 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', threaded=True)
