import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";

let mediaRecorder: MediaRecorder | undefined;
const recordedChunks: Blob[] = [];

const videoOptions = {
  mimeType: "video/webm; codecs=vp9",
};

function handleDataAvailable(e: BlobEvent) {
  recordedChunks.push(e.data);
}

async function handleStop() {
  const blob = new Blob(recordedChunks, {
    type: videoOptions.mimeType,
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  await ipcRenderer.invoke("popDialog", buffer);
}

const btnProps: ButtonProps["sx"] = {
  color: "white",
  bgcolor: "green",
  ":hover": {
    bgcolor: "GrayText",
  },
};

function App() {
  const [selectedVideoSource, setselectedVideoSource] =
    useState<Electron.DesktopCapturerSource>();
  const [isRecording, setisRecording] = useState(false);
  const stopRecording = () => {
    mediaRecorder?.stop();
    setisRecording(false);
  };

  useEffect(() => {
    ipcRenderer.on("selected-source", (_event, selectedScreen: string) => {
      const screenData = JSON.parse(selectedScreen);
      setselectedVideoSource(screenData);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      ipcRenderer.removeAllListeners("selected-source");
    };
  }, []);

  useEffect(() => {
    const handleSelection = async (
      screenData: NonNullable<typeof selectedVideoSource>
    ) => {
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
        constraints as MediaStreamConstraints
      );
      const videoElement = document.getElementsByTagName("video")[0];
      videoElement.srcObject = stream;
      videoElement.play();

      //create the media recorder
      mediaRecorder = new MediaRecorder(stream, videoOptions);
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleStop;
    };
    if (selectedVideoSource) {
      handleSelection(selectedVideoSource);
    }
  }, [selectedVideoSource]);

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
    if (mediaRecorder) {
      mediaRecorder.start();
      setisRecording(true);
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "rgba(0, 0, 0, 0.05)",
        padding: "0.5rem",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Electron Screen Recorder</h1>
      <video
        style={{
          flexGrow: 1,
          alignSelf: "center",
          width: "80vw",
          padding: "1rem",
          border: "5px solid gray",
          borderRadius: "15px",
        }}
      >
        {!selectedVideoSource && <div>Select a video to preview</div>}
      </video>
      <hr />
      <Stack direction={"row"} gap="1rem" justifyContent={"center"}>
        <Button
          sx={{
            ...btnProps,
            bgcolor: selectedVideoSource ? "green" : "GrayText",
          }}
          onClick={startRecording}
          disabled={!selectedVideoSource}
        >
          Start
        </Button>
        <Button
          sx={{ ...btnProps, bgcolor: "red" }}
          disabled={!isRecording}
          onClick={stopRecording}
        >
          Stop
        </Button>
        <Box>
          <Button sx={{ ...btnProps }} onClick={getVideoSources}>
            {selectedVideoSource?.name || "Choose A Screen"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default App;
