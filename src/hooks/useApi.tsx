import axios from "axios";
import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { filesState, selectedComponentState } from "../atoms/apiServerState";
import {
  selectedSSHComponentState,
  SSHFilesState,
} from "../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";

export default function useApi(
  url: string = process.env.REACT_APP_SERVER_URL + "/api"
) {
  const setFile = useSetRecoilState(filesState);
  const setSSHFile = useSetRecoilState(SSHFilesState);
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);

  //FUNCTIONS
  const fetchApi = () => {
    axios
      .get(url)
      .then((response) => {
        if (url === process.env.REACT_APP_SERVER_URL + "/api")
          setFile(response.data);
        else setSSHFile(response.data);
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

  const deleteFiles = (server: "api" | "ssh" | "") => {
    const files = server === "api" ? selectedComponent : selectedSSHComponent;
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/delete", {
        files,
      })
      .then((response) => {
        if (response.status === 200) {
          fetchApi();
        }
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

  const createFolder = (
    type: string,
    server: "api" | "ssh" | "",
    folderName: string
  ) => {
    let path = server === "api" ? selectedComponent : selectedSSHComponent;
    if (type === "file") path = path.split("/").slice(0, -1).join("/");
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/newfolder", {
        folderName,
        path,
      })
      .then((response) => {
        if (response.status === 200) fetchApi();
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

  const editFile = (
    server: "api" | "ssh" | "",
    filePath: string,
    fileData: string
  ) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/editfile", {
        filePath,
        fileData,
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

  const renameFile = (
    server: "api" | "ssh" | "",
    fileName: string,
    sourceFile: string
  ) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/rename", {
        fileName,
        sourceFile,
      })
      .then((response) => {
        if (response.status === 200) fetchApi();
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

  return { fetchApi, deleteFiles, createFolder, editFile, renameFile };
}
