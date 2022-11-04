import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { SSHAuthState, SSHfolderListsState } from "../atoms/sshServerState";
import useApi from "./useApi";

export default function useLogin() {
  const { fetchApi } = useApi();
  const setSSHAuth = useSetRecoilState(SSHAuthState);
  const setFolderLists = useSetRecoilState(SSHfolderListsState);
  const folderLists = useRecoilValue(SSHfolderListsState);

  const ssh_login_handler = (
    host: string,
    username: string,
    password: string
  ) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/ssh_login", {
        host,
        username,
        password,
      })
      .then((response) => {
        if (response.status === 200) {
          fetchApi("ssh");
          setSSHAuth(true);
          setFolderLists([]);
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

  return { ssh_login_handler };
}
