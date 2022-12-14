import {
  Button,
  Checkbox,
  FileInput,
  Group,
  Input,
  NativeSelect,
  PasswordInput,
  Text,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconKey, IconRefresh, IconX } from "@tabler/icons";
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
  const [SERVERSELECT, setSERVERSELECT] = useState("sftp");
  const SSHPORT = useRef<HTMLInputElement>(null);
  const SSHHOST = useRef<HTMLInputElement>(null);
  const SSHUSERNAME = useRef<HTMLInputElement>(null);
  const SSHPASSWORD = useRef<HTMLInputElement>(null);
  const SSHAuth = useRecoilValue(SSHAuthState);
  const [PKEY, setPKEY] = useState<File | null>(null);

  const ssh_login = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = SSHPORT.current ? SSHPORT.current.value : null;
    if (SERVERSELECT && SSHHOST.current && SSHUSERNAME.current) {
      if (
        (SERVERSELECT === "sftp" && (SSHPASSWORD.current?.value || PKEY)) ||
        (SERVERSELECT === "ftp" && SSHPASSWORD.current?.value)
      )
        ssh_login_handler(
          SERVERSELECT,
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

  const serverSelectData = [
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
        {/* <Badge size="lg">{connectionType}?????????</Badge> */}
        <NativeSelect
          data={serverSelectData}
          value={SERVERSELECT}
          onChange={(e) => setSERVERSELECT(e.target.value)}
          // onChange={(e) => setConnectionType(e.currentTarget.value)}
        />
        <Input placeholder="Port" ref={SSHPORT} style={{ maxWidth: "3vw" }} />
        <Input placeholder="Host" ref={SSHHOST} style={{ maxWidth: "7vw" }} />
        <Input
          placeholder="Username"
          ref={SSHUSERNAME}
          style={{ maxWidth: "5vw" }}
        />
        {SERVERSELECT === "sftp" ? (
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
        ) : null}
        {checkboxVal && SERVERSELECT === "sftp" ? (
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
          ??????
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
