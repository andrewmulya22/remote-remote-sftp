import { Button, createStyles, Text, TextInput } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconFolder,
} from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  folderListsState,
  selectedComponentState,
  selectedFolderState,
} from "../../atoms/apiServerState";
import { renameStateLeft } from "../../atoms/contextMenuState";
import useApi from "../../hooks/useApi";
import useContextMenu from "../../hooks/useContextMenu";
import useUploadDownload from "../../hooks/useUploadDownload";
import ContextMenu from "../Menu/ContextMenu";
import "./LeftContainer.css";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

const FoldersFilesComponent = ({
  files,
  count,
}: {
  files: IChildren;
  count: number;
}) => {
  const { classes } = useStyle();
  const { getChildren, renameFile, moveFile } = useApi();
  const { downloadFile } = useUploadDownload();
  const [folderLists, setFolderLists] = useRecoilState(folderListsState);
  const setSelectedFolder = useSetRecoilState(selectedFolderState);
  const [selectedComponent, setSelectedComponent] = useRecoilState(
    selectedComponentState
  );
  const [rename, setRename] = useRecoilState(renameStateLeft);
  const { anchorPoint, show, handleContextMenu } = useContextMenu(
    "api",
    files.path
  );

  //Check if folder was opened
  const [value, setValue] = useState(
    folderLists.filter((folder) => folder === files.path).length ? true : false
  );
  //initialize state value
  useEffect(() => {
    if (folderLists.filter((folder) => folder === files.path).length)
      setValue(true);
  }, [setValue, folderLists, files.path]);

  const arrowClickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    //set opened folder
    if (value) {
      setFolderLists((prevLists) =>
        prevLists.filter((list) => list !== files.path)
      );
      setValue((prevValue) => !prevValue);
    } else {
      //get children folder
      getChildren("api", files.path).then(() => {
        setFolderLists((prevLists) => [...prevLists, files.path]);
        setValue((prevValue) => !prevValue);
      });
    }
  };

  //initial value for text input
  const [inputValue, setInputValue] = useState(
    files.name ? files.name : files.path.split("/").slice(-1)[0]
  );

  const renameHandler = () => {
    setRename(false);
    renameFile("api", inputValue, files.path);
  };

  const fillSelectedFolder = () => {
    if (files.type === "folder") setSelectedFolder(files.path);
    else setSelectedFolder(files.path.split("/").slice(0, -1).join("/"));
  };

  const onDropHandler = (event: React.DragEvent) => {
    event.preventDefault();
    const sourcefile = event.dataTransfer.getData("filepath");
    const source = event.dataTransfer.getData("server");
    if (
      source === "api" &&
      files.type === "folder" &&
      files.path !== sourcefile
    )
      moveFile("api", sourcefile, files.path);
    if (source === "ssh" && files.type === "folder") {
      downloadFile(sourcefile, files.path);
    }
  };

  return (
    <>
      {show ? (
        <ContextMenu
          points={anchorPoint}
          type={files.type}
          size={files.size}
          server="api"
        />
      ) : (
        <></>
      )}
      <Button
        className={[classes.container, "folderButton"].join(" ")}
        variant={selectedComponent === files.path ? "light" : "subtle"}
        // variant="light"
        onClick={() => {
          fillSelectedFolder();
          setSelectedComponent(files.path);
          setRename(false);
        }}
        onContextMenu={(event: React.MouseEvent) => {
          handleContextMenu(event);
          fillSelectedFolder();
          setSelectedComponent(files.path);
          setRename(false);
        }}
        //COMPONENT DRAG HANDLER
        draggable
        onDragStart={(event: React.DragEvent) => {
          event.dataTransfer.setData("filetype", files.type);
          event.dataTransfer.setData("filepath", files.path);
          event.dataTransfer.setData("server", "api");
        }}
        onDragOver={(event: React.DragEvent) => event.preventDefault()}
        onDrop={onDropHandler}
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
              //prevent draggable
              onDragStart={(e) => e.preventDefault()}
              draggable
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
              <FoldersFilesComponent
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

export default React.memo(FoldersFilesComponent);

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
