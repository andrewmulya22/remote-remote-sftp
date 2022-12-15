# login and sftp var

import ftputil
import paramiko
from typing import Dict

login_state : dict[str, bool] = {}
ftp_host: dict[str, ftputil.FTPHost] = {}
sftp_host: dict[str, paramiko.SFTPClient] = {}
# ftp_host: ftputil.FTPHost = None
# sftp_host: paramiko.SFTPClient = None

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
