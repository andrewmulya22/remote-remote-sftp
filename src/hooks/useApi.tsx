import axios from "axios";
import React from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  fetchingState,
  filesState,
  folderListsState,
  selectedComponentState,
} from "../atoms/apiServerState";
import {
  connectionTypeState,
  fetchingSSHState,
  selectedSSHComponentState,
  SSHFilesState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import { URLState } from "../atoms/URLState";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

export default function useApi() {
  const URL = useRecoilValue(URLState);
  //fetching state
  const setFetching = useSetRecoilState(fetchingState);
  const setFetchingSSH = useSetRecoilState(fetchingSSHState);
  //file states
  const setFile = useSetRecoilState(filesState);
  const setSSHFile = useSetRecoilState(SSHFilesState);
  //selected components
  const [selectedComponent, setSelectedComponent] = useRecoilState(
    selectedComponentState
  );
  const [selectedSSHComponent, setSelectedSSHComponent] = useRecoilState(
    selectedSSHComponentState
  );
  //opened folders
  const [folderLists, setFolderLists] = useRecoilState(folderListsState);
  const [SSHfolderLists, setSSHFolderLists] =
    useRecoilState(SSHfolderListsState);

  const connectionType = useRecoilValue(connectionTypeState);

  //FUNCTIONS
  const fetchApi = (
    server: "api" | "ssh" | "",
    server_type: string = "sftp"
  ) => {
    if (server === "api") setFetching(true);
    if (server === "ssh") setFetchingSSH(true);
    axios
      .get(URL + "/" + server, {
        params: {
          server_type,
        },
      })
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
      .catch((err) => {
        let title = "Error: Host not found";
        let message = err.message ? err.message : "Network Error";
        if (err.response) {
          title = `Error ${err.response.status}`;
          message = err.response.data;
        }
        showNotification({
          title,
          message,
          color: "red",
          icon: <IconX />,
        });
        server === "api" ? setFetching(false) : setFetchingSSH(false);
      });
  };

  const getChildren = async (server: "api" | "ssh" | "", dirPath: string) => {
    return new Promise((resolve, reject) => {
      axios
        .post(URL + "/" + server + "/children", {
          path: dirPath,
          server_type: connectionType,
        })
        .then((response) => {
          // for api server
          if (server === "api")
            setFile((prevState) => {
              const rootPath =
                prevState[0].path === "/" ? "" : prevState[0].path;
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
              const rootPath =
                prevState[0].path === "/" ? "" : prevState[0].path;
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
          resolve("Success");
        })
        .catch((err) => {
          reject(err.response.data);
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        });
    });
  };

  const childFinder = (
    children: IChildren[],
    currentPath: string,
    pathToSearch: string[],
    data: IChildren[]
  ): IChildren[] => {
    if (pathToSearch.length > 0) {
      currentPath = currentPath + "/" + pathToSearch[0];
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

  const reloadFiles = (
    server: "ssh" | "api" | "",
    filesExc: { type: string; name: string[] } = { type: "", name: [] }
    // updatedFolders: string[] = []
  ) => {
    const containerId = document.getElementById(
      server === "api" ? "left-container" : "right-container"
    )!;
    const loc = containerId.scrollTop;
    let folders = server === "api" ? [...folderLists] : [...SSHfolderLists];
    // let folders = updatedFolders.length
    //   ? updatedFolders
    //   : server === "api"
    //   ? [...folderLists]
    //   : [...SSHfolderLists];
    folders = folders.slice().sort((a, b) => a.length - b.length);
    // console.log(filesSt);
    // console.log(updatedFolders);
    // if a folder is deleted, remove from opened folders array
    if (filesExc.name.length) {
      if (
        filesExc.type === "delete" ||
        !folders.filter(
          (folder) =>
            folder === filesExc.name[1].split("/").slice(0, -1).join("/")
        ).length
      ) {
        folders = folders.filter(
          (folder) => !folder.includes(filesExc.name[0])
        );
      } else if (filesExc.type === "rename") {
        folders = folders.map((folder) =>
          folder.includes(filesExc.name[0])
            ? folder.replace(filesExc.name[0], filesExc.name[1])
            : folder
        );
        server === "api" ? setFolderLists(folders) : setSSHFolderLists(folders);
      }
    }

    //iterate through array to fill files state
    if (server === "api") {
      setFetching(true);
      reloadFilesIterator(server, folders).then(() => {
        setTimeout(() => {
          setFetching(false);
          containerId.scrollTop = loc;
        });
      });
    } else if (server === "ssh") {
      setFetchingSSH(true);
      reloadFilesIterator(server, folders).then(() => {
        setTimeout(() => {
          setFetchingSSH(false);
          containerId.scrollTop = loc;
        });
      });
    }
  };

  const reloadFilesIterator = async (
    server: "ssh" | "api" | "",
    folders: string[]
  ) => {
    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));
    for (const folder of folders) {
      await delay(server === "api" ? 50 : 100).then(() =>
        getChildren(server, folder)
      );
    }
  };

  const deleteFiles = (server: "api" | "ssh" | "") => {
    const files = server === "api" ? selectedComponent : selectedSSHComponent;
    axios
      .post(URL + "/" + server + "/delete", {
        files,
        server_type: connectionType,
      })
      .then((response) => {
        if (response.status === 200) {
          if (server === "api")
            setFolderLists((prevState) =>
              prevState.filter((folder) => !folder.includes(files))
            );
          else
            setSSHFolderLists((prevState) =>
              prevState.filter((folder) => !folder.includes(files))
            );
          reloadFiles(server, {
            type: "delete",
            name: [files],
          });
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
      .post(URL + "/" + server + "/newfolder", {
        folderName,
        path,
        server_type: connectionType,
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

  const editFile = (
    server: "api" | "ssh" | "",
    filePath: string,
    fileData: string
  ) => {
    axios
      .post(URL + "/" + server + "/editfile", {
        filePath,
        fileData,
        server_type: connectionType,
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
    sourceFile: string,
    type: string
  ) => {
    const dest = sourceFile.split("/").slice(0, -1).join("/") + "/" + fileName;
    axios
      .post(URL + "/" + server + "/rename", {
        fileName,
        sourceFile,
        server_type: connectionType,
      })
      .then((response) => {
        if (response.status === 200) {
          if (type === "folder")
            reloadFiles(server, {
              type: "rename",
              name: [sourceFile, dest],
            });
          else reloadFiles(server);
          if (server === "api") setSelectedComponent(dest);
          if (server === "ssh") setSelectedSSHComponent(dest);
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

  const moveFile = (
    server: "api" | "ssh" | "",
    sourceFile: string,
    destPath: string
  ) => {
    axios
      .post(URL + "/" + server + "/move", {
        sourceFile,
        destPath,
        server_type: connectionType,
      })
      .then((response) => {
        if (response.status === 200) {
          if (server === "api")
            setFolderLists((prevState) =>
              prevState.filter((folder) => !folder.includes(sourceFile))
            );
          else
            setSSHFolderLists((prevState) =>
              prevState.filter((folder) => !folder.includes(sourceFile))
            );
          reloadFiles(server, {
            type: "rename",
            name: [
              sourceFile,
              destPath + "/" + sourceFile.split("/").slice(-1)[0],
            ],
          });
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
