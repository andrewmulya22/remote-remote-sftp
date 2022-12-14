import { Divider } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { IconDownload, IconUpload } from "@tabler/icons";
import React, { useRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  clipboardState,
  selectedComponentState,
} from "../../atoms/apiServerState";
import {
  renameStateLeft,
  renameStateRight,
} from "../../atoms/contextMenuState";
import {
  changeModState,
  editModalState,
  newFileFolderModalState,
} from "../../atoms/modalState";
import {
  connectionTypeState,
  selectedSSHComponentState,
  SSHClipboardState,
} from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import useUploadDownload from "../../hooks/useUploadDownload";
import "./Menu.css";

interface Props {
  points: {
    x: number;
    y: number;
  };
  type: string;
  size: number;
  mimetype: string;
  server: "api" | "ssh" | "";
}

export default function ContextMenu({
  points,
  type,
  size,
  mimetype,
  server,
}: Props) {
  const { height } = useViewportSize();
  const setNewFileFolderModal = useSetRecoilState(newFileFolderModalState);
  const setEditModal = useSetRecoilState(editModalState);
  const setChangeModModal = useSetRecoilState(changeModState);
  const setRenameLeft = useSetRecoilState(renameStateLeft);
  const setRenameRight = useSetRecoilState(renameStateRight);
  const { deleteFiles, getProperties, pasteFile } = useApi();
  const { downloadFile, uploadFile } = useUploadDownload();

  //SFTP or FTP
  const connectionType = useRecoilValue(connectionTypeState);

  //selected components
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);

  //clipboard management
  const [clipboard, setClipboard] = useRecoilState(clipboardState);
  const [SSHClipboard, setSSHClipboard] = useRecoilState(SSHClipboardState);

  const ref = useRef<HTMLUListElement>(null);

  const copyHandler = () => {
    if (server === "api") setClipboard(selectedComponent);
    if (server === "ssh") setSSHClipboard(selectedSSHComponent);
  };

  let textfileCheck = "nontext";

  if (mimetype) {
    if (!mimetype[0] && !mimetype[1]) textfileCheck = "text";
    if (
      mimetype[0] &&
      (mimetype[0].includes("text") ||
        mimetype[0].includes("javascript") ||
        mimetype[0].includes("json"))
    )
      textfileCheck = "text";
  }

  let newYPoint = points.y;
  if (ref.current && points.y + ref.current?.clientHeight > height)
    newYPoint = points.y - ref.current?.clientHeight;
  return (
    <ul
      className="menu"
      style={{ top: newYPoint, left: points.x, zIndex: 10 }}
      ref={ref}
    >
      <li
        className="menu__item"
        onClick={() => {
          if (server === "ssh") downloadFile();
          else uploadFile();
        }}
      >
        {server === "ssh" ? (
          <>
            <IconDownload size={20} className="menu__icon" />
            Download
          </>
        ) : (
          <>
            <IconUpload size={20} className="menu__icon" />
            Upload
          </>
        )}
      </li>
      {type === "file" && size < 522938 && textfileCheck === "text" ? (
        <li
          className="menu__item"
          onClick={() => setEditModal({ opened: true, server: server })}
        >
          Edit
        </li>
      ) : null}
      <li
        className="menu__item"
        onClick={() =>
          setNewFileFolderModal({
            createType: "folder",
            opened: true,
            type: type,
            server: server,
          })
        }
      >
        New Folder
      </li>
      <li
        className="menu__item"
        onClick={() =>
          setNewFileFolderModal({
            createType: "file",
            opened: true,
            type: type,
            server: server,
          })
        }
      >
        New File
      </li>
      {server === "api" || connectionType !== "sftp" ? (
        <li className="menu__item" onClick={() => copyHandler()}>
          Copy
        </li>
      ) : null}

      {(server === "api" && clipboard) ||
      (server === "ssh" && connectionType === "ftp" && SSHClipboard) ? (
        <li className="menu__item" onClick={() => pasteFile(server)}>
          Paste
        </li>
      ) : null}
      <Divider my="sm" style={{ margin: "0.2vh 0.5vw" }} />
      {server === "api" ? (
        <li className="menu__item" onClick={() => setChangeModModal(true)}>
          Chmod
        </li>
      ) : null}
      <li className="menu__item" onClick={() => deleteFiles(server)}>
        Delete
      </li>
      <li
        className="menu__item"
        onClick={() =>
          server === "api" ? setRenameLeft(true) : setRenameRight(true)
        }
      >
        Rename
      </li>
      <li
        className="menu__item"
        onClick={() =>
          server === "api" ? getProperties("api") : getProperties("ssh")
        }
      >
        Properties
      </li>
    </ul>
  );
}
