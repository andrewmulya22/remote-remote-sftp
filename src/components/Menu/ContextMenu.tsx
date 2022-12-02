import { Divider } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { IconDownload, IconUpload } from "@tabler/icons";
import React from "react";
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
  newFolderModalState,
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

const ContextMenu = ({ points, type, size, mimetype, server }: Props) => {
  const { height } = useViewportSize();
  const setNewFolderModal = useSetRecoilState(newFolderModalState);
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

  const copyHandler = () => {
    if (server === "api") setClipboard(selectedComponent);
    if (server === "ssh") setSSHClipboard(selectedSSHComponent);
  };

  let textfileCheck = "nontext";
  if (mimetype) {
    if (!mimetype[0] && !mimetype[1]) textfileCheck = "text";
    if (mimetype[0] && mimetype[0].includes("text")) textfileCheck = "text";
  }

  let newYPoint = points.y;
  if (points.y + 263 > height) newYPoint = points.y - 263;
  return (
    <ul className="menu" style={{ top: newYPoint, left: points.x, zIndex: 10 }}>
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
      ) : (
        <></>
      )}
      <li
        className="menu__item"
        onClick={() =>
          setNewFolderModal({ opened: true, type: type, server: server })
        }
      >
        New Folder
      </li>
      {(server === "api" || connectionType !== "sftp") && (
        <li className="menu__item" onClick={() => copyHandler()}>
          Copy
        </li>
      )}

      {((server === "api" && clipboard) ||
        (server === "ssh" && connectionType === "ftp" && SSHClipboard)) && (
        <li className="menu__item" onClick={() => pasteFile(server)}>
          Paste
        </li>
      )}
      <Divider my="sm" style={{ margin: "0.2vh 0.5vw" }} />
      {server === "api" && (
        <li className="menu__item" onClick={() => setChangeModModal(true)}>
          Chmod
        </li>
      )}
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
};

export default React.memo(ContextMenu);
