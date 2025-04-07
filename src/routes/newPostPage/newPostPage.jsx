import { useState } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate } from "react-router-dom";

function NewPostPage() {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiredFields, setRequiredFields] = useState({
    title: false,
    price: false,
    address: false,
    city: false,
    college: false,
    venue: false,
  });

  const navigate = useNavigate();

  const validateForm = (inputs) => {
    const requiredFieldsList = ["title", "price", "address", "city", "bedroom", "bathroom"];
    let isValid = true;
    const newRequiredFields = { ...requiredFields };
    
    requiredFieldsList.forEach(field => {
      if (!inputs[field] || inputs[field] === "") {
        newRequiredFields[field === "bedroom" ? "college" : field === "bathroom" ? "venue" : field] = true;
        isValid = false;
      } else {
        newRequiredFields[field === "bedroom" ? "college" : field === "bathroom" ? "venue" : field] = false;
      }
    });
    
    if (description === "") {
      isValid = false;
    }
    
    if (images.length === 0) {
      isValid = false;
      setError("Please upload at least one image");
    }
    
    setRequiredFields(newRequiredFields);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);
    
    if (!validateForm(inputs)) {
      setLoading(false);
      setError("Please fill in all required fields marked with *");
      return;
    }

    try {
      const res = await apiRequest.post("/posts", {
        postData: {
          title: inputs.title,
          price: parseInt(inputs.price),
          address: inputs.address,
          city: inputs.city,
          college: inputs.bedroom, // Using bedroom field for college (mapping to schema)
          venue: inputs.bathroom,  // Using bathroom field for venue (mapping to schema)
          type: inputs.type,
          category: inputs.property, // Using property field for category (mapping to schema)
          date: inputs.date ? new Date(inputs.date) : null,
          organizer: inputs.organizer || null,
          images: images,
        },
        postDetail: {
          desc: description,
          utilities: inputs.utilities,
          size: inputs.size ? parseInt(inputs.size) : null,
        },
      });
      
      setLoading(false);
      navigate("/" + res.data.id);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err.response?.data?.message || "An error occurred while creating the post");
    }
  };

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h1>Add New Post</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title *</label>
              <input 
                id="title" 
                name="title" 
                type="text" 
                className={requiredFields.title ? "error" : ""} 
                placeholder="Enter event title"
              />
              {requiredFields.title && <span className="error-message">Title is required</span>}
            </div>
            <div className="item">
              <label htmlFor="price">Price *</label>
              <input 
                id="price" 
                name="price" 
                type="number" 
                min="0"
                className={requiredFields.price ? "error" : ""} 
                placeholder="Enter price"
              />
              {requiredFields.price && <span className="error-message">Price is required</span>}
            </div>
            <div className="item">
              <label htmlFor="address">Address *</label>
              <input 
                id="address" 
                name="address" 
                type="text" 
                className={requiredFields.address ? "error" : ""} 
                placeholder="Enter venue address"
              />
              {requiredFields.address && <span className="error-message">Address is required</span>}
            </div>
            <div className="item description">
              <label htmlFor="desc">Description *</label>
              <ReactQuill 
                theme="snow" 
                onChange={setDescription} 
                value={description} 
                className={description === "" ? "error" : ""} 
                placeholder="Describe your event"
              />
              {description === "" && <span className="error-message">Description is required</span>}
            </div>
            <div className="item">
              <label htmlFor="city">City *</label>
              <input 
                id="city" 
                name="city" 
                type="text" 
                className={requiredFields.city ? "error" : ""} 
                placeholder="Enter city"
              />
              {requiredFields.city && <span className="error-message">City is required</span>}
            </div>
            <div className="item">
              <label htmlFor="bedroom">College *</label>
              <input 
                id="bedroom" 
                name="bedroom" 
                type="text"
                className={requiredFields.college ? "error" : ""} 
                placeholder="Enter college name"
              />
              {requiredFields.college && <span className="error-message">College is required</span>}
            </div>
            <div className="item">
              <label htmlFor="bathroom">Venue *</label>
              <input 
                id="bathroom" 
                name="bathroom" 
                type="text"
                className={requiredFields.venue ? "error" : ""} 
                placeholder="Enter venue name"
              />
              {requiredFields.venue && <span className="error-message">Venue is required</span>}
            </div>
            <div className="item">
              <label htmlFor="date">Event Date</label>
              <input 
                id="date" 
                name="date" 
                type="datetime-local"
              />
            </div>
            <div className="item">
              <label htmlFor="organizer">Organizer</label>
              <input 
                id="organizer" 
                name="organizer" 
                type="text"
                placeholder="Event organizer or contact person"
              />
            </div>
            <div className="item">
              <label htmlFor="type">Type *</label>
              <select name="type" id="type">
                <option value="rent">Hardware</option>
                <option value="buy">Software</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Category *</label>
              <select name="property" id="property">
                <option value="apartment">AI/ML</option>
                <option value="house">Web Development</option>
                <option value="condo">Data Science</option>
                <option value="land">Blockchain</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">Accommodation</label>
              <select name="utilities" id="utilities">
                <option value="owner">Yes</option>
                <option value="tenant">No</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="size">Team Size</label>
              <input min="0" id="size" name="size" type="number" placeholder="Maximum team size" />
            </div>
            
            <div className="upload-instruction">
              <p>* Upload at least one image for your event</p>
              {images.length === 0 && <span className="error-message">At least one image is required</span>}
            </div>
            
            <button type="submit" className="sendButton" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
      </div>
      <div className="sideContainer">
        <h3>Event Images</h3>
        <p>Upload images for your event (required)</p>
        
        <div className="images-container">
          {images.map((image, index) => (
            <img src={image} key={index} alt={`Event image ${index + 1}`} />
          ))}
        </div>
        
        <UploadWidget
          uwConfig={{
            multiple: true,
            cloudName: "lamadev",
            uploadPreset: "estate",
            folder: "posts",
          }}
          setState={setImages}
        />
      </div>
    </div>
  );
}

export default NewPostPage;
