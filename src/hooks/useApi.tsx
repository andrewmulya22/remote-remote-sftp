import axios from "axios";
import React, { useContext } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  clipboardState,
  fetchingState,
  filesState,
  folderListsState,
  selectedComponentState,
} from "../atoms/apiServerState";
import {
  connectionTypeState,
  fetchingSSHState,
  selectedSSHComponentState,
  SSHClipboardState,
  SSHFilesState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import { URLState } from "../atoms/URLState";
import { propertiesDataState, propertiesModalState } from "../atoms/modalState";
import { copyQState, delQState } from "../atoms/uploadDownloadState";
import { SocketContext } from "../context/Socket";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  mimetype: string;
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

  //properties Modal State
  const setPropertiesModal = useSetRecoilState(propertiesModalState);
  const setPropertiesData = useSetRecoilState(propertiesDataState);

  //clipboard states
  const clipboard = useRecoilValue(clipboardState);
  const SSHClipboard = useRecoilValue(SSHClipboardState);
  const setCopyQ = useSetRecoilState(copyQState);

  //delete states
  const setDelQ = useSetRecoilState(delQState);

  //SFTP or FTP
  const connectionType = useRecoilValue(connectionTypeState);

  //socket
  const socket = useContext(SocketContext);

  //FUNCTIONS
  const fetchApi = (
    server: "api" | "ssh" | "",
    server_type: string = "sftp"
  ) => {
    if (server === "api") setFetching(true);
    if (server === "ssh") setFetchingSSH(true);
    axios
      .get(URL + "/files/" + server, {
        params: {
          socketID: socket?.id,
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
        .post(
          URL + "/files/" + server + "-children",
          {
            path: dirPath,
            server_type: connectionType,
          },
          {
            params: {
              socketID: socket?.id,
            },
          }
        )
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
          // server === "api" ? setFetching(false) : setFetchingSSH(false);
          if (server === "api") {
            setFetching(false);
            setFolderLists((prevState) =>
              prevState.filter((state) => !state.includes(dirPath))
            );
          } else {
            setFetchingSSH(false);
            setSSHFolderLists((prevState) =>
              prevState.filter((state) => !state.includes(dirPath))
            );
          }
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
    filesExc: { type: string; name: { src: string; dst: string }[] } = {
      type: "",
      name: [],
    }
    // filesExc: { type: string; name: string[] } = { type: "", name: [] }
    // updatedFolders: string[] = []
  ) => {
    const containerId = document.getElementById(
      server === "api" ? "left-container" : "right-container"
    )!;
    const loc = containerId.scrollTop;
    let folders = server === "api" ? [...folderLists] : [...SSHfolderLists];
    folders = folders.slice().sort((a, b) => a.length - b.length);
    // if a folder is deleted, remove from opened folders array
    if (filesExc.name.length) {
      if (filesExc.type === "delete") {
        folders = folders.filter((folder) => {
          for (let item of filesExc.name) {
            if (folder.startsWith(item.src)) return false;
          }
          return true;
        });
      } else if (filesExc.type === "rename") {
        // folders = folders.map((folder) =>
        //   folder.includes(filesExc.name[0])
        //     ? folder.replace(filesExc.name[0], filesExc.name[1])
        //     : folder
        // );
        folders = folders.map((folder) => {
          for (let item of filesExc.name) {
            if (folder.startsWith(item.src))
              return folder.replace(item.src, item.dst);
          }
          return folder;
        });
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

  const deleteFiles = async (server: "api" | "ssh" | "") => {
    const files = server === "api" ? selectedComponent : selectedSSHComponent;
    const delID = `${socket!.id}-${Math.floor(
      Math.random() * 100000
    ).toString()}`;
    const controller = new AbortController();
    setDelQ((prevState) => [
      ...prevState,
      {
        id: delID,
        name: `Deleting ${files.length} item(s)`,
        controller,
      },
    ]);
    for await (const file of files) {
      await axios
        .post(
          URL + "/modify/" + server + "-delete",
          {
            files: file,
            server_type: connectionType,
          },
          {
            params: {
              socketID: socket?.id,
            },
          }
        )
        .then((response) => {
          setDelQ((prevState) =>
            prevState.filter((state) => state.id !== delID)
          );
          if (response.status === 200) {
            if (server === "api")
              setFolderLists((prevState) =>
                prevState.filter((folder) => !folder.includes(file))
              );
            else
              setSSHFolderLists((prevState) =>
                prevState.filter((folder) => !folder.includes(file))
              );
          }
        })
        .catch((err) => {
          setDelQ((prevState) =>
            prevState.filter((state) => state.id !== delID)
          );
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        });
    }
    reloadFiles(server, {
      type: "delete",
      name: files.map((file) => {
        return {
          src: file,
          dst: "",
        };
      }),
    });
  };

  const createFileFolder = (
    createType: string,
    type: string,
    server: "api" | "ssh" | "",
    folderName: string
  ) => {
    let path =
      server === "api"
        ? selectedComponent.at(-1)!
        : selectedSSHComponent.at(-1)!;
    if (type === "file") path = path.split("/").slice(0, -1).join("/");
    const postURL =
      createType === "folder"
        ? URL + "/modify/" + server + "-newfolder"
        : URL + "/modify/" + server + "-newfile";
    axios
      .post(
        postURL,
        {
          folderName,
          path,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
        }
      )
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
      .post(
        URL + "/modify/" + server + "-editfile",
        {
          filePath,
          fileData,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
        }
      )
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
      .post(
        URL + "/modify/" + server + "-rename",
        {
          fileName,
          sourceFile,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          if (type === "folder")
            reloadFiles(server, {
              type: "rename",
              name: [{ src: sourceFile, dst: dest }],
            });
          else reloadFiles(server);
          if (server === "api") setSelectedComponent([dest]);
          if (server === "ssh") setSelectedSSHComponent([dest]);
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

  const moveFile = async (
    server: "api" | "ssh" | "",
    // sourceFile: string,
    destPath: string
  ) => {
    const sourceFile =
      server === "api" ? selectedComponent : selectedSSHComponent;
    for await (const file of sourceFile) {
      await axios
        .post(
          URL + "/modify/" + server + "-move",
          {
            sourceFile: file,
            destPath,
            server_type: connectionType,
          },
          {
            params: {
              socketID: socket?.id,
            },
          }
        )
        .then((response) => {
          if (response.status === 200) {
            if (server === "api")
              setFolderLists((prevState) =>
                prevState.filter((folder) => !folder.includes(file))
              );
            else
              setSSHFolderLists((prevState) =>
                prevState.filter((folder) => !folder.includes(file))
              );
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
    }
    reloadFiles(server, {
      type: "rename",
      name: sourceFile.map((file) => {
        return {
          src: file,
          dst: destPath + "/" + file.split("/").slice(-1)[0],
        };
      }),
    });
  };

  const getProperties = (server: "api" | "ssh" | "") => {
    setPropertiesModal(true);
    const sourceFile =
      server === "api" ? selectedComponent.at(-1) : selectedSSHComponent.at(-1);
    axios
      .post(
        URL + "/modify/" + server + "-properties",
        {
          sourceFile,
          server_type: connectionType,
        },
        {
          params: {
            socketID: socket?.id,
          },
        }
      )
      .then((resp) =>
        setPropertiesData({
          name: resp.data.name,
          size: resp.data.size,
          mode: resp.data.mode,
          uid: resp.data.uid,
          gid: resp.data.gid,
          mtime: resp.data.mtime,
          atime: resp.data.atime,
        })
      );
  };

  const changePerm = async (newMod: string) => {
    const path = selectedComponent.at(-1);
    let error = "";
    await axios
      .post(URL + "/modify/api-changeMod", {
        path,
        newMod,
      })
      .catch((err) => {
        error = err.response.data;
      });
    return error;
  };

  const pasteFile = async (server: "api" | "ssh" | "") => {
    const sourceFile = server === "api" ? clipboard : SSHClipboard;
    const dest =
      server === "api" ? selectedComponent.at(-1) : selectedSSHComponent.at(-1);
    const copyID = `${socket!.id}-${Math.floor(
      Math.random() * 100000
    ).toString()}`;
    //controller
    const controller = new AbortController();
    setCopyQ((prevState) => [
      ...prevState,
      {
        id: copyID,
        name: `Copying ${sourceFile.length} file(s)`,
        controller: controller,
      },
    ]);
    const removeFromQ = (id: string) => {
      setCopyQ((prevState) => prevState.filter((state) => state.id !== id));
    };
    for await (const file of sourceFile) {
      await axios
        .post(
          URL + "/copy_file/" + server + "-copy",
          {
            sourceFile: file,
            destPath: dest,
            server_type: connectionType,
            copyID,
          },
          {
            params: {
              socketID: socket?.id,
            },
            signal: controller.signal,
          }
        )
        .then()
        .catch((err) => {
          showNotification({
            title: `Error ${err.response ? err.response.status : ": CANCELED"}`,
            message: err.response ? err.response.data : "Copy canceled",
            color: "red",
            icon: <IconX />,
          });
          if (!err.response) {
            axios.post(
              URL + "/copy_file/abort",
              {
                server,
                copyID,
              },
              {
                params: {
                  socketID: socket?.id,
                },
              }
            );
          }
        });
    }
    removeFromQ(copyID);
    reloadFiles(server);
  };

  return {
    fetchApi,
    getChildren,
    deleteFiles,
    createFileFolder,
    editFile,
    renameFile,
    moveFile,
    reloadFiles,
    changePerm,
    getProperties,
    pasteFile,
  };
}
