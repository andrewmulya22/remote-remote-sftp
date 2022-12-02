import { Badge, Button, Group, Input, PasswordInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons";
import React, { useRef } from "react";
import useApi from "../../hooks/useApi";
import useLogin from "../../hooks/useLogin";

const APILoginComponent = () => {
  const { reloadFiles } = useApi();
  const { api_login_handler } = useLogin();

  //ssh ref
  const APIHOST = useRef<HTMLInputElement>(null);
  const APIUSERNAME = useRef<HTMLInputElement>(null);
  const APIPASSWORD = useRef<HTMLInputElement>(null);

  const api_login = (e: React.FormEvent) => {
    e.preventDefault();
    if (APIHOST.current) {
      let hostname = APIHOST.current.value;
      // remove / if exists
      hostname = hostname.replace(/\/$/, "");
      if (/^\d+/i.test(hostname)) hostname = "http://localhost:" + hostname;
      else if (!/^https?:\/\//i.test(hostname)) hostname = "http://" + hostname;
      if (APIUSERNAME.current && APIPASSWORD.current)
        api_login_handler(
          hostname,
          APIUSERNAME.current.value,
          APIPASSWORD.current.value
        );
      else api_login_handler(hostname);
    }
  };

  return (
    <form onSubmit={(e) => api_login(e)}>
      <Group position="center">
        <Badge size="lg">APIサーバ</Badge>
        <Input
          placeholder="Host or Port Number"
          ref={APIHOST}
          style={{ maxWidth: "8vw" }}
        />
        <Input
          placeholder="Username"
          style={{ maxWidth: "8vw" }}
          ref={APIUSERNAME}
        />
        <PasswordInput
          placeholder="Password"
          ref={APIPASSWORD}
          style={{ maxWidth: "8vw", width: "200px" }}
        />
        <Button type="submit" value="Submit">
          接続
        </Button>
        <Button onClick={() => reloadFiles("api")}>
          <IconRefresh />
        </Button>
      </Group>
    </form>
  );
};

export default React.memo(APILoginComponent);
