const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tahsilatDesktop", {
  isDesktop: true,
  print: () => ipcRenderer.invoke("desktop-print"),
  closeWindow: () => ipcRenderer.invoke("desktop-close-window")
});
