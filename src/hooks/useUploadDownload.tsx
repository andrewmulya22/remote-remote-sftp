import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { selectedComponentState } from "../atoms/apiServerState";
import {
  connectionTypeState,
  selectedSSHComponentState,
} from "../atoms/sshServerState";
import { downloadQState, uploadQState } from "../atoms/uploadDownloadState";
import useApi from "./useApi";
import { URLState } from "../atoms/URLState";

export default function useUploadDownload() {
  const URL = useRecoilValue(URLState);
  //State management
  const selectedAPIFile = useRecoilValue(selectedComponentState);
  const selectedSSHFile = useRecoilValue(selectedSSHComponentState);
  const setUploadQ = useSetRecoilState(uploadQState);
  const setDownloadQ = useSetRecoilState(downloadQState);
  const { reloadFiles } = useApi();
  //server type
  const connectionType = useRecoilValue(connectionTypeState);

  // DOWNLOAD FILE
  const downloadFile = (
    sourceFile: string | null = null,
    destFile: string | null = null
  ) => {
    if (!sourceFile && selectedAPIFile === "") return;
    let downloadDone = false;
    const downloadID = Math.floor(Math.random() * 100000);
    setDownloadQ((prevState) => [
      ...prevState,
      { id: downloadID, name: "", progress: 0 },
    ]);
    axios
      .post(URL + "/sftpget", {
        downloadID,
        sourceFile: sourceFile === null ? selectedSSHFile : sourceFile,
        destFile: destFile === null ? selectedAPIFile : destFile,
        server_type: connectionType,
      })
      .then(() => {
        downloadDone = true;
      })
      .catch((err) => {
        downloadDone = true;
        showNotification({
          title: `Error ${err.response.status}`,
          message: err.response.data,
          color: "red",
          icon: <IconX />,
        });
      });
    const getProgress = () => {
      axios
        .get(URL + "/sftpget", {
          params: {
            downloadID,
            server_type: connectionType,
          },
        })
        // add to download queue
        .then((response) => {
          // if(response.status === 200){
          const downloadingFile = Object.keys(response.data)[0];
          //update download queue
          setDownloadQ((prevState) =>
            prevState.map((state) => {
              if (state.id === downloadID)
                return {
                  ...state,
                  name: downloadingFile,
                  progress: parseInt(response.data[downloadingFile]),
                };
              return state;
            })
          );
          // }
        })
        .catch((err) =>
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          })
        );
    };
    const progressInterval = setInterval(() => {
      getProgress();
      // if download has reached 100%
      if (downloadDone) {
        clearInterval(progressInterval);
        // clear download array
        axios.delete(URL + "/sftpget", {
          params: {
            downloadID,
            server_type: connectionType,
          },
        });
        //remove from download queue
        setDownloadQ((prevState) =>
          prevState.filter((state) => state.id !== downloadID)
        );
        reloadFiles("api");
      }
    }, 500);
  };

  // UPLOAD FILE
  const uploadFile = (
    sourceFile: string | null = null,
    destFile: string | null = null
  ) => {
    if (!sourceFile && selectedSSHFile === "") return;
    let uploadDone = false;
    const uploadID = Math.floor(Math.random() * 100000);
    setUploadQ((prevState) => [
      ...prevState,
      { id: uploadID, name: "", progress: 0 },
    ]);
    axios
      .post(URL + "/sftpput", {
        uploadID,
        sourceFile: sourceFile === null ? selectedAPIFile : sourceFile,
        destFile: destFile === null ? selectedSSHFile : destFile,
        server_type: connectionType,
      })
      .then(() => {
        uploadDone = true;
      })
      .catch((err) => {
        uploadDone = true;
        showNotification({
          title: `Error ${err.response.status}`,
          message: err.response.data,
          color: "red",
          icon: <IconX />,
        });
      });
    const getProgress = () => {
      axios
        .get(URL + "/sftpput", {
          params: {
            uploadID,
            server_type: connectionType,
          },
        })
        // add to download queue
        .then((response) => {
          const uploadingFile = Object.keys(response.data)[0];
          //update download queue
          setUploadQ((prevState) =>
            prevState.map((state) => {
              if (state.id === uploadID)
                return {
                  ...state,
                  name: uploadingFile,
                  progress: parseInt(response.data[uploadingFile]),
                };
              return state;
            })
          );
        })
        .catch((err) =>
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          })
        );
    };
    const progressInterval = setInterval(() => {
      getProgress();
      // if download has reached 100%
      if (uploadDone) {
        clearInterval(progressInterval);
        // clear download array
        axios.delete(URL + "/sftpput", {
          params: {
            uploadID,
            server_type: connectionType,
          },
        });
        //remove from download queue
        setUploadQ((prevState) =>
          prevState.filter((state) => state.id !== uploadID)
        );
        reloadFiles("ssh");
      }
    }, 500);
  };
  return { downloadFile, uploadFile };
}
