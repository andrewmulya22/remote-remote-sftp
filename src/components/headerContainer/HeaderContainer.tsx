import {
  Badge,
  Button,
  createStyles,
  Group,
  Input,
  Loader,
  NativeSelect,
  PasswordInput,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons";
import React, { useRef } from "react";
import { useRecoilValue } from "recoil";
import { fetchingState, selectedFolderState } from "../../atoms/apiServerState";
import {
  connectionTypeState,
  fetchingSSHState,
  selectedSSHFolderState,
  SSHAuthState,
} from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import useLogin from "../../hooks/useLogin";

const HeaderContainer = () => {
  const { classes } = useStyles();
  const { reloadFiles } = useApi();
  const { api_login_handler, ssh_login_handler } = useLogin();
  const fetching = useRecoilValue(fetchingState);
  const fetchingSSH = useRecoilValue(fetchingSSHState);
  const selectedFolderLeft = useRecoilValue(selectedFolderState);
  const selectedFolderRight = useRecoilValue(selectedSSHFolderState);
  const connectionType = useRecoilValue(connectionTypeState);

  //ssh ref
  const APIHOST = useRef<HTMLInputElement>(null);
  const SERVERSELECT = useRef<HTMLSelectElement>(null);
  const SSHHOST = useRef<HTMLInputElement>(null);
  const SSHUSERNAME = useRef<HTMLInputElement>(null);
  const SSHPASSWORD = useRef<HTMLInputElement>(null);
  const SSHAuth = useRecoilValue(SSHAuthState);

  // const api_login = () => {};

  const api_login = (e: React.FormEvent) => {
    e.preventDefault();
    if (APIHOST.current) {
      let hostname = APIHOST.current.value;
      // remove / if exists
      hostname = hostname.replace(/\/$/, "");
      if (/^\d+/i.test(hostname)) hostname = "http://localhost:" + hostname;
      else if (!/^https?:\/\//i.test(hostname)) hostname = "http://" + hostname;
      api_login_handler(hostname);
    }
  };

  const ssh_login = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      SERVERSELECT.current &&
      SSHHOST.current &&
      SSHUSERNAME.current &&
      SSHPASSWORD.current
    )
      ssh_login_handler(
        SERVERSELECT.current.value,
        SSHHOST.current.value,
        SSHUSERNAME.current.value,
        SSHPASSWORD.current.value
      );
  };

  const serverSelect = [
    { value: "sftp", label: "SFTP" },
    { value: "ftp", label: "FTP" },
  ];

  return (
    <>
      <Group grow className={classes.container}>
        <form onSubmit={(e) => api_login(e)}>
          <Group position="center">
            <Badge size="lg">APIサーバ</Badge>
            <Input placeholder="Host or Port Number" ref={APIHOST} />
            {/* <Input placeholder="Username" />
            <PasswordInput
              placeholder="Password"
              className={classes.passwordInputStyle}
            /> */}
            <Button type="submit" value="Submit">
              接続
            </Button>
            <Button onClick={() => reloadFiles("api")}>
              <IconRefresh />
            </Button>
          </Group>
        </form>
        <form
          onSubmit={(e) => {
            ssh_login(e);
          }}
        >
          <Group position="center">
            {/* <Badge size="lg">{connectionType}サーバ</Badge> */}
            <NativeSelect
              data={serverSelect}
              ref={SERVERSELECT}
              // onChange={(e) => setConnectionType(e.currentTarget.value)}
            />
            <Input
              placeholder="Host"
              ref={SSHHOST}
              style={{ maxWidth: "8vw" }}
            />
            <Input
              placeholder="Username"
              ref={SSHUSERNAME}
              style={{ maxWidth: "8vw" }}
            />
            <PasswordInput
              placeholder="Password"
              className={classes.passwordInputStyle}
              ref={SSHPASSWORD}
              style={{ maxWidth: "8vw" }}
            />
            <Button type="submit" value="Submit">
              接続
            </Button>
            <Button
              onClick={() => reloadFiles("ssh")}
              disabled={SSHAuth ? false : true}
            >
              <IconRefresh />
            </Button>
          </Group>
        </form>
      </Group>
      <Group
        position="center"
        spacing="xl"
        grow
        className={classes.siteContainer}
      >
        <Group position="center">
          <Text>APIサイト</Text>
          <Input
            size="xs"
            className={classes.siteInputStyle}
            value={selectedFolderLeft}
            readOnly
          />
          {fetching ? <Loader size="sm" /> : <></>}
        </Group>
        <Group position="center">
          <Text>{connectionType.toUpperCase()}サイト</Text>
          <Input
            size="xs"
            className={classes.siteInputStyle}
            value={selectedFolderRight}
            readOnly
          />
          {fetchingSSH ? <Loader size="sm" /> : <></>}
        </Group>
      </Group>
    </>
  );
};

export default React.memo(HeaderContainer);

const useStyles = createStyles(() => ({
  container: {
    minHeight: "80px",
    gridColumn: "1/4",
    borderBottom: "1px solid rgba(128,128,128,0.5)",
    padding: "2vh 3vh",
  },
  siteContainer: {
    height: "40px",
    gridColumn: "1/4",
    borderBottom: "1px solid rgba(128,128,128,0.5)",
  },
  passwordInputStyle: {
    width: "200px",
  },
  siteInputStyle: {
    width: "25vw",
  },
}));
