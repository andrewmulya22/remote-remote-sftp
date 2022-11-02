import axios from "axios";
import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  fetchingState,
  filesState,
  folderListsState,
  scrollLocState,
  selectedComponentState,
} from "../atoms/apiServerState";
import {
  fetchingSSHState,
  selectedSSHComponentState,
  SSHFilesState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import { resolve } from "node:path/win32";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

export default function useApi() {
  //fetching state
  const setFetching = useSetRecoilState(fetchingState);
  const setFetchingSSH = useSetRecoilState(fetchingSSHState);
  //file states
  const fileState = useRecoilValue(filesState);
  const setFile = useSetRecoilState(filesState);
  const setSSHFile = useSetRecoilState(SSHFilesState);
  //selected components
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);
  //opened folders
  const folderLists = useRecoilValue(folderListsState);
  const SSHfolderLists = useRecoilValue(SSHfolderListsState);

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

  const getChildren = async (server: "api" | "ssh" | "", dirPath: string) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/children", {
        path: dirPath,
      })
      .then((response) => {
        console.log(response.data);
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
      // console.log(currentPath, pathToSearch);
      currentPath = currentPath + "/" + pathToSearch[0];
      // console.log(currentPath);
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

  const reloadFiles = async (server: "ssh" | "api" | "") => {
    const containerId = document.getElementById(
      server === "api" ? "left-container" : "right-Container"
    )!;
    const loc = containerId.scrollTop;
    if (server === "api") {
      setFetching(true);
      for (const folder of folderLists) {
        await new Promise(function (resolve) {
          resolve(getChildren(server, folder));
        });
      }
      // for (const folder of folderLists) {
      //   await getChildren(server, folder);
      // }
      setFetching(false);
    } else if (server === "ssh") {
      setFetchingSSH(true);
      // await Promise.all(
      //   SSHfolderLists.map(async (folder) => {
      //     await getChildren(server, folder);
      //   })
      // );
      for (const folder of SSHfolderLists) {
        await getChildren(server, folder);
      }
      setFetchingSSH(false);
    }
    // scroll back to position
    setTimeout(() => (containerId.scrollTop = loc), 100);
  };

  const deleteFiles = (server: "api" | "ssh" | "") => {
    const files = server === "api" ? selectedComponent : selectedSSHComponent;
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/" + server + "/delete", {
        files,
      })
      .then((response) => {
        if (response.status === 200) {
          reloadFiles(server);
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
        if (response.status === 200) reloadFiles(server);
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
        if (response.status === 200) reloadFiles(server);
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
