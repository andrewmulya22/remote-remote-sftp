import { Alert, Button, createStyles, Input, Modal } from "@mantine/core";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../../atoms/apiServerState";
import { changeModState, newFolderModalState } from "../../atoms/modalState";
import { URLState } from "../../atoms/URLState";
import useApi from "../../hooks/useApi";

const ChangeModModal = () => {
  const URL = useRecoilValue(URLState);
  const [modal, setModal] = useRecoilState(changeModState);
  const [error, setError] = useState<string>("");
  const [defValue, setDefValue] = useState<string>("");
  const selectedComponent = useRecoilValue(selectedComponentState);
  const { classes } = useStyles();
  const newPermRef = useRef<HTMLInputElement>(null);
  const { changePerm } = useApi();

  useEffect(() => {
    if (modal) {
      setError("");
      axios
        .post(URL + "/api/properties", {
          sourceFile: selectedComponent,
        })
        .then((resp) => {
          setDefValue(resp.data.mode.slice(-3));
        });
    }
  }, [modal]);

  const formHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !newPermRef.current ||
      !/^\d+$/.test(newPermRef.current.value) ||
      newPermRef.current.value.length !== 3
    ) {
      setError("Invalid Permission");
      return;
    }
    const error = await changePerm(newPermRef.current.value);
    if (!error.length) setModal(false);
    else setError(error);
  };

  return (
    <Modal
      opened={modal}
      onClose={() => setModal(false)}
      title="Change Permission"
      size="30%"
      centered
      className={classes.modalStyle}
    >
      <form onSubmit={(e) => formHandler(e)}>
        <Input.Wrapper description="3 digits, ex: 777" error={error}>
          <Input
            placeholder="Enter Permission"
            ref={newPermRef}
            defaultValue={defValue}
          />
        </Input.Wrapper>
        <Button type="submit" value="Submit" className={classes.buttonStyle}>
          Change
        </Button>
      </form>
    </Modal>
  );
};

const useStyles = createStyles(() => ({
  modalStyle: {
    margin: "0 auto 10% 0",
    width: "80vw",
    fontSize: "20px",
    textAlign: "left",
  },
  buttonStyle: {
    marginTop: "2vh",
    float: "right",
  },
}));

export default React.memo(ChangeModModal);
