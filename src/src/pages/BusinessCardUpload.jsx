import React, { useState } from "react";

const BACKEND_URL = process.env.REACT_API_NGROK_URL || 'http://localhost:8000';

const BusinessCardUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccess(false);
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/business_card/upload/`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setSuccess(true);
        setFile(null);
      } else {
        setError("Failed to upload. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1e293b",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#334155",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        width: "90%",
        maxWidth: "400px"
      }}>
        <h2 style={{ marginBottom: "1rem" }}>Upload Your Business Card</h2>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ marginBottom: "1rem", width: "100%" }}
          />
          <button
            type="submit"
            disabled={uploading}
            style={{
              width: "100%",
              padding: "10px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {success && <p style={{ color: "#22c55e", marginTop: "1rem" }}>Upload successful!</p>}
        {error && <p style={{ color: "#ef4444", marginTop: "1rem" }}>{error}</p>}
      </div>
    </div>
  );
};

export default BusinessCardUpload;