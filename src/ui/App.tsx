import { Button } from "@mui/base";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";

let mediaRecorder: MediaRecorder | undefined;
const recordedChunks: Blob[] = [];

const videoOptions = {
  mimeType: "video/webm; codecs=vp9",
};

function handleDataAvailable(e: BlobEvent) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

async function handleStop() {
  const blob = new Blob(recordedChunks, {
    type: videoOptions.mimeType,
  });
  console.log("yooo");
  // eslint-disable-next-line no-debugger
  debugger;
  const buffer = Buffer.from(await blob.arrayBuffer());
  const res = await ipcRenderer.invoke("popDialog", buffer);
  console.log("yooo");
}

function App() {
  const [selectedVideoSource, setselectedVideoSource] =
    useState<Electron.DesktopCapturerSource>();

  const stopRecording = () => {
    console.log({ mediaRecorder });
    mediaRecorder?.stop();
  };

  useEffect(() => {
    const handleSelection = async (
      screenData: NonNullable<typeof selectedVideoSource>
    ) => {
      setselectedVideoSource(screenData);
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: screenData.id,
          },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(
        constraints as any
      );
      const videoElement = document.getElementsByTagName("video")[0];
      videoElement.srcObject = stream;
      videoElement.play();

      //create the media recorder
      mediaRecorder = new MediaRecorder(stream, videoOptions);
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleStop;
    };

    ipcRenderer.on("selected-source", (_event, selectedScreen: string) => {
      const screenData = JSON.parse(selectedScreen);
      handleSelection(screenData);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      ipcRenderer.removeAllListeners("selected-source");
    };
  }, []);

  const getVideoSources = async () => {
    try {
      const res = await electron.screenRecordApi.getInputSources();
      const isPopped = await electron.screenRecordApi.popMenu(res);
      if (!isPopped) {
        alert("Could not pop menu");
      }
    } catch (err) {
      console.error({ err });
    }
  };
  const startRecording = async () => {
    mediaRecorder?.start();
  };

  return (
    <Box>
      <h1>Electron Screen Recorder</h1>
      <video
        style={{ width: "min(70vw, 70vh)", height: "min(70vw, 70vh)" }}
      ></video>
      <hr />
      <Button onClick={startRecording} disabled={!selectedVideoSource}>
        Start
      </Button>
      <Button onClick={stopRecording}>Stop</Button>
      <Box>
        <Button onClick={getVideoSources}>
          {selectedVideoSource?.name || "Choose A Screen"}
        </Button>
      </Box>
    </Box>
  );
}

export default App;
