import { Notification } from "@mantine/core";
import { useState } from "react";
import useUploadDownload from "../../hooks/useUploadDownload";

interface Props {
  id: number;
  type: string;
  name: string;
  progress: number;
}

export default function NotificationComponent({
  id,
  type,
  name,
  progress,
}: Props) {
  const [showState, setShowState] = useState(true);
  const { abortTransfer } = useUploadDownload();
  return (
    <Notification
      color={type === "download" ? "blue" : "green"}
      title={type === "download" ? "DOWNLOAD" : "UPLOAD"}
      style={{
        display: !showState ? "none" : "",
        marginBottom: "0.5vh",
        minWidth: "300px",
      }}
      // onClick={() => setShowState(false)}
      onClose={() => {
        type === "download"
          ? abortTransfer("download", id)
          : abortTransfer("upload", id);
      }}
    >
      {name + " " + progress + "%"}
    </Notification>
  );
}
