import { useContext, useState, useEffect } from "react";
import "./navbar.scss";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && !e.target.closest('.menu') && !e.target.closest('.menuIcon')) {
        setOpen(false);
      }
    };

    // Close menu when pressing escape key
    const handleEscKey = (e) => {
      if (open && e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    // Prevent body scrolling when menu is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  // Close menu when a link is clicked
  const handleMenuClick = () => {
    setOpen(false);
  };

  return (
    <nav>
      <div className="left">
        <a href="/" className="logo">
          <img src="/cc.png" alt="" />
          <span>Campus Connect</span>
        </a>
        <a href="/">Home</a>
        <a href="/">About</a>
        <a href="mailto:CampusConnect@gmail.com">Contact</a>
        <a href="/community">Community</a>
      </div>
      <div className="right">
        {currentUser ? (
          <div className="user">
            <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
            <span>{currentUser.username}</span>
            <Link to="/profile" className="profile">
              <span>Profile</span>
            </Link>
          </div>
        ) : (
          <>
            <a href="/login">Sign in</a>
            <a href="/register" className="register">
              Sign up
            </a>
          </>
        )}
        <div className="menuIcon">
          <img
            src="/menu.png"
            alt="Menu"
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
        <div className={open ? "menu active" : "menu"}>
          <div className="closeIcon" onClick={() => setOpen(false)}>
            <span>×</span>
          </div>
          <a href="/" onClick={handleMenuClick}>Home</a>
          <a href="/" onClick={handleMenuClick}>About</a>
          <a href="/community" onClick={handleMenuClick}>Community</a>
          <a href="mailto:CampusConnect@gmail.com" onClick={handleMenuClick}>Contact</a>
          
          {currentUser ? (
            <>
              <a href="/profile" onClick={handleMenuClick}>Profile</a>
              <a href="/settings" onClick={handleMenuClick}>Settings</a>
            </>
          ) : (
            <>
              <a href="/login" onClick={handleMenuClick}>Sign in</a>
              <a href="/register" onClick={handleMenuClick}>Sign up</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
