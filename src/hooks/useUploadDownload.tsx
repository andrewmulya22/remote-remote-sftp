import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  selectedComponentState,
  selectedFolderState,
} from "../atoms/apiServerState";
import {
  connectionTypeState,
  selectedSSHComponentState,
  selectedSSHFolderState,
} from "../atoms/sshServerState";
import {
  copyQState,
  downloadQState,
  uploadQState,
} from "../atoms/uploadDownloadState";
import useApi from "./useApi";
import { URLState } from "../atoms/URLState";
import { useContext, useEffect } from "react";
import { SocketContext } from "../context/Socket";

export default function useUploadDownload() {
  const URL = useRecoilValue(URLState);
  //State management
  const selectedAPIFile = useRecoilValue(selectedComponentState);
  const selectedSSHFile = useRecoilValue(selectedSSHComponentState);
  //folder state
  const selectedFolder = useRecoilValue(selectedFolderState);
  const selectedSSHFolder = useRecoilValue(selectedSSHFolderState);
  const [uploadQ, setUploadQ] = useRecoilState(uploadQState);
  const [downloadQ, setDownloadQ] = useRecoilState(downloadQState);
  const copyQ = useRecoilValue(copyQState);
  const { reloadFiles } = useApi();
  //server type
  const connectionType = useRecoilValue(connectionTypeState);

  //socket
  const socket = useContext(SocketContext);
  useEffect(() => {
    if (socket) {
      //get download progress
      socket.on("downloadProgressUpdate", (data) => {
        const downloadID = data.downloadID;
        const downloadingFile = Object.keys(data.files)[0];
        const name = downloadingFile;
        const progress = data.files[`${downloadingFile}`];
        setDownloadQ((prevState) =>
          prevState.map((state) => {
            if (state.id === downloadID)
              return {
                ...state,
                name: name,
                progress: parseInt(progress),
                errorCount: 0,
              };
            return state;
          })
        );
      });

      //get upload progrss
      socket.on("uploadProgressUpdate", (data) => {
        const uploadID = data.uploadID;
        const uploadingFile = Object.keys(data.files)[0];
        const name = uploadingFile;
        const progress = data.files[`${uploadingFile}`];
        setUploadQ((prevState) =>
          prevState.map((state) => {
            if (state.id === uploadID)
              return {
                ...state,
                name: name,
                progress: parseInt(progress),
                errorCount: 0,
              };
            return state;
          })
        );
      });
    }
  }, [socket, setDownloadQ, setUploadQ]);

  // DOWNLOAD FILE
  const downloadFile = async (destFile: string | null = null) => {
    if (selectedSSHFile.length) {
      const dst = destFile === null ? selectedFolder : destFile;
      let promises: Promise<string>[] = [];
      for (const file of selectedSSHFile) {
        const promise: Promise<string> = new Promise((resolve) => {
          downloadHandler(file, dst).then(() => {
            resolve("OK");
          });
        });
        promises = [...promises, promise];
      }
      Promise.all(promises).then(() => {
        reloadFiles("api");
      });
    }
  };

  const downloadHandler = async (src: string, dst: string) => {
    let downloadDone = false;
    const downloadID = `${socket!.id}-${Math.floor(
      Math.random() * 100000
    ).toString()}`;
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
    socket?.emit("transferProgress", {
      type: "download",
      transferID: downloadID,
    });
    const progressInterval = setInterval(() => {
      // if download has reached 100%
      if (downloadDone) {
        clearInterval(progressInterval);
        socket?.emit("deleteProgress", {
          type: "download",
          transferID: downloadID,
          server_type: connectionType,
        });
        //remove from download queue
        setDownloadQ((prevState) =>
          prevState.filter((state) => state.id !== downloadID)
        );
      }
    }, 1000);
    await axios
      .post(
        URL + "/transfer/download",
        {
          downloadID,
          sourceFile: src,
          destFile: dst,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
          signal: controller.signal,
        }
      )
      .then(() => {
        downloadDone = true;
      })
      .catch((err) => {
        downloadDone = true;
        if (err.response)
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        else {
          if (connectionType === "sftp")
            socket?.emit("abortOperations", {
              type: "download",
              transferID: downloadID,
            });
          showNotification({
            title: "CANCELED",
            message: "Download canceled",
            color: "red",
            icon: <IconX />,
          });
        }
      });
    return;
  };

  // UPLOAD FILE
  const uploadFile = async (destFile: string | null = null) => {
    if (selectedAPIFile.length) {
      const dst = destFile === null ? selectedSSHFolder : destFile;
      let promises: Promise<string>[] = [];
      for (const file of selectedAPIFile) {
        const promise: Promise<string> = new Promise((resolve) => {
          uploadHandler(file, dst).then(() => {
            resolve("OK");
          });
        });
        promises = [...promises, promise];
      }
      Promise.all(promises).then(() => {
        reloadFiles("ssh");
      });
    }
  };

  const uploadHandler = async (src: string, dst: string) => {
    let uploadDone = false;
    const uploadID = `${socket!.id}-${Math.floor(
      Math.random() * 100000
    ).toString()}`;
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
    socket?.emit("transferProgress", {
      type: "upload",
      transferID: uploadID,
    });
    const progressInterval = setInterval(() => {
      // if download has reached 100%
      if (uploadDone) {
        clearInterval(progressInterval);
        socket?.emit("deleteProgress", {
          type: "upload",
          transferID: uploadID,
          server_type: connectionType,
        });
        //remove from download queue
        setUploadQ((prevState) =>
          prevState.filter((state) => state.id !== uploadID)
        );
      }
    }, 1000);
    await axios
      .post(
        URL + "/transfer/upload",
        {
          uploadID,
          sourceFile: src,
          destFile: dst,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
          signal: controller.signal,
        }
      )
      .then(() => {
        uploadDone = true;
      })
      .catch((err) => {
        uploadDone = true;
        if (err.response)
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        else {
          if (connectionType === "sftp")
            socket?.emit("abortOperations", {
              type: "upload",
              transferID: uploadID,
            });
          showNotification({
            title: "CANCELED",
            message: "Upload canceled",
            color: "red",
            icon: <IconX />,
          });
        }
      });
    return;
  };

  const abortTransfer = (type: "download" | "upload" | "copy", id: string) => {
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
