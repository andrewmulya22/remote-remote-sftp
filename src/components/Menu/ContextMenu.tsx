import { useViewportSize } from "@mantine/hooks";
import { IconDownload, IconUpload } from "@tabler/icons";
import React from "react";
import { useSetRecoilState } from "recoil";
import {
  renameStateLeft,
  renameStateRight,
} from "../../atoms/contextMenuState";
import { editModalState, newFolderModalState } from "../../atoms/modalState";
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
  server: "api" | "ssh" | "";
}

const ContextMenu = ({ points, type, size, server }: Props) => {
  const { height } = useViewportSize();
  const setNewFolderModal = useSetRecoilState(newFolderModalState);
  const setEditModal = useSetRecoilState(editModalState);
  const setRenameLeft = useSetRecoilState(renameStateLeft);
  const setRenameRight = useSetRecoilState(renameStateRight);
  const { deleteFiles, getProperties } = useApi();
  const { downloadFile, uploadFile } = useUploadDownload();

  let newYPoint = points.y;
  if (points.y + 170 > height) newYPoint = points.y - 170;
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
      {type === "file" && size < 1048576 ? (
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
