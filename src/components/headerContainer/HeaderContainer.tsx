import {
  Badge,
  Button,
  createStyles,
  Group,
  Input,
  Loader,
  PasswordInput,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons";
import React from "react";
import { useRecoilValue } from "recoil";
import { fetchingState, selectedFolderState } from "../../atoms/apiServerState";
import {
  fetchingSSHState,
  selectedSSHFolderState,
} from "../../atoms/sshServerState";

const HeaderContainer = () => {
  const { classes } = useStyles();
  const fetching = useRecoilValue(fetchingState);
  const fetchingSSH = useRecoilValue(fetchingSSHState);
  const selectedFolderLeft = useRecoilValue(selectedFolderState);
  const selectedFolderRight = useRecoilValue(selectedSSHFolderState);
  return (
    <>
      <Group grow className={classes.container}>
        <form onSubmit={(e) => {}}>
          <Group position="center">
            <Badge size="lg">APIサーバ</Badge>
            <Input placeholder="Host" />
            <Input placeholder="Username" />
            <PasswordInput
              placeholder="Password"
              className={classes.passwordInputStyle}
            />
            <Button type="submit" value="Submit">
              接続
            </Button>
            <Button>
              <IconRefresh />
            </Button>
          </Group>
        </form>
        <Group position="center">
          <Badge size="lg">SFTPサーバ</Badge>
          <Input placeholder="Host" disabled />
          <Input placeholder="Username" disabled />
          <PasswordInput
            placeholder="Password"
            className={classes.passwordInputStyle}
            disabled
          />
          <Button type="submit" value="Submit" disabled>
            接続
          </Button>
          <Button disabled>
            <IconRefresh />
          </Button>
        </Group>
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
          <Text>SSHサイト</Text>
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
    height: "80px",
    gridColumn: "1/4",
    borderBottom: "1px solid rgba(128,128,128,0.5)",
    padding: "0vh 3vh",
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
