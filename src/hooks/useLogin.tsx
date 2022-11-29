import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  connectionTypeState,
  selectedSSHFolderState,
  SSHAuthState,
  SSHFilesState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import useApi from "./useApi";
import { URLState } from "../atoms/URLState";
import {
  filesState,
  folderListsState,
  selectedFolderState,
} from "../atoms/apiServerState";
import { useEffect } from "react";

export default function useLogin() {
  const { fetchApi } = useApi();
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

  const api_login_handler = (
    host: string,
    username: string = "",
    password: string = ""
  ) => {
    if (host !== URL) {
      axios({
        method: "post",
        url: host + "/api_login",
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
            //reset SSH states
            setSSHFile([]);
            setSSHAuth(false);
            setSSHFolderLists([]);
            setSelectedSSHFolder("");
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
  }, [URL]);

  const ssh_login_handler = (
    server_type: string,
    host: string,
    username: string,
    password: string
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
      ? host.match(/^\w+:\/\/([^\/]+)\/?$/i)![1]
      : host;
    axios({
      method: "post",
      url: URL + "/ssh_login",
      timeout: 5000,
      data: {
        server_type,
        host: hostname,
        username,
        password,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          setConnectionType(server_type);
          fetchApi("ssh", server_type);
          setSSHAuth(true);
          setSSHFolderLists([]);
          setSelectedSSHFolder("");
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
