import ftputil
import os
import functools
my_session_factory = ftputil.session.session_factory(
    encoding="UTF-8")
ftp_host = ftputil.FTPHost("169.254.43.228", "pi",
                           "net%1528", session_factory=my_session_factory)

bytes = 0

print(ftp_host.listdir("/home/pi/Downloads/"))


def callbackfunc(filesize, chunk):
    global bytes
    bytes = bytes + len(chunk)
    print(f"{bytes/filesize*100}%")


# filesize = ftp_host.path.getsize(
#     "/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf")
# callback_download = functools.partial(callbackfunc, filesize)
# ftp_host.download("/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf",
#                   "/Users/andrewmulya/Downloads/sades.pdf", callback=callback_download)
