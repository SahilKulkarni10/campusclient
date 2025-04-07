import { useContext, useState, useEffect } from "react";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";
import Card from "../../components/card/Card.jsx";
import axios from "axios";

function HomePage() {
  const { currentUser } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Attempt to fetch from API
        const res = await axios.get("http://localhost:8800/api/posts");
        setEvents(res.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        // Enhanced mock data with more variety
        setEvents([
          {
            id: 1,
            title: "CodeCraft Hackathon 2023",
            address: "Engineering Building, Nashik",
            price: 1200,
            category: "hackathon",
            description: "A 48-hour coding challenge to build innovative solutions for real-world problems.",
            date: "2023-11-15",
            images: ["/hac.jpg"]
          },
          {
            id: 2,
            title: "DataHack: AI & ML Challenge",
            address: "Tech Hub, Mumbai",
            price: 1500,
            category: "hackathon",
            description: "Harness the power of data to create AI-driven applications.",
            date: "2023-12-02",
            images: ["/hac.jpg"]
          },
          {
            id: 3,
            title: "Web Development Workshop",
            address: "Computer Lab 4, Pune",
            price: 800,
            category: "workshop",
            description: "Learn modern web frameworks and deployment techniques.",
            date: "2023-11-20",
            images: ["/workshop.jpg"]
          },
          {
            id: 4,
            title: "Future of Technology Seminar",
            address: "Auditorium A, Mumbai",
            price: 500,
            category: "seminar",
            description: "Industry experts discuss upcoming tech trends and career opportunities.",
            date: "2023-11-25",
            images: ["/seminar.jpg"]
          },
          {
            id: 5,
            title: "Mobile App Development Bootcamp",
            address: "Innovation Center, Pune",
            price: 1200,
            category: "workshop",
            description: "Intensive 3-day workshop on building cross-platform mobile apps.",
            date: "2023-12-10",
            images: ["/workshop.jpg"]
          },
          {
            id: 6,
            title: "GameDev Hackathon",
            address: "Creative Arts Building, Nashik",
            price: 1000,
            category: "hackathon",
            description: "Create an original game in 36 hours with mentorship from industry professionals.",
            date: "2023-12-15",
            images: ["/hac.jpg"]
          },
          {
            id: 7,
            title: "Research Methodologies Seminar",
            address: "Research Center, Mumbai",
            price: 300,
            category: "seminar",
            description: "Learn effective research techniques for academic and industry projects.",
            date: "2023-11-18",
            images: ["/seminar.jpg"]
          },
          {
            id: 8,
            title: "Cybersecurity Workshop",
            address: "Secure Labs, Pune",
            price: 1500,
            category: "workshop",
            description: "Hands-on training in identifying and mitigating security vulnerabilities.",
            date: "2023-12-05",
            images: ["/workshop.jpg"]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = ["All", "Hackathon", "Workshop", "Seminar"];
  
  const filteredEvents = activeCategory === "All" 
    ? events 
    : events.filter(item => 
        item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
      );

  return (
    <div className="homePage">
      {/* Hero Section */}
      <section className="hero">
        <div className="textContainer">
          <div className="wrapper">
            <h1>Connect with like-minded people!</h1>
            <p>
              Integrated Campus Connection aims to improve student experience,
              foster community engagement, and enhance academic success by
              creating a seamless platform for communication, collaboration, and
              resource sharing within the campus community.
            </p>
            
            {currentUser && (
              <div className="cta-button">
                <button onClick={() => window.location.href = "/add"}>
                  Post Your Event
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="imgContainer">
          <img src="/hac.jpg" alt="Campus Connect" />
          <div className="bgAnimation1" />
          <div className="bgAnimation2" />
        </div>
      </section>

      {/* Events Section */}
      <section className="eventsSection">
        <div className="wrapper">
          <h2>Discover Campus Events</h2>
          
          <div className="categoryFilter">
            {categories.map(category => (
              <button 
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading amazing events...</p>
            </div>
          ) : (
            <div className="cardContainer">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((item) => (
                  <Card key={item.id} item={item} className={"card"} />
                ))
              ) : (
                <div className="noEvents">
                  <p>No events found in this category.</p>
                  {currentUser && (
                    <button onClick={() => window.location.href = "/add"}>
                      Be the first to add one!
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      {currentUser && (
        <section className="ctaSection">
          <div className="wrapper">
            <h2>Have an event to share?</h2>
            <p>Help grow our campus community by sharing your upcoming events!</p>
            <button onClick={() => window.location.href = "/add"}>
              Post Your Event
            </button>
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="footer">
        <div className="wrapper">
          <div className="footerContent">
            <div className="footerSection">
              <h3>About Campus Connect</h3>
              <p>
                Campus Connect is a platform designed to bring students together through events, 
                workshops, and hackathons. Our mission is to foster a vibrant campus community 
                where students can learn, collaborate, and grow together.
              </p>
              <div className="socialLinks">
                <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            
            <div className="footerSection">
              <h3>Quick Links</h3>
              <ul className="footerLinks">
                <li><a href="#">Home</a></li>
                <li><a href="#">Events</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="footerSection">
              <h3>Contact Us</h3>
              <div className="contactInfo">
                <p><span className="icon">📍</span> 123 Campus Avenue, University City</p>
                <p><span className="icon">📧</span> info@campusconnect.com</p>
                <p><span className="icon">📱</span> 8329076760</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
