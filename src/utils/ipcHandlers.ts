import {
  ipcMain,
  desktopCapturer,
  Menu,
  BrowserWindow,
  dialog,
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
      console.log("main process:: Input sources: ", inputSources);
      return inputSources;
    });
  },
  [IPCKeys.popMenu]: () => {
    ipcMain.handle(IPCKeys.popMenu, async (event, params: string) => {
      console.log("mainProcess::popup event called: ", { event, params });
      const inputSources: Electron.DesktopCapturerSource[] = JSON.parse(params);

      const videoOptionsmenu = Menu.buildFromTemplate(
        inputSources.map((source) => ({
          label: source.name,
          icon: source.appIcon,
          click: () => {
            console.log("first");
            windows.mainWindow?.webContents?.send(
              "selected-source",
              JSON.stringify(source)
            );
          },
        }))
      );
      videoOptionsmenu.popup();
      console.log("mainprocess:: video options popped");

      return true;
    });
  },
  [IPCKeys.popDialog]: () => {
    ipcMain.handle(IPCKeys.popDialog, async (_event, buffer: Buffer) => {
      console.log("mainProcess:popDialog event called: ", {});
      const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save Video",
        defaultPath: `screenrecorder-${Date.now()}.webm`,
      });
      writeFile(filePath, buffer, () => console.log("Video Saved Succesfully"));
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
          console.log("mainProcess:: Added Ipc handler for: ", eachKey);
        }
      }
    }
  );
};
