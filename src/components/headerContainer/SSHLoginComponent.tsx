import {
  Button,
  Checkbox,
  FileInput,
  Group,
  Input,
  NativeSelect,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconKey, IconRefresh, IconX } from "@tabler/icons";
import axios from "axios";
import React, { useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { SSHAuthState } from "../../atoms/sshServerState";
import useApi from "../../hooks/useApi";
import useLogin from "../../hooks/useLogin";

const SSHLoginComponent = () => {
  const { reloadFiles } = useApi();
  const { ssh_login_handler } = useLogin();

  const [checkboxVal, setCheckboxVal] = useState<boolean>(false);
  //ssh ref
  const SERVERSELECT = useRef<HTMLSelectElement>(null);
  const SSHPORT = useRef<HTMLInputElement>(null);
  const SSHHOST = useRef<HTMLInputElement>(null);
  const SSHUSERNAME = useRef<HTMLInputElement>(null);
  const SSHPASSWORD = useRef<HTMLInputElement>(null);
  const SSHAuth = useRecoilValue(SSHAuthState);
  const [PKEY, setPKEY] = useState<File | null>(null);

  const ssh_login = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = SSHPORT.current ? SSHPORT.current.value : null;
    if (SERVERSELECT.current && SSHHOST.current && SSHUSERNAME.current) {
      if (
        (SERVERSELECT.current.value === "sftp" &&
          (SSHPASSWORD.current?.value || PKEY)) ||
        (SERVERSELECT.current.value === "ftp" && SSHPASSWORD.current?.value)
      )
        ssh_login_handler(
          SERVERSELECT.current.value,
          portNum,
          SSHHOST.current.value,
          SSHUSERNAME.current.value,
          SSHPASSWORD.current ? SSHPASSWORD.current.value : null,
          PKEY
        );
      else
        showNotification({
          title: "Input Error",
          message: "Invalid Input",
          color: "red",
          icon: <IconX />,
        });
    }
  };

  const serverSelect = [
    { value: "sftp", label: "SFTP" },
    { value: "ftp", label: "FTP" },
  ];

  return (
    <form
      onSubmit={(e) => {
        ssh_login(e);
      }}
    >
      <Group position="center">
        {/* <Badge size="lg">{connectionType}サーバ</Badge> */}
        <NativeSelect
          data={serverSelect}
          ref={SERVERSELECT}
          // onChange={(e) => setConnectionType(e.currentTarget.value)}
        />
        <Input placeholder="Port" ref={SSHPORT} style={{ maxWidth: "3vw" }} />
        <Input placeholder="Host" ref={SSHHOST} style={{ maxWidth: "7vw" }} />
        <Input
          placeholder="Username"
          ref={SSHUSERNAME}
          style={{ maxWidth: "5vw" }}
        />
        <div>
          <Checkbox
            checked={checkboxVal}
            onChange={() => {
              setCheckboxVal((prevVal) => {
                if (prevVal) setPKEY(null);
                else SSHPASSWORD.current!.value = "";
                return !prevVal;
              });
            }}
          />
          <Text size={11}>PK</Text>
        </div>
        {checkboxVal ? (
          <FileInput
            placeholder="Private Key"
            icon={<IconKey size={14} />}
            value={PKEY}
            onChange={setPKEY}
            style={{ width: "200px", maxWidth: "8vw" }}
          />
        ) : (
          <PasswordInput
            placeholder="Password"
            ref={SSHPASSWORD}
            style={{ width: "200px", maxWidth: "8vw" }}
          />
        )}
        <Button type="submit" value="Submit">
          接続
        </Button>
        <Button
          onClick={() => reloadFiles("ssh")}
          disabled={SSHAuth ? false : true}
        >
          <IconRefresh />
        </Button>
      </Group>
    </form>
  );
};

export default React.memo(SSHLoginComponent);
