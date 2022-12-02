import { createStyles, Group, Input, Loader, Text } from "@mantine/core";
import React from "react";
import { useRecoilValue } from "recoil";
import { fetchingState, selectedFolderState } from "../../atoms/apiServerState";
import {
  connectionTypeState,
  fetchingSSHState,
  selectedSSHFolderState,
} from "../../atoms/sshServerState";
import APILoginComponent from "./APILoginComponent";
import SSHLoginComponent from "./SSHLoginComponent";

const HeaderContainer = () => {
  const { classes } = useStyles();
  const fetching = useRecoilValue(fetchingState);
  const fetchingSSH = useRecoilValue(fetchingSSHState);
  const selectedFolderLeft = useRecoilValue(selectedFolderState);
  const selectedFolderRight = useRecoilValue(selectedSSHFolderState);
  const connectionType = useRecoilValue(connectionTypeState);
  return (
    <>
      <Group grow className={classes.container}>
        <APILoginComponent />
        <SSHLoginComponent />
      </Group>

      {/* Bottom Part */}
      <Group
        position="center"
        spacing="xl"
        grow
        className={classes.siteContainer}
      >
        <Group position="center">
          <Text>APIディレクトリ</Text>
          <Input
            size="xs"
            className={classes.siteInputStyle}
            value={selectedFolderLeft}
            readOnly
          />
          {fetching ? <Loader size="sm" /> : <></>}
        </Group>
        <Group position="center">
          <Text>{connectionType.toUpperCase()}ディレクトリ</Text>
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
  siteInputStyle: {
    width: "25vw",
  },
}));
