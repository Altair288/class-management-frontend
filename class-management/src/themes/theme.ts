import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  // 你的主题配置
  shadows: [
    "none",
    "0px 1px 3px rgba(0,0,0,0.2), 0px 1px 1px rgba(0,0,0,0.14), 0px 2px 1px -1px rgba(0,0,0,0.12)",
    "0px 1px 5px rgba(0,0,0,0.2), 0px 2px 2px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)",
    "0px 4px 5px rgba(0,0,0,0.2), 0px 1px 10px rgba(0,0,0,0.14), 0px 2px 4px -1px rgba(0,0,0,0.12)",
    "0px 6px 10px rgba(0,0,0,0.2), 0px 1px 18px rgba(0,0,0,0.14), 0px 3px 5px -1px rgba(0,0,0,0.12)",
    "0px 8px 10px rgba(0,0,0,0.2), 0px 3px 14px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.12)",
    "0px 9px 12px rgba(0,0,0,0.2), 0px 3px 16px rgba(0,0,0,0.14), 0px 5px 6px -3px rgba(0,0,0,0.12)",
    "0px 12px 17px rgba(0,0,0,0.2), 0px 5px 22px rgba(0,0,0,0.14), 0px 7px 8px -4px rgba(0,0,0,0.12)",
    // ...补全到25或更多
  ],
});

export default theme;