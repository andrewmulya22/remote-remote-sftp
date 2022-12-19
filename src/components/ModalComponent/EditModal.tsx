import {
  Alert,
  Button,
  createStyles,
  Loader,
  Modal,
  Paper,
} from "@mantine/core";
import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../../atoms/apiServerState";
import { editModalState } from "../../atoms/modalState";
import {
  connectionTypeState,
  selectedSSHComponentState,
} from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import "./ModalStyle.css";
import { URLState } from "../../atoms/URLState";
import { SocketContext } from "../../context/Socket";

const EditModal = () => {
  //modal management
  const [modalOpened, setModalOpened] = useRecoilState(editModalState);
  const { classes } = useStyles();
  const URL = useRecoilValue(URLState);

  //file data and error
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);

  //useref
  const inputRef = useRef<HTMLTextAreaElement>(null);

  //edited files
  const selectedComponent = useRecoilValue(selectedComponentState);
  const selectedSSHComponent = useRecoilValue(selectedSSHComponentState);

  const connectionType = useRecoilValue(connectionTypeState);

  //socket
  const socket = useContext(SocketContext);

  //edit file API call
  const { editFile } = useApi();

  const formHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputRef.current?.value)
      editFile(
        modalOpened.server,
        modalOpened.server === "api"
          ? selectedComponent.at(-1)!
          : selectedSSHComponent.at(-1)!,
        inputRef.current?.value!
      );
    setModalOpened((prevState) => {
      return { ...prevState, opened: false };
    });
  };

  useEffect(() => {
    if (
      modalOpened.opened &&
      modalOpened.server.length &&
      (selectedComponent || selectedSSHComponent)
    ) {
      setFetching(true);
      axios
        .post(
          // process.env.REACT_APP_SERVER_URL +
          URL + "/modify/" + modalOpened.server + "-filedata",
          {
            filePath:
              modalOpened.server === "api"
                ? selectedComponent.at(-1)
                : selectedSSHComponent.at(-1),
            server_type: connectionType,
          },
          {
            params: {
              socketID: socket?.id,
            },
          }
        )
        .then((resp) => {
          setFetching(false);
          if (resp.status === 200) {
            setValue(resp.data);
            setError("");
            return true;
          }
          return false;
        })
        .catch((err) => {
          setValue("");
          setFetching(false);
          setError(err.response.data);
        });
    }
  }, [
    URL,
    setValue,
    selectedComponent,
    selectedSSHComponent,
    modalOpened,
    connectionType,
  ]);

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
      overflow="inside"
      closeOnClickOutside={false}
    >
      <form onSubmit={(e) => formHandler(e)}>
        {error.length ? (
          <Alert className={classes.alertStyle} color="red">
            {error}
          </Alert>
        ) : (
          <></>
        )}
        {fetching ? (
          <div className={classes.divLoader}>
            <Loader />
          </div>
        ) : (
          <Paper
            component="textarea"
            value={value}
            ref={inputRef}
            className={classes.textAreaStyle}
            onChange={(e) => {
              changeValueHandler(e);
            }}
          />
        )}
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
  divLoader: {
    display: "flex",
    justifyContent: "center",
    padding: "5vh 0",
  },
  buttonStyle: {
    marginTop: "2vh",
    float: "right",
  },
  alertStyle: {
    margin: "0.5vh 0",
    textAlign: "center",
  },
}));

export default React.memo(EditModal);
