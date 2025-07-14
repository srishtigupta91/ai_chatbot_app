import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import { QRCodeCanvas } from "qrcode.react";
import VendorDashboard from './VendorDashboard'; // Import the chat functionality
import './CompanyDetails.css'; // Import the CSS file for styling

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.24-seven.ai'; // Fallback to local URL if BACKEND_URL is not set
const NGROK_APP_URL = process.env.REACT_APP_NGROK_APP_URL || 'https://app.24-seven.ai'; // Use environment variable or fallback to NGROK_URL

const vapi = new Vapi('32b497fd-17a5-4d9b-9a86-3cfbb4dc4e11');

// let conversationTranscript = [];

const CompanyDetails = () => {
  const location = useLocation();
  const { company } = location.state; // Access the company data passed via state
  const [isCalling, setIsCalling] = useState(false); // Track if a call is ongoing
  const inactivityTimeoutRef = useRef(null); // Reference to track inactivity timeout
  const [uploading, setUploading] = useState(false); // Track if the upload is in progress
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDetails, setFollowUpDetails] = useState({
    eventName: '',
    dateTime: '',
    location: '',
    participants: '',
  });
  const [events, setEvents] = useState([]); // State to store events fetched from the API
  const [leads, setLeads] = useState([]); // State to store leads fetched from the API
  const [conversationTranscript, setConversationTranscript] = useState([]);
  const [leadObj, setLeadObj] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]); // For Vapi messages
  const [conversationStartTime, setConversationStartTime] = useState(null);
  const [conversationEndTime, setConversationEndTime] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Add this function inside your CompanyDetails component
  const fetchLeadInfoAfterQR = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/business_card/verify_info/webhook/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setLeadObj(data); // Show the fetched info in the UI
      } else {
        alert('Failed to fetch lead info.');
      }
    } catch (error) {
      alert('An error occurred while fetching lead info.');
    }
  };

  const qrUploadUrl = `${NGROK_APP_URL}/business-card/upload`;
  // Initialize Vapi with the provided API key
  useEffect(() => {
  if (!isCalling && conversationEndTime && conversationHistory.length > 0) {
    saveConversationHistory();
  }
  // eslint-disable-next-line
}, [isCalling, conversationEndTime]);

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/events/`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data); // Set the fetched events
        } else {
          console.error('Failed to fetch events:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

   // Fetch leads from the API
   useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/lead/`);
        if (response.ok) {
          const data = await response.json();
          setLeads(data); // Set the fetched leads
        } else {
          console.error('Failed to fetch leads:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };

    fetchLeads();
  }, []);

  // Generate a unique UUID for each business card upload
  const generateUUID = () => {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };

  // Add this function inside your CompanyDetails component
  const uuid = generateUUID();
  const scanBusinessCardWithCamera = async () => {
    // Create a video element to show the camera stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not supported in this browser or environment.');
      return;
    }
    const video = document.createElement('video');
    video.style.display = 'none';
    document.body.appendChild(video);

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      // Create a modal or prompt for the user to capture
      alert('Position your business card in front of the camera and click OK to capture.');

      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop the camera
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(video);

      // Convert canvas to blob (JPEG)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to capture image.');
          return;
        }

        // Prepare form data
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          alert('User ID not found. Please log in again.');
          return;
        }
        const formData = new FormData();
        formData.append('file', blob, `business_card_${userId}_${uuid}.jpg`);
        formData.append('user_id', userId);
        formData.append('company_id', company.company_id);

        try {
          setUploading(true);
          const response = await fetch(`${BACKEND_URL}/api/business_card/upload/`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            setLeadObj(data);
            alert('Business card scanned and details extracted!');
            setConversationTranscript((prev) => [
              ...prev,
              {
                timestamp: new Date().toISOString(),
                speaker: "User",
                text: "Business card has been scanned and details extracted.",
              },
            ]);
            setConversationHistory((prev) => [
              ...prev,
              {
                role: "user",
                text: "Business card has been scanned and details extracted.",
                timestamp: new Date().toISOString(),
              },
            ]);
          } else {
            alert('Failed to scan business card. Please try again.');
          }
        } catch (error) {
          console.error('Error during scan:', error);
          alert('An error occurred while scanning the business card.');
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg', 0.95);

    } catch (error) {
      alert('Could not access the camera.');
      if (video.parentNode) document.body.removeChild(video);
    }
  };

  const handleFollowUpChange = (e) => {
    const { name, value } = e.target;
    setFollowUpDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      event_name: followUpDetails.eventName,
      company_id: company.id,
      participants: followUpDetails.participants.split(',').map(Number), // Convert participants to an array of numbers
      meeting_datetime: followUpDetails.dateTime,
      meeting_location: followUpDetails.location,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/events/schedule-meeting/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Follow-Up created successfully!');
        setShowFollowUpForm(false); // Close the form after submission
      } else {
        console.error('Failed to create follow-up:', response.statusText);
        alert('Failed to create follow-up. Please try again.');
      }
    } catch (error) {
      console.error('Error creating follow-up:', error);
      alert('An error occurred while creating the follow-up.');
    }
  };

  const handlebusinesscardupload = (leadData) => {
    // Send the uploaded business card info to Vapi for verification
    vapi.on("send", (msg) => {
      msg({
        type: "add-message",
        message: {
          role: "system",
          prompt: `The business card has been uploaded. Please verify the following details with the customer: ${JSON.stringify(leadData)}.`,
        },
      });
    });
  };

  // Function to start the voice call
  const startVoiceCall = () => {
    console.log('Starting voice call...');
    setIsCalling(true);
    setConversationHistory([]); // Reset history for new call
    setConversationStartTime(new Date()); // Capture start time

    const assistantOptions = {
      name: "Jamie",
      firstMessage: "{{initial_greet}}",
      voice: {
        provider: "vapi",
        voiceId: "Elliot"
      },
      model: {
        model: "gpt-4.1",
        provider: "openai",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `[Identity]  
You are Jamie, a friendly and efficient voice assistant for a trade show lead management system. You assist leads interested in a company's products and services.

[Style]  
- Use a warm and engaging tone.  
- Speak clearly and naturally, offering a smooth conversational experience.  
- Be concise and direct while maintaining politeness.

[Response Guidelines]  
- Spell out numbers and use natural contractions (e.g., we’re, I’d).  
- Ask one question at a time, pausing for responses before proceeding.  
- Acknowledge user responses and show active listening by referencing previous answers.  

[Task & Goals]  
1. Greet the lead with: "Hello, I'm Jane from {{company_name}} at {{event_name}}. We're excited to share our products and services with you."  
  < wait for user response >  
2. Provide a brief overview of the company: "{{company_info}}"  
3. Briefly outline the products and product varieties available: "{{products_info}}", "{{product_varieties_info}}"  
4. Ask the lead to upload their business card: "Could you kindly upload your business card for our records?"  
  < wait for user response >  
5. Verify the business card details by invoking the 'business_card_details' function with the provided webhook URL.  
6. Confirm the outcome of the business card verification.  
  - If successful, proceed with scheduling the meeting.  
  - If verification fails, apologize and ask for alternate details: "I'm sorry, there seems to be an issue with the business card upload. Could you provide the participant email and your preferred datetime for the meeting?"  
7. Offer to schedule a meeting: "Would you like to schedule a meeting with one of our business representatives to discuss our offerings in detail?"  
  < wait for user response >  
8. If the lead wishes to schedule, use the 'scheduleMeeting' tool to arrange a suitable time. Add the participant "rini.srish@gmail.com" by default. If the business card verification failed, include additional email and datetime details provided by the lead. Confirm the meeting details once arranged.

[Error Handling / Fallback]  
- If the lead’s response is unclear, politely ask for clarification: "Could you please elaborate on that?"  
- In case of verification failure, say: "I'm sorry, there seems to be an issue with the verification. Could you provide the details manually or try uploading again?"  
- If scheduling the meeting fails, apologize and offer to try another time: "I'm sorry, there seems to be an issue scheduling the meeting. Can we try another time or arrange it manually?"`,
          }
          
        ],
        tools: [{
          "type": "apiRequest",
          "function": {
            "name": "api_request_tool",
            "parameters": {
              "type": "object",
              "properties": {},
              "required": []
            }
          },
          "name": "business_card_details",
          "url": `${BACKEND_URL}/api/business_card/verify_info/webhook/`,
          "method": "POST"
        },
        {
          "type": "google.calendar.event.create",
          "function": {
            "name": "scheduleMeeting",
            "description": "Schedule an appointment with customer for follow up with their queries. After providing all appointment details of customer such as meeting_datetime, meeting_location, participants, etc.\n\nNotes:\n- Use America/New_York as default Timezone.\n- All appointments are for 30 minutes.\n - Add rini.srish@gmail.com in all scheduled appointments by default.\n\n",
            "parameters": {
              "type": "object",
              "properties": {},
              "required": []
            }
          },
          "messages": [],
          "metadata": {
            "calendarId": "rini.srish@gmail.com",
            "timeZone": "America/New_York"
          }
        }
      ],
      }
    };
    // Set up the assistant overrides

    const assistantOverrides = {
      transcriber: {
        provider: "openai",
        model: "gpt-4o-transcribe",
        language: "en",
      },
      recordingEnabled: false,
      variableValues: {
        initial_greet: company.initial_greeting_prompt || "No initial greeting available",
        conversation_prompt: company.conversation_prompt || "No conversation prompt available",
        company_name: company.display_name || "Unknown Company",
        email: company.email || "Unknown Email",
        event_name: company.event_name || "Unknown Event",
        company_id: company.id || "Unknown Company ID",
        company_info: company.company_info || "No company info available",
        products_info: Array.isArray(company.product_info)
          ? company.product_info.map((product) => product.product_info).join(", ")
          : "No products available",
        lead_info_summary: leadObj
          ? JSON.stringify(leadObj) // or format as needed
          : "No lead info yet.",
        product_varieties_info: Array.isArray(company.product_ids)
          ? company.product_ids.join(", ")
          : "No product varieties available",
        lead_name: leadObj?.full_name || " ",
        lead_company: leadObj?.company || company.company_id || "Unknown Company ID",
        lead_location: leadObj?.location || company.company_address || "Unknown Location",
      }
    };

    // Start the voice assistant
    vapi.start(assistantOptions, assistantOverrides);

    // Log when speech starts
    vapi.on('speech-start', () => {
      console.log('Speech has started');
      resetInactivityTimeout();
      if (!conversationStartTime) setConversationStartTime(new Date());
    });

    vapi.on("message", (msg) => {
      if (msg.type === "transcript") {
        resetInactivityTimeout(); 
        console.log("Transcript message:", msg);

        // Check if the message is from the assistant
        if (msg.role === "assistant" && msg.transcriptType === "final") {
          console.log("Assistant's final response:", msg.transcript);

          // Append the assistant's response to the conversation transcript
          setConversationTranscript((prevTranscript) => [
            ...prevTranscript,
            {
              timestamp: new Date().toISOString(),
              speaker: "Assistant",
              text: msg.transcript,
            },
          ]);
        }

        // Check if the message is from the user
        if (msg.role === "user" && msg.transcriptType === "final") {
          console.log("User's final response:", msg.transcript);

          // Append the user's response to the conversation transcript
          setConversationTranscript((prevTranscript) => [
            ...prevTranscript,
            {
              timestamp: new Date().toISOString(),
              speaker: "User",
              text: msg.transcript,
            },
          ]);
        }

        // Optionally, log the entire conversation transcript for debugging
        console.log("Updated conversation transcript:", conversationTranscript);
      }
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        // Save to transcript for UI
        setConversationTranscript((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            speaker: msg.role === "assistant" ? "Agent" : "User",
            text: msg.transcript,
          },
        ]);
        // Save to conversationHistory for backend
        setConversationHistory((prev) => [
          ...prev,
          {
            role: msg.role === "assistant" ? "agent" : "user",
            text: msg.transcript,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });

    // Log when speech ends and reset inactivity timeout
    vapi.on('speech-end', () => {
      console.log('Speech has ended');
      resetInactivityTimeout();
    });

    // Handle call end and export transcript
    vapi.on('call-end', () => {
      console.log('Call has ended');
      setConversationEndTime(new Date()); // Capture end time
      saveConversationHistory();
      exportTranscript();
      setIsCalling(false);
    });
  };

  // Save conversation history to backend
  const saveConversationHistory = async () => {
    if (!conversationHistory.length) return;

    // Prepare messages as {user: "...", agent: "..."} arrays
    const messages = {};
    conversationHistory.forEach((msg, idx) => {
      if (!messages[msg.role]) messages[msg.role] = [];
      messages[msg.role].push(msg.text);
    });

    const leadId = followUpDetails.participants || (leads[0]?.id ?? null);

    const payload = {
      lead: leadId,
      summary: "Conversation summary", // You can generate or update this as needed
      messages,
      session_id: localStorage.getItem('session_id') || '',
      start_time: conversationStartTime ? conversationStartTime.toISOString() : null,
      end_time: conversationEndTime ? conversationEndTime.toISOString() : new Date().toISOString(),
      tags: [],
    };

    try {
      await fetch(`${BACKEND_URL}/api/conversation/save-chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Optionally alert or handle success
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('No speech detected for 50 seconds. Stopping the call...');
      stopVoiceCall();
    }, 50000); // 50 seconds
  };

  const stopVoiceCall = () => {
    console.log('Stopping voice call...');
    vapi.stop();
    vapi.on('call-end', () => {
        console.log('Call has ended');
        exportTranscript(); // Automatically export the transcript when the call ends
      });
    setIsCalling(false);

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  // Format the initial greeting prompt with available content
  const formattedGreeting = company.initial_greeting_prompt
    .replace('{company_name}', company.display_name || 'Unknown Company')
    .replace('{event_name}', company.event_name || 'Unknown Event')
    .replace('{company_info}', company.company_info || 'No company info available')
    .replace('{products_info}', company.product_info?.join(', ') || 'No products available')
    .replace('{lead_info_summary}', 'No lead info yet.')
    .replace(
      '{product_varieties_info}',
      Array.isArray(company.product_ids)
        ? company.product_ids.map((p) => p.product_varieties).join(', ')
        : 'No product varieties available'
    )
    .replace('{lead_name}', ' ')
    .replace('{lead_company}', company.company_id || 'Unknown Company ID')
    .replace('{lead_location}', company.company_address || 'Unknown Location');

  const uploadBusinessCard = async (event) => {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    formData.append('company_id', company.company_id);

    try {
      setUploading(true);
      const response = await fetch(`${BACKEND_URL}/api/business_card/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLeadObj(data);
        alert('Business card uploaded successfully!');

        // Notify agent in chat UI and history
        setConversationTranscript((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            speaker: "User",
            text: "Business card has been uploaded.",
          },
        ]);
        setConversationHistory((prev) => [
          ...prev,
          {
            role: "user",
            text: "Business card has been uploaded.",
            timestamp: new Date().toISOString(),
          },
        ]);

        handlebusinesscardupload(data);
      } 
    } catch (error) {
      console.error('Error during upload:', error);
      alert('An error occurred while uploading the business card.');
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  };

  const exportTranscript = () => {
    if (conversationTranscript.length === 0) {
      alert('No transcript available to export.');
      return;
    }

    const transcriptText = conversationTranscript
      .map((msg) => `${msg.timestamp || ''} ${msg.speaker || 'Agent'}: ${msg.text}`)
      .join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'conversation_transcript.txt';
    link.click();

    URL.revokeObjectURL(url);
   };

  return (
    <div className="company-details-container">
      <div className="header">
        <h1>Trade Show Lead Management</h1>
        <p>CMPL Mumbai Expo 2025</p>
      </div>
      <div className="content">
        {/* Left Side Features */}
        <div className="features-section">
          <button
            className="feature-button"
            onClick={() => (isCalling ? stopVoiceCall() : startVoiceCall())}
          >
            {isCalling ? 'End Call' : 'Speak to Agent'}
          </button>
          <button
            className="feature-button"
            onClick={() => setShowQR(true)}
          >
            Upload via QR Code
          </button>
          <label className="feature-button">
            Upload Business Card
            <input
              type="file"
              accept="image/*"
              onChange={uploadBusinessCard}
              style={{ display: 'none' }}
            />
          </label>
          <label className="feature-button">
            Scan Business Card with Camera
            <button className="feature-button" onClick={scanBusinessCardWithCamera}>
            </button>
          </label>
          <button
            className="feature-button"
            onClick={() => setShowFollowUpForm((prevState) => !prevState)}
          >
            Create Follow-Up
          </button>
        </div>

        {/* Follow-Up Form */}
        {showFollowUpForm && (
          <form onSubmit={handleFollowUpSubmit}>
            <label className="form-label">
            Event Name:
              <select
                name="eventName"
                value={followUpDetails.eventName}
                onChange={handleFollowUpChange}
                required
                className="form-input"
              >
                <option value="">Select an Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.name}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              DateTime:
              <input
                type="datetime-local"
                name="dateTime"
                value={followUpDetails.dateTime}
                onChange={handleFollowUpChange}
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              Location:
              <input
                type="text"
                name="location"
                value={followUpDetails.location}
                onChange={handleFollowUpChange}
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
            Participants:
              <select
                name="participants"
                value={followUpDetails.participants}
                onChange={handleFollowUpChange}
                required
                className="form-input"
              >
                <option value="">Select a Lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.full_name} ({lead.email})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="form-button">
              Add to Calendar
            </button>
            <button
              type="button"
              onClick={() => setShowFollowUpForm(false)}
              className="form-button"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Middle Section: Vendor Dashboard */}
        <div className="vendor-dashboard-section">
          <VendorDashboard
            companyId={company.company_id}
            initialGreeting={
              conversationTranscript.length > 0
                ? conversationTranscript.map((msg) => `${msg.speaker}: ${msg.text}`).join('\n')
                : formattedGreeting
            }
            conversationTranscript={conversationTranscript}
          />
        </div>

        {/* Right Side: Conversation Overview */}
        <div className="conversation-overview-section">
          <div className="overview-card">
            <h3>Conversation Overview</h3>
            <p><strong>Company Name:</strong> {company.display_name}</p>
            <p><strong>Type:</strong> {company.company_type === 'product' ? 'Product Company' : 'Service Provider'}</p>
            <p><strong>Event Name:</strong> {company.event_name || 'Unknown Event'}</p>
            <p><strong>Product Varieties:</strong></p>
            <ul>
              {Array.isArray(company.product_info) &&
                company.product_info.map((product) => (
                  <li key={product.product_id}>{product.product_varieties}</li>
                ))}
            </ul>
          </div>

          {leadObj && (
            <div className="overview-card" style={{ marginTop: '20px', background: '#1e293b' }}>
              <h3>Customer Details</h3>
              {Object.entries(leadObj).map(([key, value]) => (
                <p key={key}>
                  <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Elements for Voice Call */}
      <audio id="remote-audio" autoPlay></audio>
      {showQR && (
        <div className="qr-modal">
          <div className="qr-modal-content">
            <h2>Scan to Upload Business Card</h2>
            <QRCodeCanvas value={qrUploadUrl} />
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button
                onClick={async () => {
                  await fetchLeadInfoAfterQR();
                  setShowQR(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;