import {
  Button,
  Checkbox,
  createStyles,
  Input,
  Modal,
  Text,
} from "@mantine/core";
import axios from "axios";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedComponentState } from "../../atoms/apiServerState";
import { changeModState } from "../../atoms/modalState";
import { URLState } from "../../atoms/URLState";
import useApi from "../../hooks/useApi";
import {
  unixModeToBoolConverter,
  unixModeOperator,
} from "../../helpers/formatter";

interface checkboxState {
  owner: boolean[];
  group: boolean[];
  other: boolean[];
}

interface actionType {
  type: "owner" | "group" | "other" | "init";
  index?: number;
  data?: checkboxState;
}

const reducer = (state: checkboxState, action: actionType) => {
  if (action.type === "owner")
    return {
      ...state,
      owner: state.owner.map((elem, index) => {
        if (index === action.index) return !elem;
        else return elem;
      }),
    };
  else if (action.type === "group")
    return {
      ...state,
      group: state.group.map((elem, index) => {
        if (index === action.index) return !elem;
        else return elem;
      }),
    };
  else if (action.type === "other")
    return {
      ...state,
      other: state.other.map((elem, index) => {
        if (index === action.index) return !elem;
        else return elem;
      }),
    };
  else if (action.type === "init") return action.data ? action.data : state;
  return state;
};

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
      setDefValue("");
      setError("");
      axios
        .post(URL + "/api/properties", {
          sourceFile: selectedComponent,
        })
        .then((resp) => {
          setDefValue(resp.data.mode.slice(-3));
          onLostFocusInput(resp.data.mode.slice(-3));
        });
    }
    // eslint-disable-next-line
  }, [modal]);

  const [state, dispatch] = useReducer(reducer, {
    owner: [false, false, false],
    group: [false, false, false],
    other: [false, false, false],
  });

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

  const onLostFocusInput = (apiVal = "") => {
    let unixMode = newPermRef.current!.value.length
      ? newPermRef.current!.value
      : apiVal;
    const ownerVal = unixMode.slice(0, 1);
    const groupVal = unixMode.slice(1, 2);
    const otherVal = unixMode.slice(2);
    dispatch({
      type: "init",
      data: {
        owner: unixModeToBoolConverter(ownerVal),
        group: unixModeToBoolConverter(groupVal),
        other: unixModeToBoolConverter(otherVal),
      },
    });
  };

  const checkerHandler = (
    category: "owner" | "group" | "other",
    index: number,
    currState: boolean
  ) => {
    const categoryArr = ["owner", "group", "other"];
    dispatch({
      type: category,
      index,
    });
    //set number inside the input box
    let currentNum = newPermRef.current ? newPermRef.current.value : "";
    let newNum = "";
    categoryArr.forEach((element, i) => {
      if (element === category)
        newNum += unixModeOperator(
          currentNum.slice(i, i + 1),
          index,
          currState
        );
      else newNum += currentNum.slice(i, i + 1);
    });
    newPermRef.current!.value = newNum;
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
        <Text className={classes.attributeTitle}>Attributes</Text>
        <div className={classes.attributeStyleContainer}>
          <Text className={classes.categoryTitleStyle}>Owner</Text>
          <div className={classes.categoryStyleContainer}>
            <Checkbox
              label="Read"
              checked={state.owner[0]}
              onChange={() => checkerHandler("owner", 0, state.owner[0])}
            />
            <Checkbox
              label="Write"
              checked={state.owner[1]}
              onChange={() => checkerHandler("owner", 1, state.owner[1])}
            />
            <Checkbox
              label="Exec"
              checked={state.owner[2]}
              onChange={() => checkerHandler("owner", 2, state.owner[2])}
            />
          </div>
          <Text className={classes.categoryTitleStyle}>Group</Text>
          <div className={classes.categoryStyleContainer}>
            <Checkbox
              label="Read"
              checked={state.group[0]}
              onChange={() => checkerHandler("group", 0, state.group[0])}
            />
            <Checkbox
              label="Write"
              checked={state.group[1]}
              onChange={() => checkerHandler("group", 1, state.group[1])}
            />
            <Checkbox
              label="Exec"
              checked={state.group[2]}
              onChange={() => checkerHandler("group", 2, state.group[2])}
            />
          </div>
          <Text className={classes.categoryTitleStyle}>Other</Text>
          <div className={classes.categoryStyleContainer}>
            <Checkbox
              label="Read"
              checked={state.other[0]}
              onChange={() => checkerHandler("other", 0, state.other[0])}
            />
            <Checkbox
              label="Write"
              checked={state.other[1]}
              onChange={() => checkerHandler("other", 1, state.other[1])}
            />
            <Checkbox
              label="Exec"
              checked={state.other[2]}
              onChange={() => checkerHandler("other", 2, state.other[2])}
            />
          </div>
        </div>
        <div className={classes.numericStyleContainer}>
          <Text>Numeric Value</Text>
          <Input.Wrapper description="3 digits, ex: 777" error={error}>
            <Input
              placeholder="Enter Permission"
              ref={newPermRef}
              defaultValue={defValue}
              maxLength={3}
              onBlur={() => onLostFocusInput()}
            />
          </Input.Wrapper>
        </div>
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
  attributeTitle: {
    position: "relative",
    width: "fit-content",
    margin: "0 auto -15px auto",
    backgroundColor: "white",
  },
  attributeStyleContainer: {
    height: "180px",
    width: "100%",
    borderRadius: "5px",
    border: "1px solid black",
    padding: "20px 0",
  },
  categoryTitleStyle: {
    fontSize: "15px",
    width: "fit-content",
    margin: "5px auto -3px auto",
  },
  categoryStyleContainer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    height: "30px",
    width: "80%",
    borderRadius: "5px",
    border: "1px solid rgb(128,128,128, 0.3)",
    margin: "auto",
  },
  numericStyleContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "1vw",
    marginTop: "1vh",
  },
  buttonStyle: {
    marginTop: "2vh",
    float: "right",
  },
}));

export default React.memo(ChangeModModal);
