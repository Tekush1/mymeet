import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:3000");

function Room() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const videoGrid = useRef();

  useEffect(() => {
    const userId = Math.floor(Math.random() * 10000);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        userVideo.current.srcObject = stream;
        socket.emit("join-room", roomId, userId);

        socket.on("user-connected", (id) => {
          console.log("User connected:", id);
          const peer = createPeer(id, socket.id, stream);
          peersRef.current.push({ peerID: id, peer });
          setPeers(users => [...users, peer]);
        });

        socket.on("user-disconnected", id => {
          const peerObj = peersRef.current.find(p => p.peerID === id);
          if (peerObj) peerObj.peer.destroy();
          peersRef.current = peersRef.current.filter(p => p.peerID !== id);
          setPeers(users => users.filter(p => p.peerID !== id));
        });

        socket.on("signal", ({ from, signal }) => {
          const peerObj = peersRef.current.find(p => p.peerID === from);
          if (peerObj) {
            peerObj.peer.signal(signal);
          } else {
            const peer = addPeer(signal, from, stream);
            peersRef.current.push({ peerID: from, peer });
            setPeers(users => [...users, peer]);
          }
        });
      });

    return () => socket.disconnect();
  }, [roomId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: userToSignal, from: callerID, signal });
    });

    peer.on("stream", remoteStream => {
      const video = document.createElement("video");
      video.srcObject = remoteStream;
      video.autoplay = true;
      video.playsInline = true;
      video.width = 300;
      video.style.border = "2px solid #333";
      video.style.margin = "10px";
      videoGrid.current.appendChild(video);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: callerID, from: socket.id, signal });
    });

    peer.on("stream", remoteStream => {
      const video = document.createElement("video");
      video.srcObject = remoteStream;
      video.autoplay = true;
      video.playsInline = true;
      video.width = 300;
      video.style.border = "2px solid #333";
      video.style.margin = "10px";
      videoGrid.current.appendChild(video);
    });

    peer.signal(incomingSignal);
    return peer;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Meeting Code: {roomId}</h2>
      <div ref={videoGrid}>
        <video
          ref={userVideo}
          muted
          autoPlay
          playsInline
          style={{
            width: "300px",
            border: "2px solid #333",
            borderRadius: "10px",
            margin: "10px",
          }}
        ></video>
      </div>
    </div>
  );
}

export default Room;
