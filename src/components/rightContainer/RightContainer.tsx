import { createStyles } from "@mantine/core";
import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { fetchingSSHState, SSHFilesState } from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import FoldersFilesRightComponent from "./FoldersFilesRightComponent";

const RightContainer = () => {
  const { classes } = useStyles();
  const SSHFiles = useRecoilValue(SSHFilesState);
  const fetching = useRecoilValue(fetchingSSHState);
  // const { fetchApi } = useApi();

  // useEffect(() => {
  //   fetchApi("ssh");
  //   // eslint-disable-next-line
  // }, []);

  return fetching ? (
    <></>
  ) : (
    <div className={classes.container} id="right-container">
      {SSHFiles.sort((a, b) => b.type.localeCompare(a.type)).map((file) => (
        <FoldersFilesRightComponent key={file.path} files={file} count={1} />
      ))}
    </div>
  );
};

export default React.memo(RightContainer);

const useStyles = createStyles(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
  },
}));
