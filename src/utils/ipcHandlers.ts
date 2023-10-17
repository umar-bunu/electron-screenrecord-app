import {
  ipcMain,
  desktopCapturer,
  Menu,
  BrowserWindow,
  dialog,
  Notification,
} from "electron";
import { IPCKeys } from "../../src/definitions/electron";
import { writeFile } from "fs";
const windows: {
  mainWindow: null | BrowserWindow;
} = { mainWindow: null };

const avilableHandlers: Record<keyof typeof IPCKeys, () => void> = {
  [IPCKeys["getInputSources"]]: () => {
    ipcMain.handle(IPCKeys.getInputSources, async () => {
      const inputSources = await desktopCapturer.getSources({
        types: ["screen", "window"],
      });
      return inputSources;
    });
  },
  [IPCKeys.popMenu]: () => {
    ipcMain.handle(IPCKeys.popMenu, async (event, params: string) => {
      const inputSources: Electron.DesktopCapturerSource[] = JSON.parse(params);

      const videoOptionsmenu = Menu.buildFromTemplate(
        inputSources.map((source) => ({
          label: source.name,
          icon: source.appIcon,
          click: () => {
            windows.mainWindow?.webContents?.send(
              "selected-source",
              JSON.stringify(source)
            );
          },
        }))
      );
      videoOptionsmenu.popup();

      return true;
    });
  },
  [IPCKeys.popDialog]: () => {
    ipcMain.handle(IPCKeys.popDialog, async (_event, buffer: Buffer) => {
      const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save Video",
        defaultPath: `screenrecorder-${Date.now()}.webm`,
      });
      writeFile(filePath, buffer, () => {
        console.log("file succesffully saved");
      });
    });
  },
};

export default (
  props: Partial<Record<keyof typeof IPCKeys, boolean>>,
  window: BrowserWindow
) => {
  windows.mainWindow = window;
  Object.entries(props).forEach(
    ([eachKey, val]: [keyof typeof IPCKeys, boolean]) => {
      if (val) {
        {
          avilableHandlers[eachKey]();
        }
      }
    }
  );
};
