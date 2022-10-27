import { Notification } from "@mantine/core";
import { useState } from "react";

interface Props {
  type: string;
  name: string;
  progress: number;
}

export default function NotificationComponent({ type, name, progress }: Props) {
  const [showState, setShowState] = useState(true);
  return (
    <Notification
      loading
      color={type === "download" ? "blue" : "green"}
      style={{ display: !showState ? "none" : "", marginBottom: "0.5vh" }}
      onClick={() => setShowState(false)}
    >
      {name + " " + progress + "%"}
    </Notification>
  );
}
