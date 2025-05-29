import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import VendorDashboard from './VendorDashboard'; // Import the chat functionality
import './CompanyDetails.css'; // Import the CSS file for styling

const vapi = new Vapi('1b0458ab-2109-427f-86cb-3205bf62e457');

let conversationTranscript = [];

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

  // ...existing code...

  // Voiceflow widget integration
  useEffect(() => {
    setConversationTranscript([]);
    // Prevent multiple script injections
    if (document.getElementById('voiceflow-widget')) return;

    const script = document.createElement('script');
    script.id = 'voiceflow-widget';
    script.type = 'text/javascript';
    script.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
    script.onload = function () {
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.load({
          verify: { projectID: '6835f0e500c7424ccd26e1e6' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'development',
          voice: {
            url: "https://runtime-api.voiceflow.com"
          }
        });
      }
    };
    document.body.appendChild(script);

    // Optional: Cleanup script on unmount
    return () => {
      document.getElementById('voiceflow-widget')?.remove();
      // Remove widget container if needed
      document.getElementById('vf-chat-widget-container')?.remove();
    };
  }, []);

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:8000/events/');
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
        const response = await fetch('http://localhost:8000/lead/');
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
      const response = await fetch('http://localhost:8000/events/schedule-meeting/', {
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

  const handlebusinesscardupload = () => {
    // Function to log the user action
    vapi.send({
      type: "add-message",
      message: {
        role: "system",
        content: "The user has pressed the button, say peanuts",
      },
    });
  };

  // Function to start the voice call
  const startVoiceCall = () => {
    console.log('Starting voice call...');
    setIsCalling(true);

    const assistantOptions = {
      name: "jamie",
      firstMessage: "Hello, I am Jamie from {{company_name}}, how can I help you?",
      voice: {
        provider: "vapi",
        voiceId: "Elliot"
      },
      model: {
        model: "gpt-4.1",
        provider: "openai",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. Your name is Jamie. You are a voice assistant for a trade show lead management system. You will be speaking to a lead who is interested in the company's products and services. The company name is {{company_name}}, and the event name is {{event_name}}. The company information is as follows: {{company_info}}. The products available are: {{products_info}}. The lead information summary is: {{lead_info_summary}}. The product varieties available are: {{product_varieties_info}}. You need to ask the lead to upload their business card. Then you need to verify the business card information via the 'verify_business_card_details' function using the provided webhook URL. You will be speaking to the lead in English.`
          }
        ],
        tools: [{
          "type": "mcp",
          "function": {
            "name": "verify_business_card_details",
            "description": "You need to verify the uploaded business card information during the call. Once user uploaded the business card on the application. Webhook will retrieve the information and pass the details for the verification.",
            "parameters": {
              "type": "object",
              "properties": {},
              "required": []
            }
          },
          "server": {
            "url": "https://975f-2601-188-c100-8070-5d-2226-d26a-3cda.ngrok-free.app/business_card/verify_info/webhook/",
            "headers": {}
          }
        }],
      }
    };
    // Set up the assistant overrides

    const assistantOverrides =  {
      transcriber: {
        provider: "openai",
        model: "gpt-4o-transcribe",
        language: "en",
      },
      recordingEnabled: false,
      variableValues: {
        company_name: company.display_name || "Unknown Company",
        event_name: company.event_name || "Unknown Event",
        company_id: company.id || "Unknown Company ID",
        company_info: company.company_info || "No company info available",
        products_info: Array.isArray(company.product_info)
          ? company.product_info.map((product) => product.product_varieties).join(", ")
          : "No products available",
        lead_info_summary: "No lead info yet.",
        product_varieties_info: Array.isArray(company.product_ids)
          ? company.product_ids.join(", ")
          : "No product varieties available",
        lead_name: " ",
        lead_company: company.company_id || "Unknown Company ID",
        lead_location: company.company_address || "Unknown Location",
      }
    };

    // Start the voice assistant
    vapi.start(assistantOptions, assistantOverrides);

    // Log when speech starts
    vapi.on('speech-start', () => {
      console.log('Speech has started');
    });

    vapi.on("message", (msg) => {
      if (msg.type === "transcript") {
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
    });

    // Log when speech ends and reset inactivity timeout
    vapi.on('speech-end', () => {
      console.log('Speech has ended');
      resetInactivityTimeout();
    });

    // Handle call end and export transcript
    vapi.on('call-end', () => {
      console.log('Call has ended');
      exportTranscript();
    });
  };

  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('No speech detected for 30 seconds. Stopping the call...');
      stopVoiceCall();
    }, 30000); // 30 seconds
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
    const fileInput = event.target; // Reference to the file input element
    const file = fileInput.files[0]; // Get the selected file

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const userId = localStorage.getItem('user_id'); // Retrieve user_id from localStorage
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
      const response = await fetch('http://localhost:8000/business_card/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Business card uploaded successfully!');
      } else {
        console.error('Failed to upload business card:', response.statusText);
        alert('Failed to upload business card. Please try again.');
      }
    } catch (error) {
      console.error('Error during upload:', error);
      alert('An error occurred while uploading the business card.');
    } finally {
      setUploading(false);
      fileInput.value = ''; // Reset the file input value to allow re-selection of the same file
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
            {isCalling ? 'End Call' : 'Speak to Vanya'}
          </button>
          <label className="feature-button">
            Upload Business Card
            <input
              type="file"
              accept="image/*"
              onChange={uploadBusinessCard}
              onClick={handlebusinesscardupload}
              style={{ display: 'none' }}
            />
          </label>
          <button className="feature-button">Export Transcript</button>
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
            conversationTranscript={conversationTranscript} // Pass the transcript as a prop
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
        </div>
      </div>

      {/* Audio Elements for Voice Call */}
      <audio id="remote-audio" autoPlay></audio>
    </div>
  );
};

export default CompanyDetails;