import { Card, createStyles, Grid, Group, Modal, Text } from "@mantine/core";
import { IconFolder } from "@tabler/icons";
import React from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  propertiesModalState,
  propertiesDataState,
} from "../../atoms/modalState";
import "./ModalStyle.css";
import {
  fileTypeConverter,
  unixTimeConverter,
  unixModeConverter,
  numberWithCommas,
} from "../../helpers/formatter";

const PropertiesModal = () => {
  //modal management
  const [modalOpened, setModalOpened] = useRecoilState(propertiesModalState);
  const propertiesData = useRecoilValue(propertiesDataState);
  const { classes } = useStyles();
  return (
    <Modal
      opened={modalOpened}
      onClose={() => {
        setModalOpened((prevState) => !prevState);
      }}
      title="Properties"
      size="50%"
      centered
      className={classes.modalStyle}
      overflow="inside"
    >
      <Card withBorder shadow="sm" radius="md">
        <Card.Section withBorder inheritPadding py="xs">
          <Group position="center">
            <IconFolder />
            <Text>
              {propertiesData.name === "" ? "root" : propertiesData.name}
            </Text>
          </Group>
        </Card.Section>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Filetype</Text>
          <Text style={{ textAlign: "left" }}>
            {fileTypeConverter(propertiesData.mode)}
          </Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Size</Text>
          <Text style={{ textAlign: "left" }}>
            {numberWithCommas(propertiesData.size)}
          </Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Permission</Text>
          <Text style={{ textAlign: "left" }}>
            {unixModeConverter(propertiesData.mode)}
          </Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Owner</Text>
          <Text style={{ textAlign: "left" }}>{propertiesData.uid}</Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Group</Text>
          <Text style={{ textAlign: "left" }}>{propertiesData.gid}</Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Modified Time</Text>
          <Text style={{ textAlign: "left" }}>
            {unixTimeConverter(propertiesData.mtime)}
          </Text>
        </Group>
        <Group position="center" grow>
          <Text style={{ textAlign: "right" }}>Accessed Time</Text>
          <Text style={{ textAlign: "left" }}>
            {unixTimeConverter(propertiesData.atime)}
          </Text>
        </Group>
      </Card>
    </Modal>
  );
};

const useStyles = createStyles(() => ({
  modalStyle: {
    marginBottom: "10%",
    fontSize: "20px",
    textAlign: "center",
  },
}));

export default React.memo(PropertiesModal);
