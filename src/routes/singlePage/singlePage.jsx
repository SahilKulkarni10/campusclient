import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

function SinglePage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("event"); // Default event type

  useEffect(() => {
    // Determine event type from URL
    const path = window.location.pathname;
    if (path.includes("/hackathon/")) {
      setEventType("hackathon");
    } else if (path.includes("/seminar/")) {
      setEventType("seminar");
    } else if (path.includes("/workshop/")) {
      setEventType("workshop");
    } else {
      setEventType("event");
    }

    const fetchEvent = async () => {
      try {
        const res = await axios.get(`http://localhost:8800/api/posts/${id}`);
        // Add default coordinates for India if not present
        const eventData = {
          ...res.data,
          latitude: res.data.latitude || 20.5937,
          longitude: res.data.longitude || 78.9629
        };
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
        // Fallback to mock data if API fails
        setEvent({
          id: id,
          title: "CodeCraft Hackathon 2023",
          address: "Engineering Building, Nashik",
          price: 1200,
          category: eventType,
          description: "A 48-hour coding challenge to build innovative solutions for real-world problems.",
          date: "2023-11-15",
          images: ["/hac.jpg"],
          participants: 100,
          duration: "48 hours",
          requirements: ["Laptop", "Student ID", "Basic programming knowledge"],
          prizes: ["₹50,000", "₹25,000", "₹10,000"],
          latitude: 20.5937,
          longitude: 78.9629
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, eventType]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  const formattedDate = event.date ? format(new Date(event.date), "MMMM dd, yyyy") : null;

  // Get event type display name
  const getEventTypeDisplay = () => {
    switch (eventType) {
      case "hackathon":
        return "Hackathon";
      case "seminar":
        return "Seminar";
      case "workshop":
        return "Workshop";
      default:
        return "Event";
    }
  };

  return (
    <div className={`singlePage ${eventType}`}>
      <div className="details">
        <div className="wrapper">
          {event.images && event.images.length > 0 && (
            <Slider images={event.images} />
          )}
          <div className="info">
            <div className="top">
              <div className="post">
                <div className="eventType">{getEventTypeDisplay()}</div>
                <h1>{event.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{event.address}</span>
                </div>
                <div className="price">₹{event.price}</div>
              </div>
            </div>
            <div className="bottom">
              <p className="description">{event.description}</p>
              
              <div className="eventDetails">
                {formattedDate && (
                  <div className="detailItem">
                    <span className="icon">📅</span>
                    <span className="text">{formattedDate}</span>
                  </div>
                )}
                
                {event.duration && (
                  <div className="detailItem">
                    <span className="icon">⏱️</span>
                    <span className="text">{event.duration}</span>
                  </div>
                )}
                
                {event.participants && (
                  <div className="detailItem">
                    <span className="icon">👥</span>
                    <span className="text">{event.participants} participants</span>
                  </div>
                )}
              </div>

              {event.requirements && (
                <div className="requirements">
                  <h3>Requirements</h3>
                  <ul>
                    {event.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {event.prizes && (
                <div className="prizes">
                  <h3>Prizes</h3>
                  <div className="prizeList">
                    {event.prizes.map((prize, index) => (
                      <div key={index} className="prizeItem">
                        <span className="position">{index + 1}st</span>
                        <span className="amount">{prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[event]} />
          </div>
          <div className="buttons">
            <button>
              <img src="/chat.png" alt="" />
              Send a Message
            </button>
            <button>
              <img src="/save.png" alt="" />
              Save the Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
