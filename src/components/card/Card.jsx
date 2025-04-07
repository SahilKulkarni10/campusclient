import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./card.scss";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";

function Card({ item }) {
  const { currentUser } = useContext(AuthContext);
  const [isSaved, setIsSaved] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null); // null, "going", "maybe", "not-going"
  const [showRsvpOptions, setShowRsvpOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const navigate = useNavigate();

  // Format the date if it exists
  const formattedDate = item.date ? format(new Date(item.date), "MMM dd, yyyy") : null;

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      alert("Please log in to save this event");
      return;
    }
    
    try {
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleRSVP = async (status) => {
    if (!currentUser) {
      alert("Please log in to RSVP");
      return;
    }
    
    try {
      setRsvpStatus(status);
      setShowRsvpOptions(false);
    } catch (error) {
      console.error("Error updating RSVP:", error);
    }
  };

  const handleShare = (platform) => {
    const url = `${window.location.origin}/${item.id}`;
    const title = item.title;
    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        setShowShareOptions(false);
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
    setShowShareOptions(false);
  };

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determine the route based on the event category
    let route = `/event/${item.id}`; // Default route
    
    if (item.category) {
      const category = item.category.toLowerCase();
      if (category === 'hackathon') {
        route = `/hackathon/${item.id}`;
      } else if (category === 'seminar') {
        route = `/seminar/${item.id}`;
      } else if (category === 'workshop') {
        route = `/workshop/${item.id}`;
      }
    }
    
    navigate(route);
  };

  const getRsvpStatusText = () => {
    switch (rsvpStatus) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not-going':
        return 'Not Going';
      default:
        return 'RSVP';
    }
  };

  const getRsvpStatusClass = () => {
    switch (rsvpStatus) {
      case 'going':
        return 'status-going';
      case 'maybe':
        return 'status-maybe';
      case 'not-going':
        return 'status-not-going';
      default:
        return '';
    }
  };

  return (
    <div className="card">
      <Link to={`/product/${item.id}`} className="cardLink">
        <div className="imageContainer">
          {item.images && item.images.length > 0 && (
            <img src={item.images[0]} alt={item.title} />
          )}
          {item.price > 0 && <span className="price">₹{item.price}</span>}
          {item.category && <span className="category">{item.category}</span>}
        </div>
        <div className="textContainer">
          <h2 className="title">{item.title}</h2>
          
          <div className="eventDetails">
            {item.address && (
              <div className="detailItem">
                <span className="icon">📍</span>
                <span className="text">{item.address}</span>
              </div>
            )}
            
            {formattedDate && (
              <div className="detailItem">
                <span className="icon">📅</span>
                <span className="text">{formattedDate}</span>
              </div>
            )}
            
            {item.duration && (
              <div className="detailItem">
                <span className="icon">⏱️</span>
                <span className="text">{item.duration}</span>
              </div>
            )}
            
            {item.participants && (
              <div className="detailItem">
                <span className="icon">👥</span>
                <span className="text">{item.participants} participants</span>
              </div>
            )}
          </div>

          {item.description && (
            <p className="description">{item.description}</p>
          )}

          {item.prizes && (
            <div className="prizes">
              <h3>Prizes</h3>
              <div className="prizeList">
                {item.prizes.map((prize, index) => (
                  <div key={index} className="prizeItem">
                    <span className="position">{index + 1}st</span>
                    <span className="amount">{prize}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.requirements && (
            <div className="requirements">
              <h3>Requirements</h3>
              <ul>
                {item.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="actionButtons">
            <button className="detailsButton" onClick={handleViewDetails}>View Details</button>
            <button 
              className={`saveButton ${isSaved ? 'saved' : ''}`}
              onClick={handleSave}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default Card;
