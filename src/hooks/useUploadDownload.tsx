import axios from "axios";
import React from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../atoms/apiServerState";
import { selectedSSHComponentState } from "../atoms/sshServerState";
import { downloadQState, uploadQState } from "../atoms/uploadDownloadState";

export default function useUploadDownload() {
  //State management
  const selectedAPIFile = useRecoilValue(selectedComponentState);
  const selectedSSHFile = useRecoilValue(selectedSSHComponentState);
  const uploadQ = useRecoilState(uploadQState);
  const downloadQ = useRecoilState(downloadQState);

  const downloadFile = () => {
    if (selectedAPIFile === "") return;
    let downloadDone = false;
    const downloadID = Math.floor(Math.random() * 100000);
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/sftpget", {
        downloadID,
        sourceFile: selectedSSHFile,
        destFile: selectedAPIFile,
      })
      .then(() => {
        downloadDone = true;
        console.log("test");
      });
    const getProgress = () => {
      axios
        .get(process.env.REACT_APP_SERVER_URL + "/sftpget", {
          params: {
            downloadID,
          },
        })
        .then((response) => console.log(response.data))
        .catch((err) => console.log(err));
    };
    const progressInterval = setInterval(() => {
      getProgress();
      // if download has reached 100%
      if (downloadDone) {
        clearInterval(progressInterval);
        // clear download array
        axios.delete(process.env.REACT_APP_SERVER_URL + "/sftpget", {
          params: {
            downloadID,
          },
        });
      }
    }, 500);
  };

  const uploadFile = () => {};
  return { downloadFile, uploadFile };
}
