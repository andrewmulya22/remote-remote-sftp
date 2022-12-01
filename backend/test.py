import ftputil
import os
import functools
import paramiko

paramiko.util.log_to_file('./paramiko.log')
transport = paramiko.Transport(("169.254.43.228", 22))
transport.connect(username="pi", password="net%1528")

try:
    sftp = paramiko.SFTPClient.from_transport(transport)
    print("test")
    print(sftp.stat("/"))
    sftp.close()

    sftp2 = paramiko.SFTPClient.from_transport(transport)
    print(sftp2.stat('/'))
    sftp2.close()
except Exception as e:
    print(e)


# bytes = 0

# def callbackfunc(filesize, chunk):
#     global bytes
#     bytes = bytes + len(chunk)
#     print(f"{bytes/filesize*100}%")


# filesize = ftp_host.path.getsize(
#     "/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf")
# callback_download = functools.partial(callbackfunc, filesize)
# ftp_host.download("/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf",
#                   "/Users/andrewmulya/Downloads/sades.pdf", callback=callback_download)
