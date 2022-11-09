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
  const { ssh_login_handler } = useLogin();
  const fetching = useRecoilValue(fetchingState);
  const fetchingSSH = useRecoilValue(fetchingSSHState);
  const selectedFolderLeft = useRecoilValue(selectedFolderState);
  const selectedFolderRight = useRecoilValue(selectedSSHFolderState);
  const connectionType = useRecoilValue(connectionTypeState);

  //ssh ref
  const SERVERSELECT = useRef<HTMLSelectElement>(null);
  const SSHHOST = useRef<HTMLInputElement>(null);
  const SSHUSERNAME = useRef<HTMLInputElement>(null);
  const SSHPASSWORD = useRef<HTMLInputElement>(null);
  const SSHAuth = useRecoilValue(SSHAuthState);

  // const api_login = () => {};

  const ssh_login = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      SERVERSELECT.current!.value &&
      SSHHOST.current!.value &&
      SSHUSERNAME.current!.value &&
      SSHPASSWORD.current!.value
    )
      ssh_login_handler(
        SERVERSELECT.current!.value,
        SSHHOST.current!.value,
        SSHUSERNAME.current!.value,
        SSHPASSWORD.current!.value
      );
  };

  const serverSelect = [
    { value: "sftp", label: "SFTP" },
    { value: "ftp", label: "FTP" },
  ];

  return (
    <>
      <Group grow className={classes.container}>
        <form onSubmit={(e) => {}}>
          <Group position="center">
            <Badge size="lg">APIサーバ</Badge>
            <Input placeholder="Host" />
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
            <Input placeholder="Host" ref={SSHHOST} />
            <Input placeholder="Username" ref={SSHUSERNAME} />
            <PasswordInput
              placeholder="Password"
              className={classes.passwordInputStyle}
              ref={SSHPASSWORD}
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
