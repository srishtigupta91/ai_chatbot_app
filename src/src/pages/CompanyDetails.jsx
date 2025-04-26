import React, { useState, useRef } from 'react';
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

  const startVoiceCall = () => {
    console.log('Starting voice call...');
    setIsCalling(true);

    const assistantOptions = {
      name: "ABC Rooster",
      firstMessage: "ABC Rooster speaking, how can I help you?",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are Jane, a friendly and professional AI assistant representing ${company.display_name} at the ${
              Array.isArray(company.event_name) ? company.event_name.join(', ') : 'Unknown Event'
            } trade show.
Your human colleagues are currently assisting other visitors. Your primary goal is to warmly welcome visitors to the booth,
introduce yourself, and understand their initial reason for visiting. Keep your interaction concise and engaging.

Current conversation stage: GREETING

Your tasks:
1. Greet the visitor warmly: "Hey there! Welcome to ${company.display_name}!"
2. Introduce yourself: "I'm Jane, your AI assistant here at the booth."
3. Explain colleague availability: "Our team is currently engaged, but I'd love to assist you."
4. Ask their reason for visiting the event: "What brings you to ${
            Array.isArray(company.event_name) ? company.event_name.join(', ') : 'this event'
          } today?"

Company Background (for context, do not recite):
${company.company_info || 'No company info available'}`,
          },
        ],
      },
    };

    // Start the voice assistant
    vapi.start(assistantOptions);

    // Log when speech starts
    vapi.on('speech-start', () => {
      console.log('Speech has started');
    });

    vapi.on("message", (msg) => {
        if (msg.type === "transcript") {
          // Append the transcript message to the conversationTranscript array
          conversationTranscript.push(msg);
        }
      });

    // Log when speech ends and reset inactivity timeout
    vapi.on('speech-end', () => {
      console.log('Speech has ended');
      resetInactivityTimeout();
    });

    // Stop the call if no speech is detected for 30 seconds
    resetInactivityTimeout();
    // Handle call end and export transcript
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
    .replace('{event_name}', Array.isArray(company.event_name) ? company.event_name.join(', ') : 'Unknown Event')
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
              style={{ display: 'none' }}
            />
          </label>
          <button className="feature-button">Export Transcript</button>
          <button className="feature-button">Create Follow-Up</button>
        </div>

        {/* Middle Section: Vendor Dashboard */}
        <div className="vendor-dashboard-section">
          <VendorDashboard
            companyId={company.company_id}
            initialGreeting={formattedGreeting} // Pass the formatted greeting
          />
        </div>

        {/* Right Side: Conversation Overview */}
        <div className="conversation-overview-section">
          <div className="overview-card">
            <h3>Conversation Overview</h3>
            <p><strong>Company Name:</strong> {company.display_name}</p>
            <p><strong>Type:</strong> {company.company_type === 'product' ? 'Product Company' : 'Service Provider'}</p>
            <p><strong>Event Name:</strong> {Array.isArray(company.event_name) ? company.event_name.join(', ') : 'Unknown Event'}</p>
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