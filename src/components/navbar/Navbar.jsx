import { useContext, useState } from "react";
import "./navbar.scss";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

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
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
        <div className={open ? "menu active" : "menu"}>
          <a href="/">Home</a>
          <a href="/">About</a>
          <a href="/profile">Profile</a>
          <a href="mailto:kulkarnisahil882@gmail.com">Contact</a>
          <a href="/community">Community</a>
          <a href="/login">Sign in</a>
          <a href="/register">Sign up</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
