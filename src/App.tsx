import { Divider } from "@mantine/core";
import React from "react";
import "./App.css";
import HeaderContainer from "./components/headerContainer/HeaderContainer";
import LeftContainer from "./components/leftContainer/LeftContainer";
import ChangeModModal from "./components/ModalComponent/ChangeModModal";
import EditModal from "./components/ModalComponent/EditModal";
import NewFolderModal from "./components/ModalComponent/NewFolderModal";
import PropertiesModal from "./components/ModalComponent/PropertiesModal";
import NotificationStack from "./components/notificationComponent/NotificationStack";
import RightContainer from "./components/rightContainer/RightContainer";

function App() {
  return (
    <div
      className="App"
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
    >
      <HeaderContainer />
      <LeftContainer />
      <Divider orientation="vertical" size="lg" />
      <RightContainer />
      <NewFolderModal />
      <EditModal />
      <ChangeModModal />
      <PropertiesModal />
      <NotificationStack />
    </div>
  );
}

export default App;
