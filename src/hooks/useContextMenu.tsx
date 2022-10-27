import React, { useEffect, useCallback, useState } from "react";
import { useRecoilState } from "recoil";
import { contextMenuState } from "../atoms/contextMenuState";

export default function useContextMenu(
  server: "ssh" | "api" | "",
  loc: string
) {
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [show, setShow] = useState<boolean>(false);
  const [CMState, setCMState] = useRecoilState(contextMenuState);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setAnchorPoint({ x: event.pageX, y: event.pageY });
      setShow(true);
      setCMState({
        server: server,
        fileLoc: loc,
      });
    },
    [setShow, setAnchorPoint, loc]
  );

  const handleClick = useCallback(() => show && setShow(false), [show]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    if (CMState.server !== server || CMState.fileLoc !== loc) handleClick();
    return () => {
      document.removeEventListener("click", handleClick);
    };
  });

  return { anchorPoint, show, handleContextMenu };
}
