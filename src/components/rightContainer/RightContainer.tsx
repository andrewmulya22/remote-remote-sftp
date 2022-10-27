import { createStyles } from "@mantine/core";
import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { SSHFilesState } from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import FoldersFilesRightComponent from "./FoldersFilesRightComponent";

const RightContainer = () => {
  const { classes } = useStyles();
  const SSHFiles = useRecoilValue(SSHFilesState);
  const { fetchApi } = useApi(process.env.REACT_APP_SERVER_URL + "/ssh");

  useEffect(() => {
    fetchApi();
    // eslint-disable-next-line
  }, []);

  return (
    <div className={classes.container}>
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
