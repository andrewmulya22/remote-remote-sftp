import { Notification } from "@mantine/core";
// import { useState } from "react";
import useUploadDownload from "../../hooks/useUploadDownload";

interface Props {
  id: string;
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
  // const [showState, setShowState] = useState(true);
  const { abortTransfer } = useUploadDownload();
  return (
    <Notification
      color={
        type === "download" ? "blue" : type === "upload" ? "green" : "dark"
      }
      loading={type === "copy" || type === "delete"}
      title={type.toLocaleUpperCase()}
      style={{
        // display: !showState ? "none" : "",
        marginBottom: "0.5vh",
        minWidth: "300px",
      }}
      // onClick={() => setShowState(false)}
      onClose={() => {
        if (type === "download") abortTransfer("download", id);
        if (type === "upload") abortTransfer("upload", id);
        if (type === "copy") abortTransfer("copy", id);
      }}
    >
      {type !== "copy" ? name + " " + progress + "%" : name}
    </Notification>
  );
}
