import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  connectionTypeState,
  selectedSSHFolderState,
  SSHAuthState,
  SSHClipboardState,
  SSHFilesState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import useApi from "./useApi";
import { URLState } from "../atoms/URLState";
import {
  clipboardState,
  filesState,
  folderListsState,
  selectedFolderState,
} from "../atoms/apiServerState";
import { useContext, useEffect } from "react";
import { SocketContext } from "../context/Socket";

export default function useLogin() {
  const { fetchApi } = useApi();
  const socket = useContext(SocketContext);
  //file states
  const [file, setFile] = useRecoilState(filesState);
  const setSSHFile = useSetRecoilState(SSHFilesState);
  const setSSHAuth = useSetRecoilState(SSHAuthState);

  //Other state
  const setFolderLists = useSetRecoilState(folderListsState);
  const setSSHFolderLists = useSetRecoilState(SSHfolderListsState);
  const setConnectionType = useSetRecoilState(connectionTypeState);
  const setSelectedFolder = useSetRecoilState(selectedFolderState);
  const setSelectedSSHFolder = useSetRecoilState(selectedSSHFolderState);
  const [URL, setURL] = useRecoilState(URLState);

  //clipboard management
  const setClipboard = useSetRecoilState(clipboardState);
  const setSSHClipboard = useSetRecoilState(SSHClipboardState);

  const api_login_handler = (
    host: string,
    username: string = "",
    password: string = ""
  ) => {
    if (host !== URL) {
      axios({
        method: "post",
        url: host + "/login/api",
        timeout: 5000,
        data: {
          host,
          username,
          password,
        },
      })
        .then((response) => {
          if (response.status === 200) {
            // reset API server files
            setFile([]);
            setURL(host);
            setFolderLists([]);
            setSelectedFolder("");
            setClipboard("");
            //reset SSH states
            setSSHFile([]);
            setSSHAuth(false);
            setSSHFolderLists([]);
            setSelectedSSHFolder("");
            setSSHClipboard("");
          }
        })
        .catch((err) => {
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          });
        });
    }
  };

  useEffect(() => {
    if (URL) fetchApi("api");
    // eslint-disable-next-line
  }, [URL]);

  const ssh_login_handler = (
    server_type: string,
    port: string | null,
    host: string,
    username: string,
    password: string | null,
    PKEY: File | null
  ) => {
    if (!file.length) {
      showNotification({
        title: "API server error",
        message: "Please enter API server's hostname",
        color: "red",
        icon: <IconX />,
      });
      return;
    }
    const hostname = /^\w+:\/\//i.test(host)
      ? // eslint-disable-next-line
        host.match(/^\w+:\/\/([^\/]+)\/?$/i)![1]
      : host;
    //append formData
    let formData = new FormData();
    formData.append("server_type", server_type);
    formData.append("host", hostname);
    formData.append("username", username);
    formData.append("port", port ? port : "");
    password && formData.append("password", password);
    PKEY && formData.append("pkfile", PKEY);

    axios({
      method: "post",
      url: URL + "/login/ssh",
      timeout: 5000,
      data: formData,
      params: {
        socketID: socket?.id,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          setConnectionType(server_type);
          fetchApi("ssh", server_type);
          setSSHAuth(true);
          setSSHFolderLists([]);
          setSelectedSSHFolder("");
          setSSHClipboard("");
          // keep alive FTP
          if (server_type === "ftp") socket?.emit("ftpKeepAlive");
        }
      })
      .catch((err) => {
        showNotification({
          title: `Error ${err.response.status}`,
          message: err.response.data,
          color: "red",
          icon: <IconX />,
        });
      });
  };

  return { api_login_handler, ssh_login_handler };
}
