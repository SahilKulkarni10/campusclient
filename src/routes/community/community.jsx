import { useContext, useEffect, useState, useCallback, useRef } from "react";
import "./community.scss";
import { AuthContext } from "../../context/AuthContext";
import GeneralChat from "../../components/generalChat/GeneralChat";
import axios from "axios";
import { SocketContext } from "../../context/SocketContext";
import apiRequest from "../../lib/apiRequest";

function Community() {
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [activeTab, setActiveTab] = useState("forums");
  const [forums, setForums] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [activeForumId, setActiveForumId] = useState(null);
  const [forumPosts, setForumPosts] = useState([]);
  const [newComment, setNewComment] = useState("");
  // Add pagination state
  const [postsPage, setPostsPage] = useState(1);
  const [postsLimit] = useState(5);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [forumPostsLoading, setForumPostsLoading] = useState(false);

  // Add image lazy loading with IntersectionObserver
  const setupImageObserver = useCallback(() => {
    if (!window.IntersectionObserver) return;
    
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.classList.add('loading');
            img.onload = () => {
              img.classList.remove('loading');
              img.classList.add('loaded');
            };
            imgObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px 0px', threshold: 0.1 });
    
    // Get all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imgObserver.observe(img));
    
    return imgObserver;
  }, []);
  
  // Separate fetching for forums and events
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === "forums") {
        fetchForums();
      } else if (activeTab === "events") {
        fetchEvents();
      }
    };

    fetchData();
  }, [activeTab]);

  // Fetch forums with optimization
  const fetchForums = async () => {
    setLoading(true);
    try {
      // Check for cached forums data
      const cachedForums = localStorage.getItem('forums');
      const cacheTimestamp = localStorage.getItem('forumsTimestamp');
      const now = new Date().getTime();
      
      // Use cache if available and less than 10 minutes old
      if (cachedForums && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 10 * 60 * 1000) {
        setForums(JSON.parse(cachedForums));
        setLoading(false);
        
        // Still fetch in background for fresh data
        apiRequest("/forums").then(response => {
          const forumsData = response.data || [];
          setForums(forumsData);
          localStorage.setItem('forums', JSON.stringify(forumsData));
          localStorage.setItem('forumsTimestamp', now.toString());
        }).catch(err => console.error("Background forums refresh error:", err));
        
        return;
      }
      
      // Fetch forums
      const forumsRes = await apiRequest("/forums");
      const forumsData = forumsRes.data || [];
      setForums(forumsData);
      
      // Cache the forums data in localStorage for persistence
      localStorage.setItem('forums', JSON.stringify(forumsData));
      localStorage.setItem('forumsTimestamp', now.toString());
    } catch (error) {
      console.error("Error fetching forums:", error);
      // Use cached data as fallback if available
      const cachedForums = localStorage.getItem('forums');
      if (cachedForums) {
        setForums(JSON.parse(cachedForums));
      } else {
        // Ultimate fallback data
        setForums([
          { 
            id: 1, 
            title: "Academic Discussions", 
            description: "Discuss academic topics, share resources and help each other with coursework.",
            posts: 12,
            lastActivity: "2023-12-20T14:30:00"
          },
          { 
            id: 2, 
            title: "Campus Events", 
            description: "Updates and discussions about events happening on campus.",
            posts: 8,
            lastActivity: "2023-12-24T10:15:00"
          },
          { 
            id: 3, 
            title: "Technical Projects", 
            description: "Collaborate on technical projects, share ideas and find team members.",
            posts: 5,
            lastActivity: "2023-12-26T16:45:00"
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch events with optimization
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Check for cached events data
      const cachedEvents = localStorage.getItem('events');
      const cacheTimestamp = localStorage.getItem('eventsTimestamp');
      const now = new Date().getTime();
      
      // Use cache if available and less than 15 minutes old
      if (cachedEvents && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 15 * 60 * 1000) {
        setEvents(JSON.parse(cachedEvents));
        setLoading(false);
        
        // Still fetch in background for fresh data
        apiRequest("/posts?category=event&limit=10").then(response => {
          const eventsData = response.data || [];
          setEvents(eventsData);
          localStorage.setItem('events', JSON.stringify(eventsData));
          localStorage.setItem('eventsTimestamp', now.toString());
        }).catch(err => console.error("Background events refresh error:", err));
        
        return;
      }
      
      // Fetch events
      const eventsRes = await apiRequest("/posts?category=event&limit=10");
      const eventsData = eventsRes.data || [];
      setEvents(eventsData);
      
      // Cache the events data in localStorage for persistence
      localStorage.setItem('events', JSON.stringify(eventsData));
      localStorage.setItem('eventsTimestamp', now.toString());
    } catch (error) {
      console.error("Error fetching events:", error);
      // Use cached data as fallback if available
      const cachedEvents = localStorage.getItem('events');
      if (cachedEvents) {
        setEvents(JSON.parse(cachedEvents));
      } else {
        // Ultimate fallback data
        setEvents([
          {
            id: 1,
            title: "Winter Coding Bootcamp",
            date: "2024-01-15",
            location: "Computer Science Building",
            description: "Intensive 3-day coding bootcamp covering web development fundamentals."
          },
          {
            id: 2,
            title: "Campus Talent Show",
            date: "2024-01-20",
            location: "Campus Auditorium",
            description: "Annual talent show featuring performances from students and faculty."
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch forum posts when a forum is selected with pagination
  useEffect(() => {
    if (!activeForumId) return;
    // Reset pagination when forum changes
    setPostsPage(1);
    setHasMorePosts(true);
    setForumPosts([]);
    fetchForumPosts(1, true);
  }, [activeForumId]);

  // Implement pagination for forum posts
  const fetchForumPosts = async (page = 1, isInitialLoad = false) => {
    if (!activeForumId) return;
    
    if (isInitialLoad) {
      setForumPostsLoading(true);
    }
    
    try {
      // Use actual API call with pagination parameters
      const res = await apiRequest(`/forums/${activeForumId}/posts?page=${page}&limit=${postsLimit}`);
      
      const fetchedPosts = res.data || [];
      
      // Check if there are more posts to load
      setHasMorePosts(fetchedPosts.length === postsLimit);
      
      // Append posts for pagination, or set them if it's the initial load
      if (page === 1) {
        setForumPosts(fetchedPosts);
      } else {
        setForumPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      }
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      // Only use fallback data for initial load
      if (isInitialLoad) {
        setForumPosts([
          {
            id: 1,
            title: "Resources for Programming Fundamentals",
            content: "I've compiled a list of resources for the Programming Fundamentals course. Hope this helps!",
            author: "Student123",
            createdAt: "2023-12-18T09:30:00",
            comments: [
              {
                id: 1,
                text: "Thanks for sharing these resources!",
                author: "Student456",
                createdAt: "2023-12-18T10:15:00"
              },
              {
                id: 2,
                text: "I found the video tutorials particularly helpful.",
                author: "Student789",
                createdAt: "2023-12-19T14:20:00"
              }
            ]
          },
          {
            id: 2,
            title: "Study Group for Database Systems",
            content: "Is anyone interested in forming a study group for the upcoming Database Systems exam?",
            author: "DBEnthusiast",
            createdAt: "2023-12-20T15:45:00",
            comments: [
              {
                id: 3,
                text: "I'm interested! When are you planning to meet?",
                author: "SQLLearner",
                createdAt: "2023-12-20T16:30:00"
              }
            ]
          }
        ]);
      }
    } finally {
      if (isInitialLoad) {
        setForumPostsLoading(false);
      }
    }
  };

  // Load more posts handler
  const handleLoadMorePosts = () => {
    const nextPage = postsPage + 1;
    setPostsPage(nextPage);
    fetchForumPosts(nextPage, false);
  };

  // Handle new post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || !activeForumId) return;

    try {
      // Use apiRequest instead of axios
      const res = await apiRequest(`/forums/${activeForumId}/posts`, {
        method: 'POST',
        data: newPost
      });
      
      // Add new post to the list - use actual API response
      if (res.data) {
        setForumPosts(prev => [res.data, ...prev]);
        setNewPost({ title: "", content: "" });
      } else {
        // Fallback for testing
        const mockNewPost = {
          id: Math.random().toString(36).substr(2, 9),
          title: newPost.title,
          content: newPost.content,
          author: currentUser.username,
          createdAt: new Date().toISOString(),
          comments: []
        };
        
        setForumPosts([mockNewPost, ...forumPosts]);
        setNewPost({ title: "", content: "" });
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // Handle new comment submission
  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    if (!newComment || !activeForumId) return;

    try {
      // Use apiRequest instead of axios
      const res = await apiRequest(`/forums/${activeForumId}/posts/${postId}/comments`, {
        method: 'POST',
        data: { text: newComment }
      });
      
      // Add new comment to the post - use actual API response
      if (res.data) {
        setForumPosts(prev => 
          prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, res.data]
              };
            }
            return post;
          })
        );
      } else {
        // Fallback for testing
        const updatedPosts = forumPosts.map(post => {
          if (post.id === postId) {
            const newCommentObj = {
              id: Math.random().toString(36).substr(2, 9),
              text: newComment,
              author: currentUser.username,
              createdAt: new Date().toISOString()
            };
            return {
              ...post,
              comments: [...post.comments, newCommentObj]
            };
          }
          return post;
        });
        
        setForumPosts(updatedPosts);
      }
      
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Socket connection for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for new posts
      socket.on("newPost", (data) => {
        if (data.forumId === activeForumId) {
          setForumPosts(prev => [data, ...prev]);
        }
      });

      // Listen for new comments
      socket.on("newComment", (data) => {
        setForumPosts(prev => 
          prev.map(post => {
            if (post.id === data.postId) {
              return {
                ...post,
                comments: [...post.comments, data]
              };
            }
            return post;
          })
        );
      });

      return () => {
        socket.off("newPost");
        socket.off("newComment");
      };
    }
  }, [socket, activeForumId]);
  
  // Fix tab click handlers to ensure data loads correctly
  const handleForumsTabClick = () => {
    setActiveTab("forums");
    // Reset active forum when switching tabs
    setActiveForumId(null);
  };

  const handleEventsTabClick = () => {
    setActiveTab("events");
  };
  
  // Switch to general chat tab handler
  const handleGeneralChatTabClick = () => {
    setActiveTab("generalChat");
  };

  // Apply observer after events are loaded
  useEffect(() => {
    if (activeTab === 'events' && !loading && events.length > 0) {
      const observer = setupImageObserver();
      return () => {
        if (observer) observer.disconnect();
      };
    }
  }, [activeTab, loading, events, setupImageObserver]);

  return (
    <div className="communityPage">
      <div className="community-header">
        <h1>Campus Community</h1>
        <p>Connect with other students and stay up to date with campus activities</p>
      </div>
      
      <div className="community-tabs">
        <button 
          className={activeTab === "forums" ? "active" : ""}
          onClick={handleForumsTabClick}
        >
          Forums
        </button>
        <button 
          className={activeTab === "events" ? "active" : ""}
          onClick={handleEventsTabClick}
        >
          Events
        </button>
        <button 
          className={activeTab === "generalChat" ? "active" : ""}
          onClick={handleGeneralChatTabClick}
        >
          General Chat
        </button>
      </div>
      
      <div className="community-content">
        {loading ? (
          <div className="loading">Loading community content...</div>
        ) : (
          <>
            {/* Forums Tab */}
            {activeTab === "forums" && (
              <div className="forums-container">
                {!activeForumId ? (
                  <>
                    <h2>Discussion Forums</h2>
                    <div className="forums-list">
                      {forums.map(forum => (
                        <div 
                          key={forum.id} 
                          className="forum-card"
                          onClick={() => setActiveForumId(forum.id)}
                        >
                          <h3>{forum.title}</h3>
                          <p>{forum.description}</p>
                          <div className="forum-stats">
                            <span>{forum.posts} posts</span>
                            <span>Last activity: {new Date(forum.lastActivity).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="forum-detail">
                    <div className="forum-header">
                      <button className="back-button" onClick={() => setActiveForumId(null)}>
                        ← Back to Forums
                      </button>
                      <h2>{forums.find(f => f.id === activeForumId)?.title}</h2>
                    </div>
                    
                    {currentUser && (
                      <div className="new-post-form">
                        <h3>Create New Post</h3>
                        <form onSubmit={handlePostSubmit}>
                          <input
                            type="text"
                            placeholder="Post title"
                            value={newPost.title}
                            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                            required
                          />
                          <textarea
                            placeholder="Post content"
                            value={newPost.content}
                            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                            required
                          ></textarea>
                          <button type="submit">Post</button>
                        </form>
                      </div>
                    )}
                    
                    <div className="forum-posts">
                      {forumPostsLoading ? (
                        <div className="loading-posts">Loading posts...</div>
                      ) : (
                        <>
                          {forumPosts.map(post => (
                            <div key={post.id} className="post-card">
                              <div className="post-header">
                                <h3>{post.title}</h3>
                                <div className="post-meta">
                                  <span className="post-author">By {post.author}</span>
                                  <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                              <p className="post-content">{post.content}</p>
                              
                              <div className="post-comments">
                                <h4>Comments ({post.comments.length})</h4>
                                {post.comments.map(comment => (
                                  <div key={comment.id} className="comment">
                                    <div className="comment-meta">
                                      <span className="comment-author">{comment.author}</span>
                                      <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                  </div>
                                ))}
                                
                                {currentUser && (
                                  <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="comment-form">
                                    <textarea
                                      placeholder="Add a comment"
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      required
                                    ></textarea>
                                    <button type="submit">Comment</button>
                                  </form>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {hasMorePosts && (
                            <div className="load-more-container">
                              <button 
                                className="load-more-button"
                                onClick={handleLoadMorePosts}
                              >
                                Load More Posts
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Events Tab */}
            {activeTab === "events" && (
              <div className="events-container">
                <h2>Upcoming Events</h2>
                {loading ? (
                  <div className="events-loading">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="event-placeholder pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="events-list">
                    {events.length > 0 ? (
                      events.map((event, index) => {
                        // Parse the date or use current date as fallback
                        const eventDate = event.date ? new Date(event.date) : new Date();
                        
                        // Format time with AM/PM
                        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
                        const formattedTime = eventDate.toLocaleTimeString([], timeOptions);
                        
                        return (
                          <div key={event.id || index} className="event-card">
                            <div className="event-date">
                              <span className="day">{eventDate.getDate()}</span>
                              <span className="month">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                              <span className="year">{eventDate.getFullYear()}</span>
                            </div>
                            <div className="event-details">
                              {event.images && event.images.length > 0 && (
                                <div className="event-image-container">
                                  <img 
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                                    data-src={event.images[0]}
                                    alt={event.title}
                                    className="lazy-image"
                                  />
                                </div>
                              )}
                              <h3>{event.title}</h3>
                              <div className="event-meta">
                                <span className="event-location">
                                  <i className="fas fa-map-marker-alt"></i> {event.location || event.venue || event.address || "TBD"}
                                </span>
                                <span className="event-time">
                                  <i className="far fa-clock"></i> {formattedTime}
                                </span>
                              </div>
                              <p className="event-description">
                                {event.description || (event.postDetail && event.postDetail.desc) || "Join us for this exciting event!"}
                              </p>
                              <div className="event-actions">
                                <button className="event-rsvp primary-btn">RSVP Now</button>
                                <button className="event-share secondary-btn">Share</button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-events">
                        <h3>No events found</h3>
                        <p>There are no upcoming events at this time.</p>
                        {currentUser && (
                          <button className="create-event-btn" onClick={() => window.location.href = "/add"}>
                            Create an Event
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* General Chat Tab */}
            {activeTab === "generalChat" && (
              <div className="general-chat-container">
                <GeneralChat />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Community;
