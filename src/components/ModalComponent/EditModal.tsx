import { Button, createStyles, Modal, Paper } from "@mantine/core";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../../atoms/apiServerState";
import { editModalState } from "../../atoms/modalState";
import { selectedSSHComponentState } from "../../atoms/sshServerState";
import { showNotification } from "@mantine/notifications";
import useApi from "../../hooks/useApi";
import "./ModalStyle.css";
import { IconX } from "@tabler/icons";

const EditModal = () => {
  //modal management
  const [modalOpened, setModalOpened] = useRecoilState(editModalState);
  const { classes } = useStyles();

  //file data
  const [value, setValue] = useState("");

  //useref
  const inputRef = useRef<HTMLTextAreaElement>(null);

  //edited files
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);

  //edit file API call
  const { editFile } = useApi();

  const formHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputRef.current?.value)
      editFile(
        modalOpened.server,
        modalOpened.server === "api" ? selectedComponent : selectedSSHComponent,
        inputRef.current?.value!
      );
    setModalOpened((prevState) => {
      return { ...prevState, opened: false };
    });
  };

  useEffect(() => {
    if (
      modalOpened.server.length &&
      (selectedComponent || selectedSSHComponent)
    ) {
      axios
        .post(
          process.env.REACT_APP_SERVER_URL +
            "/" +
            modalOpened.server +
            "/filedata",
          {
            filePath:
              modalOpened.server === "api"
                ? selectedComponent
                : selectedSSHComponent,
          }
        )
        .then((resp) => {
          if (resp.status === 200) {
            setValue(resp.data);
            return true;
          }
          return false;
        })
        .catch((err) =>
          showNotification({
            title: `Error ${err.response.status}`,
            message: err.response.data,
            color: "red",
            icon: <IconX />,
          })
        );
    }
  }, [setValue, selectedComponent, selectedSSHComponent, modalOpened]);

  const changeValueHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <Modal
      opened={modalOpened.opened}
      onClose={() => {
        setModalOpened((prevState) => {
          return { ...prevState, opened: false };
        });
      }}
      title="Edit"
      size="50%"
      centered
      className={classes.modalStyle}
    >
      <form onSubmit={(e) => formHandler(e)}>
        <Paper
          component="textarea"
          value={value}
          ref={inputRef}
          className={classes.textAreaStyle}
          onChange={(e) => {
            changeValueHandler(e);
          }}
        />

        <Button type="submit" value="Submit" className={classes.buttonStyle}>
          Edit
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
  textAreaStyle: {
    resize: "none",
    width: "100%",
    lineHeight: "18px",
    minHeight: "50vh",
  },
  buttonStyle: {
    marginTop: "2vh",
    float: "right",
  },
}));

export default React.memo(EditModal);
