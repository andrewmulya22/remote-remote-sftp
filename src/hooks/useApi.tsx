import axios from "axios";
import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  fetchingState,
  filesState,
  selectedComponentState,
} from "../atoms/apiServerState";
import {
  fetchingSSHState,
  selectedSSHComponentState,
  SSHFilesState,
} from "../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

export default function useApi() {
  const setFetching = useSetRecoilState(fetchingState);
  const setFetchingSSH = useSetRecoilState(fetchingSSHState);
  const setFile = useSetRecoilState(filesState);
  const setSSHFile = useSetRecoilState(SSHFilesState);
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);

  //FUNCTIONS
  const fetchApi = (server: "api" | "ssh" | "") => {
    if (server === "api") setFetching(true);
    if (server === "ssh") setFetchingSSH(true);
    axios
      .get(process.env.REACT_APP_SERVER_URL + "/" + server)
      .then((response) => {
        if (server === "api") {
          setFile(response.data);
          setFetching(false);
        }
        if (server === "ssh") {
          setSSHFile(response.data);
          setFetchingSSH(false);
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

  const getChildren = (server: "api" | "ssh" | "", dirPath: string) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/children", {
        path: dirPath,
      })
      .then((response) => {
        // for api server
        if (server === "api")
          setFile((prevState) => {
            const rootPath = prevState[0].path === "/" ? "" : prevState[0].path;
            if (dirPath.startsWith(rootPath)) {
              const pathToSearch = dirPath
                .substring(rootPath.length)
                .split("/")
                .filter((item) => item.length > 0);
              const newState = {
                ...prevState[0],
                children: childFinder(
                  prevState[0].children!,
                  rootPath,
                  pathToSearch,
                  response.data
                ),
              };
              return [newState];
            }
            return prevState;
          });
        // for ssh server
        if (server === "ssh")
          setSSHFile((prevState) => {
            const rootPath = prevState[0].path === "/" ? "" : prevState[0].path;
            if (dirPath.startsWith(rootPath)) {
              const pathToSearch = dirPath
                .substring(rootPath.length)
                .split("/")
                .filter((item) => item.length > 0);
              const newState = {
                ...prevState[0],
                children: childFinder(
                  prevState[0].children!,
                  rootPath,
                  pathToSearch,
                  response.data
                ),
              };
              return [newState];
            }
            return prevState;
          });
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

  const childFinder = (
    children: IChildren[],
    currentPath: string,
    pathToSearch: string[],
    data: IChildren[]
  ): IChildren[] => {
    if (pathToSearch.length > 0) {
      console.log(currentPath, pathToSearch);
      currentPath = currentPath + "/" + pathToSearch[0];
      console.log(currentPath);

      return children.slice().map((child) => {
        if (child.path === currentPath && child.children)
          return {
            ...child,
            children: childFinder(
              child.children,
              currentPath,
              pathToSearch.slice(1),
              data
            ),
          };
        return child;
      });
    }
    //if it has reached the intended path
    return data;
  };

  const deleteFiles = (server: "api" | "ssh" | "") => {
    const files = server === "api" ? selectedComponent : selectedSSHComponent;
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/delete", {
        files,
      })
      .then((response) => {
        if (response.status === 200) {
          fetchApi(server);
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
        if (response.status === 200) fetchApi(server);
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
        if (response.status === 200) fetchApi(server);
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

  const moveFile = (
    server: "api" | "ssh" | "",
    sourceFile: string,
    destPath: string
  ) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/move", {
        sourceFile,
        destPath,
      })
      .then((response) => {
        if (response.status === 200) fetchApi(server);
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

  const reloadFiles = (server: "ssh" | "api" | "") => {
    fetchApi(server);
  };

  return {
    fetchApi,
    getChildren,
    deleteFiles,
    createFolder,
    editFile,
    renameFile,
    moveFile,
    reloadFiles,
  };
}
