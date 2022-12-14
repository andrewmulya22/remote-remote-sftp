# login and sftp var

import ftputil
import paramiko

login_state = False
ftp_host: ftputil.FTPHost = None
sftp_host: paramiko.SFTPClient = None

default_path_api = "/"
default_path_ssh = "/"


# FILE TRANSFER
copy_lists = []

getting_files = {}
putting_files = {}

getting_files_byte = {}
putting_files_byte = {}

download_sftps = {}
upload_sftps = {}
