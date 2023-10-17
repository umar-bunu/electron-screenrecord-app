// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { IPCKeys } from "./definitions/electron";

const Electron: Omit<typeof electron, "ipcRenderer"> = {
  screenRecordApi: {
    async getInputSources() {
      const res = await ipcRenderer.invoke(IPCKeys.getInputSources);
      return res;
    },
    async popMenu(param: Electron.DesktopCapturerSource[]) {
      try {
        const res: boolean = await ipcRenderer.invoke(
          IPCKeys.popMenu,
          JSON.stringify(param)
        );
        return res;
      } catch (err) {
        console.error("renderprocess:: error while pop menu: ", err);
        return err;
      }
    },
  },
};

const temp: Pick<
  typeof ipcRenderer,
  "on" | "send" | "invoke" | "removeAllListeners" | "once"
> = {
  on(channel, listener) {
    return ipcRenderer.on(channel, listener);
  },
  once(channel, listener) {
    return ipcRenderer.once(channel, listener);
  },
  send: (channel, data) => {
    // Add any necessary validation or sanitation of data
    ipcRenderer.send(channel, data);
  },
  invoke: (channel, data) => {
    // Add any necessary validation or sanitation of data
    return ipcRenderer.invoke(channel, data);
  },
  removeAllListeners(channel) {
    return ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("ipcRenderer", temp);
contextBridge.exposeInMainWorld("electron", Electron);
contextBridge.exposeInMainWorld("Buffer", {
  from: Buffer.from,
});
