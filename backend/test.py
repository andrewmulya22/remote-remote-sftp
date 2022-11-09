import ftputil
import os
import functools

ftp_host = ftputil.FTPHost("169.254.43.228", "pi", "net%1528")

bytes = 0


def callbackfunc(filesize, chunk):
    global bytes
    bytes = bytes + len(chunk)
    print(f"{bytes/filesize*100}%")


filesize = ftp_host.path.getsize(
    "/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf")
callback_download = functools.partial(callbackfunc, filesize)
ftp_host.download("/home/pi/Downloads/BeginnersGuide-4thEd-Eng_v2.pdf",
                  "/Users/andrewmulya/Downloads/sades.pdf", callback=callback_download)
f = open("testfile", "w")
f.write(str(bytes))
f.close()
