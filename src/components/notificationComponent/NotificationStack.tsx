import { createStyles } from "@mantine/core";
import React from "react";
import { useRecoilValue } from "recoil";
import {
  copyQState,
  delQState,
  downloadQState,
  uploadQState,
} from "../../atoms/uploadDownloadState";
import NotificationComponent from "./NotificationComponent";

const NotificationStack = () => {
  const { classes } = useStyles();
  const downloadQ = useRecoilValue(downloadQState);
  const uploadQ = useRecoilValue(uploadQState);
  const copyQ = useRecoilValue(copyQState);
  const delQ = useRecoilValue(delQState);
  return (
    <div className={classes.containerStyle}>
      {[...downloadQ].map((download) => (
        <NotificationComponent
          key={download.id}
          id={download.id}
          type="download"
          name={download.name}
          progress={download.progress}
        />
      ))}
      {[...uploadQ].map((upload) => (
        <NotificationComponent
          key={upload.id}
          id={upload.id}
          type="upload"
          name={upload.name}
          progress={upload.progress}
        />
      ))}
      {[...copyQ].map((copy) => (
        <NotificationComponent
          key={copy.id}
          id={copy.id}
          type="copy"
          name={copy.name}
          progress={0}
        />
      ))}
      {[...delQ].map((del) => (
        <NotificationComponent
          key={del.id}
          id={del.id}
          type="delete"
          name={del.name}
          progress={0}
        />
      ))}
    </div>
  );
};

const useStyles = createStyles(() => ({
  containerStyle: {
    position: "absolute",
    color: "blue",
    bottom: "0.5vh",
    left: "5vw",
  },
}));

export default React.memo(NotificationStack);
