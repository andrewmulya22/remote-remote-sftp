import { Button, createStyles, Text, TextInput } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconFolder,
} from "@tabler/icons";
import React, { useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { renameStateRight } from "../../atoms/contextMenuState";
import {
  selectedSSHComponentState,
  selectedSSHFolderState,
  SSHfolderListsState,
} from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu from "../Menu/ContextMenu";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

const FoldersFilesRightComponent = ({
  files,
  count,
}: {
  files: IChildren;
  count: number;
}) => {
  const { classes } = useStyle();
  const { renameFile } = useApi(process.env.REACT_APP_SERVER_URL + "/ssh");
  const [folderLists, setFolderLists] = useRecoilState(SSHfolderListsState);
  const setSelectedFolder = useSetRecoilState(selectedSSHFolderState);
  const [selectedComponent, setSelectedComponent] = useRecoilState(
    selectedSSHComponentState
  );
  const [rename, setRename] = useRecoilState(renameStateRight);
  const { anchorPoint, show, handleContextMenu } = useContextMenu(
    "ssh",
    files.path
  );

  //Check if folder was opened
  const [value, setValue] = useState(
    folderLists.filter((folder) => folder === files.path).length ? true : false
  );

  const arrowClickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue((prevValue) => !prevValue);
    if (value)
      setFolderLists((prevLists) =>
        prevLists.filter((list) => list !== files.path)
      );
    else setFolderLists((prevLists) => [...prevLists, files.path]);
  };

  //initial value for text input
  const [inputValue, setInputValue] = useState(
    files.name ? files.name : files.path.split("/").slice(-1)[0]
  );

  const renameHandler = () => {
    setRename(false);
    renameFile("ssh", inputValue, files.path);
  };

  return (
    <>
      {show ? (
        <ContextMenu
          points={anchorPoint}
          type={files.type}
          size={files.size}
          server="ssh"
        />
      ) : (
        <></>
      )}
      <Button
        className={[classes.container, "folderButton"].join(" ")}
        variant={selectedComponent === files.path ? "light" : "subtle"}
        onClick={() => {
          if (files.type === "folder") setSelectedFolder(files.path);
          setSelectedComponent(files.path);
        }}
        onContextMenu={(event: React.MouseEvent) => {
          handleContextMenu(event);
          setSelectedComponent(files.path);
        }}
      >
        <div
          className={classes.dropdown}
          style={{
            marginLeft: `${(count - 1) * 30}px`,
            visibility: files.type === "folder" ? "visible" : "hidden",
          }}
          onClick={arrowClickHandler}
        >
          {value ? (
            <IconChevronDown size={22} color="gray" />
          ) : (
            <IconChevronRight size={22} color="gray" />
          )}
        </div>
        <div className={classes.folderStyle}>
          {files.type === "folder" ? (
            <IconFolder color="gray" />
          ) : (
            <IconFile color="pink" />
          )}
          {rename && files.path === selectedComponent ? (
            <TextInput
              size="xs"
              onBlur={() => renameHandler()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") renameHandler();
              }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: "30vw" }}
            />
          ) : (
            <Text color="gray">
              {files.name ? files.name : files.path.split("/").slice(-1)[0]}
            </Text>
          )}
        </div>
      </Button>
      {value ? (
        files.children ? (
          files.children
            .slice()
            .sort((a, b) => b.type.localeCompare(a.type))
            .map((file) => (
              <FoldersFilesRightComponent
                key={file.path}
                files={file}
                count={count + 1}
              />
            ))
        ) : (
          <></>
        )
      ) : (
        <></>
      )}
    </>
  );
};

export default React.memo(FoldersFilesRightComponent);

const useStyle = createStyles(() => ({
  container: {
    minHeight: "40px",
  },
  dropdown: {
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: "0.5vw",
  },
  folderStyle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5vw",
  },
}));
