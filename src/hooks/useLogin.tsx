import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import axios from "axios";
import { useSetRecoilState } from "recoil";
import {
  connectionTypeState,
  selectedSSHFolderState,
  SSHAuthState,
  SSHfolderListsState,
} from "../atoms/sshServerState";
import useApi from "./useApi";

export default function useLogin() {
  const { fetchApi } = useApi();
  const setSSHAuth = useSetRecoilState(SSHAuthState);
  const setFolderLists = useSetRecoilState(SSHfolderListsState);
  const setConnectionType = useSetRecoilState(connectionTypeState);
  const setSelectedSSHFolder = useSetRecoilState(selectedSSHFolderState);

  const ssh_login_handler = (
    server_type: string,
    host: string,
    username: string,
    password: string
  ) => {
    axios
      .post(process.env.REACT_APP_SERVER_URL + "/ssh_login", {
        server_type,
        host,
        username,
        password,
      })
      .then((response) => {
        if (response.status === 200) {
          setConnectionType(server_type);
          fetchApi("ssh", server_type);
          setSSHAuth(true);
          setFolderLists([]);
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

  return { ssh_login_handler };
}
