import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomCode.trim() === "") return alert("Enter a meeting code!");
    navigate(`/room/${roomCode}`);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🎥 MyMeet</h1>
      <input
        type="text"
        placeholder="Enter Meeting Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "18px",
          borderRadius: "8px",
          border: "1px solid gray",
        }}
      />
      <br /><br />
      <button
        onClick={joinRoom}
        style={{
          padding: "10px 20px",
          fontSize: "18px",
          borderRadius: "8px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
        }}
      >
        Join Room
      </button>
    </div>
  );
}

export default JoinRoom;
