import { createStyles } from "@mantine/core";
import { useRecoilValue } from "recoil";
import { downloadQState, uploadQState } from "../../atoms/uploadDownloadState";
import NotificationComponent from "./NotificationComponent";

export default function NotificationStack() {
  const { classes } = useStyles();
  const downloadQ = useRecoilValue(downloadQState);
  const uploadQ = useRecoilValue(uploadQState);
  return (
    <div className={classes.containerStyle}>
      {[...downloadQ].map((download) => (
        <NotificationComponent
          key={download.id}
          type="download"
          name={download.name}
          progress={download.progress}
        />
      ))}
      {[...uploadQ].map((download) => (
        <NotificationComponent
          key={download.id}
          type="download"
          name={download.name}
          progress={download.progress}
        />
      ))}
    </div>
  );
}

const useStyles = createStyles(() => ({
  containerStyle: {
    position: "absolute",
    color: "blue",
    bottom: "0.5vh",
    left: "5vw",
  },
}));
