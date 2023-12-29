import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtn.innerText = "Transcoding...";
  actionBtn.disabled = true;

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => console.log(message));
  const coreResponse = await fetch(`${baseURL}/ffmpeg-core.js`);
  const wasmResponse = await fetch(`${baseURL}/ffmpeg-core.wasm`);
  const coreBlob = new Blob([await coreResponse.text()], {
    type: "text/javascript",
  });
  const wasmBlob = new Blob([await wasmResponse.arrayBuffer()], {
    type: "application/wasm",
  });
  const coreURL = URL.createObjectURL(coreBlob);
  const wasmURL = URL.createObjectURL(wasmBlob);
  await ffmpeg.load({ coreURL, wasmURL });
  ffmpeg.writeFile(files.input, await fetchFile(videoFile)); //가상 컴퓨터에 파일을 생성해준다
  await ffmpeg.exec(["-i", files.input, "-r", "60", files.output]); //ffmpeg 명령어(자바스크립트 x)
  await ffmpeg.exec([
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    files.thumb,
  ]);

  const mp4File = await ffmpeg.readFile(files.output);
  const thumbFile = await ffmpeg.readFile(files.thumb);

  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
  const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

  const mp4URL = URL.createObjectURL(mp4Blob);
  const thumbURL = URL.createObjectURL(thumbBlob);

  downloadFile(mp4URL, "MyRecording.mp4");
  downloadFile(thumbURL, "MyThumbnail.jpg");

  ffmpeg.deleteFile(files.input);
  ffmpeg.deleteFile(files.output);
  ffmpeg.deleteFile(files.thumb);

  URL.revokeObjectURL(mp4URL); //주소를 메모리에서 지움
  URL.revokeObjectURL(thumbURL);
  URL.revokeObjectURL(videoFile);

  actionBtn.disabled = false;
  init();
  actionBtn.innerText = "Record Again";
  actionBtn.addEventListener("click", handleStart);
};

const handleStart = () => {
  actionBtn.innerText = "Recording";
  actionBtn.disabled = true;
  actionBtn.removeEventListener("click", handleStart);
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (event) => {
    // ondataavailable은 녹화가 멈추면 발생되는 이벤트
    videoFile = URL.createObjectURL(event.data); //브라우저 메모리에서만 가능한 URL을 만들어 준다
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
    actionBtn.innerText = "Download";
    actionBtn.disabled = false;
    actionBtn.addEventListener("click", handleDownload);
  };
  recorder.start();
  setTimeout(() => {
    recorder.stop();
  }, 3000);
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: {
      width: 1024,
      height: 576,
    },
  });
  video.srcObject = stream;
  video.play();
};

init();

actionBtn.addEventListener("click", handleStart);
