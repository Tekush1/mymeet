import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";

// Connect to deployed backend
const socket = io("https://mymeet-server.onrender.com");

function Room() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const [stream, setStream] = useState();

  useEffect(() => {
    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        userVideo.current.srcObject = currentStream;

        // Join room
        socket.emit("join-room", roomId, socket.id);

        // When a new user connects
        socket.on("user-connected", userId => {
          const peer = createPeer(userId, socket.id, currentStream);
          peersRef.current.push({ peerID: userId, peer });
          setPeers(prev => [...prev, peer]);
        });

        // Receive signaling data
        socket.on("signal", ({ from, signal }) => {
          let item = peersRef.current.find(p => p.peerID === from);
          if (!item) {
            const peer = addPeer(signal, from, currentStream);
            peersRef.current.push({ peerID: from, peer });
            setPeers(prev => [...prev, peer]);
          } else {
            item.peer.signal(signal);
          }
        });
      })
      .catch(err => {
        console.error("Cannot access camera/microphone", err);
        alert("Please allow camera and microphone permissions and refresh the page.");
      });

    // Handle user disconnect
    socket.on("user-disconnected", userId => {
      const peerObj = peersRef.current.find(p => p.peerID === userId);
      if (peerObj) {
        peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
        setPeers(prev => prev.filter(p => p.peerID !== userId));
      }
    });

    return () => socket.disconnect();
  }, [roomId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" } // global STUN server
        ]
      }
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: userToSignal, from: callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ]
      }
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: callerID, from: socket.id, signal });
    });

    return peer;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Meeting Code: {roomId}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <video
          ref={userVideo}
          muted
          autoPlay
          playsInline
          style={{ width: "300px", margin: "10px", border: "2px solid #333" }}
        />
        {peers.map((peer, index) => (
          <Video key={index} peer={peer} />
        ))}
      </div>
    </div>
  );
}

function Video({ peer }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{ width: "300px", margin: "10px", border: "2px solid #555" }}
    />
  );
}

export default Room;
