import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../atoms/apiServerState";
import {
  connectionTypeState,
  selectedSSHComponentState,
} from "../atoms/sshServerState";
import {
  copyQState,
  downloadQState,
  uploadQState,
} from "../atoms/uploadDownloadState";
import useApi from "./useApi";
import { URLState } from "../atoms/URLState";

export default function useUploadDownload() {
  const URL = useRecoilValue(URLState);
  //State management
  const selectedAPIFile = useRecoilValue(selectedComponentState);
  const selectedSSHFile = useRecoilValue(selectedSSHComponentState);
  const [uploadQ, setUploadQ] = useRecoilState(uploadQState);
  const [downloadQ, setDownloadQ] = useRecoilState(downloadQState);
  const [copyQ, setCopyQ] = useRecoilState(copyQState);
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
    let downloadSuccess = true;
    const downloadID = Math.floor(Math.random() * 100000);
    //controller
    const controller = new AbortController();
    //initialize download state
    setDownloadQ((prevState) => [
      ...prevState,
      {
        id: downloadID,
        name: "",
        progress: 0,
        errorCount: 0,
        controller: controller,
      },
    ]);
    axios
      .post(
        URL + "/sftpget",
        {
          downloadID,
          sourceFile: sourceFile === null ? selectedSSHFile : sourceFile,
          destFile: destFile === null ? selectedAPIFile : destFile,
          server_type: connectionType,
        },
        {
          signal: controller.signal,
        }
      )
      .then(() => {
        downloadDone = true;
      })
      .catch((err) => {
        downloadDone = true;
        downloadSuccess = false;
        if (err.response)
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        if (err.message === "canceled") {
          showNotification({
            title: "CANCELED",
            message: "Download canceled",
            color: "red",
            icon: <IconX />,
          });
          reloadFiles("api");
        }
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
          return new Promise((resolve, reject) => {
            if (response.status === 200) {
              const downloadingFile = Object.keys(response.data)[0];
              //update download queue
              setDownloadQ((prevState) =>
                prevState.map((state) => {
                  if (state.id === downloadID)
                    return {
                      ...state,
                      name: downloadingFile,
                      progress: parseInt(response.data[downloadingFile]),
                      errorCount: 0,
                    };
                  return state;
                })
              );
            }
            //count how many times error is returned
            else if (response.status === 204) {
              setDownloadQ((prevState) =>
                prevState.map((state) => {
                  if (state.id === downloadID) {
                    if (state.errorCount > 5)
                      reject({
                        response: {
                          status: 500,
                          data: "Internal Server Errror : Download failed",
                        },
                      });
                    return {
                      ...state,
                      errorCount: state.errorCount + 1,
                    };
                  }
                  return state;
                })
              );
            }
          });
        })
        .catch((err) => {
          downloadDone = true;
          downloadSuccess = false;
          if (err.response)
            showNotification({
              title: `Error ${err.response.status}`,
              message: err.response.data,
              color: "red",
              icon: <IconX />,
            });
        });
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
        if (downloadSuccess) reloadFiles("api");
      }
    }, 1000);
  };

  // UPLOAD FILE
  const uploadFile = (
    sourceFile: string | null = null,
    destFile: string | null = null
  ) => {
    if (!sourceFile && selectedSSHFile === "") return;
    let uploadDone = false;
    let uploadSuccess = true;
    const uploadID = Math.floor(Math.random() * 100000);
    //controller
    const controller = new AbortController();
    setUploadQ((prevState) => [
      ...prevState,
      {
        id: uploadID,
        name: "",
        progress: 0,
        errorCount: 0,
        controller: controller,
      },
    ]);
    axios
      .post(
        URL + "/sftpput",
        {
          uploadID,
          sourceFile: sourceFile === null ? selectedAPIFile : sourceFile,
          destFile: destFile === null ? selectedSSHFile : destFile,
          server_type: connectionType,
        },
        {
          signal: controller.signal,
        }
      )
      .then(() => {
        uploadDone = true;
      })
      .catch((err) => {
        uploadDone = true;
        uploadSuccess = false;
        if (err.response)
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        if (err.message === "canceled") {
          if (connectionType === "sftp")
            axios.get(URL + "/abortOperations", {
              params: {
                uploadID,
              },
            });
          showNotification({
            title: "CANCELED",
            message: "Upload canceled",
            color: "red",
            icon: <IconX />,
          });
          reloadFiles("ssh");
        }
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
          return new Promise((resolve, reject) => {
            if (response.status === 200) {
              const uploadingFile = Object.keys(response.data)[0];
              //update download queue
              setUploadQ((prevState) =>
                prevState.map((state) => {
                  if (state.id === uploadID)
                    return {
                      ...state,
                      name: uploadingFile,
                      progress: parseInt(response.data[uploadingFile]),
                      errorCount: 0,
                    };
                  return state;
                })
              );
            } else if (response.status === 204) {
              setUploadQ((prevState) =>
                prevState.map((state) => {
                  if (state.id === uploadID) {
                    if (state.errorCount > 5)
                      reject({
                        response: {
                          status: 500,
                          data: "Internal Server Errror : Upload failed",
                        },
                      });
                    return {
                      ...state,
                      errorCount: state.errorCount + 1,
                    };
                  }
                  return state;
                })
              );
            }
          });
        })
        .catch((err) => {
          uploadDone = true;
          uploadSuccess = false;
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        });
    };
    const progressInterval = setInterval(() => {
      getProgress();
      // if download has reached 100%
      if (uploadDone) {
        clearInterval(progressInterval);
        //remove from download queue
        setUploadQ((prevState) =>
          prevState.filter((state) => state.id !== uploadID)
        );
        if (uploadSuccess) {
          reloadFiles("ssh");
        }
      }
    }, 1000);
  };

  const abortTransfer = (type: "download" | "upload" | "copy", id: number) => {
    if (type === "download") {
      const downloadController = downloadQ.find(
        (controller) => controller.id === id
      );
      downloadController?.controller.abort();
    }
    if (type === "upload") {
      const uploadController = uploadQ.find(
        (controller) => controller.id === id
      );
      uploadController?.controller.abort();
    }
    if (type === "copy") {
      const copyController = copyQ.find((controller) => controller.id === id);
      copyController?.controller.abort();
    }
  };

  return { downloadFile, uploadFile, abortTransfer };
}
