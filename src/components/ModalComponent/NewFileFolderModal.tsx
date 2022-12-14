import { Button, createStyles, Input, Modal } from "@mantine/core";
import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import { newFileFolderModalState } from "../../atoms/modalState";
import useApi from "../../hooks/useApi";

const NewFileFolderModal = () => {
  const [modal, setModal] = useRecoilState(newFileFolderModalState);
  const { classes } = useStyles();
  const filefolderInputRef = useRef<HTMLInputElement>(null);
  const { createFileFolder } = useApi();

  const formHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (filefolderInputRef.current?.value) {
      createFileFolder(
        modal.createType,
        modal.type,
        modal.server,
        filefolderInputRef.current?.value
      );
    }
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
      title={modal.createType === "folder" ? "New Folder" : "New File"}
      size="30%"
      centered
      className={classes.modalStyle}
      style={{
        marginRight: modal.server === "api" ? "40%" : 0,
        marginLeft: modal.server === "ssh" ? "40%" : 0,
      }}
    >
      <form onSubmit={(e) => formHandler(e)}>
        <Input placeholder="Enter new name" ref={filefolderInputRef} />
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

export default React.memo(NewFileFolderModal);
