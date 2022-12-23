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
import { useScrollIntoView } from "@mantine/hooks";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  mimetype: string;
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
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>();

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
      if (folderLists.find((folder) => folder.startsWith(files.path))) {
        setFolderLists((prevLists) => [...prevLists, files.path]);
        setValue((prevValue) => !prevValue);
      }
      //get children folder
      else
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

  const renameHandler = async () => {
    setRename(false);
    if (inputValue === files.name) return;
    const res = await renameFile("api", inputValue, files.path, files.type);
    if (!res) setInputValue(files.name);
    else scrollIntoView({ alignment: "center" });
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
      files.path !== sourcefile &&
      sourcefile.split("/").slice(0, -1).join("/") !== files.path
    )
      // moveFile("api", sourcefile, files.path);
      moveFile("api", files.path);
    if (source === "ssh" && files.type === "folder") downloadFile(files.path);
    // downloadFile(sourcefile, files.path);
  };

  //add scroll back when context menu is off
  useEffect(() => {
    if (!show)
      document.getElementById("left-container")!.style.overflow = "auto";
  }, [show]);

  const contextMenuClickHandler = () => {
    if (
      !selectedComponent.filter((component) => component === files.path).length
    )
      setSelectedComponent([files.path]);
    else
      setSelectedComponent((prevState) => [
        ...prevState.filter((state) => state !== files.path),
        files.path,
      ]);
  };

  //render
  return (
    <>
      {show ? (
        <ContextMenu
          points={anchorPoint}
          type={files.type}
          size={files.size}
          mimetype={files.mimetype}
          server="api"
        />
      ) : (
        <></>
      )}
      <Button
        className={[classes.container, "folderButton"].join(" ")}
        variant={
          selectedComponent.filter((component) => component === files.path)
            .length
            ? "light"
            : "subtle"
        }
        // variant={selectedComponent === files.path ? "light" : "subtle"}
        // variant="light"
        onClick={(e: React.MouseEvent) => {
          setRename(false);
          fillSelectedFolder();
          if (e.ctrlKey || e.metaKey) {
            setSelectedComponent((prevState) => {
              const selected = prevState.find((state) => state === files.path);
              const filteredArr = prevState.filter(
                (state) => state !== files.path
              );
              if (selected) return filteredArr;
              else return [...filteredArr, files.path];
            });
          } else setSelectedComponent([files.path]);
        }}
        onContextMenu={(event: React.MouseEvent) => {
          setRename(false);
          fillSelectedFolder();
          handleContextMenu(event);
          contextMenuClickHandler();
          document.getElementById("left-container")!.style.overflow = "hidden";
        }}
        //COMPONENT DRAG HANDLER
        draggable
        onDragStart={(e: React.DragEvent) => {
          contextMenuClickHandler();
          e.dataTransfer.setData("filetype", files.type);
          e.dataTransfer.setData("filepath", files.path);
          e.dataTransfer.setData("server", "api");
        }}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={onDropHandler}
      >
        <div
          ref={targetRef}
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
          {rename && files.path === selectedComponent.at(-1) ? (
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
            .sort(
              (a, b) => b.type.localeCompare(a.type) || b.modified - a.modified
            )
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
