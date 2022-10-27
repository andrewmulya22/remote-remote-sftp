import { Button, createStyles, Input, Modal } from "@mantine/core";
import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import { newFolderModalState } from "../../atoms/modalState";
import useApi from "../../hooks/useApi";

const NewFolderModal = () => {
  const [modal, setModal] = useRecoilState(newFolderModalState);
  const { classes } = useStyles();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { createFolder } = useApi();

  const formHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (folderInputRef.current?.value)
      createFolder(modal.type, modal.server, folderInputRef.current?.value);
    setModal((prevState) => {
      return { ...prevState, opened: false };
    });
  };

  return (
    <Modal
      opened={modal.opened}
      onClose={() =>
        setModal((prevState) => {
          return { ...prevState, opened: false };
        })
      }
      title="New Folder"
      size="30%"
      centered
      className={classes.modalStyle}
      style={{
        marginRight: modal.server === "api" ? "40%" : 0,
        marginLeft: modal.server === "ssh" ? "40%" : 0,
      }}
    >
      <form onSubmit={(e) => formHandler(e)}>
        <Input placeholder="Enter your folder name" ref={folderInputRef} />
        <Button type="submit" value="Submit" className={classes.buttonStyle}>
          Create
        </Button>
      </form>
    </Modal>
  );
};

const useStyles = createStyles(() => ({
  modalStyle: {
    marginBottom: "10%",
    fontSize: "20px",
    textAlign: "left",
  },
  buttonStyle: {
    marginTop: "2vh",
    float: "right",
  },
}));

export default React.memo(NewFolderModal);
