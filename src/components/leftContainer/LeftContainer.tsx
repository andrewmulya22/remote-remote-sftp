import { createStyles } from "@mantine/core";
import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { filesState } from "../../atoms/apiServerState";
import useApi from "../../hooks/useApi";
import FoldersFilesComponent from "./FoldersFilesComponent";

const LeftContainer = () => {
  const { classes } = useStyles();
  const files = useRecoilValue(filesState);
  const { fetchApi } = useApi();

  useEffect(() => {
    fetchApi();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div className={classes.container}>
        {files
          .sort((a, b) => b.type.localeCompare(a.type))
          .map((file) => (
            <FoldersFilesComponent key={file.path} files={file} count={1} />
          ))}
      </div>
    </>
  );
};

export default React.memo(LeftContainer);

const useStyles = createStyles(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    overflowY: "scroll",
  },
}));
