import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaFileAlt,
    FaMapMarkerAlt,
    FaSave,
    FaTag,
    FaEnvelope,
} from "react-icons/fa";

import "./EditLostItem.css";

function EditLostItem() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [item, setItem] = useState({
        title: "",
        description: "",
        category: "",
        location: "",
        dateLost: "",
        imageDataUrl: "",
        reporterEmail: "",
    });

    const [error, setError] = useState("");

    useEffect(() => {
        const lostItems = JSON.parse(
            localStorage.getItem("lostItems") || "[]"
        );

        const existingItem = lostItems.find(
            (lostItem) =>
                String(lostItem.id) === String(id)
        );

        if (!existingItem) {
            setError("Lost item could not be found.");
            return;
        }

        setItem({
            title: existingItem.title || "",
            description: existingItem.description || "",
            category: existingItem.category || "",
            location: existingItem.location || "",
            dateLost: existingItem.dateLost || "",
            imageDataUrl: existingItem.imageDataUrl || "",
            reporterEmail: existingItem.reporterEmail || "",
        });
    }, [id]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setItem((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            setItem((previous) => ({
                ...previous,
                imageDataUrl: reader.result,
            }));
        };

        reader.readAsDataURL(file);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (
            !item.title.trim() ||
            !item.description.trim() ||
            !item.category ||
            !item.location.trim() ||
            !item.dateLost
        ) {
            setError("Please complete all required fields.");
            return;
        }

        const lostItems = JSON.parse(
            localStorage.getItem("lostItems") || "[]"
        );

        const updatedItems = lostItems.map((lostItem) => {
            if (String(lostItem.id) !== String(id)) {
                return lostItem;
            }

            return {
                ...lostItem,
                title: item.title.trim(),
                description: item.description.trim(),
                category: item.category,
                location: item.location.trim(),
                dateLost: item.dateLost,
                imageDataUrl: item.imageDataUrl,
                reporterEmail: item.reporterEmail.trim(),
                updatedAt: new Date().toISOString(),
            };
        });

        localStorage.setItem(
            "lostItems",
            JSON.stringify(updatedItems)
        );

        alert("Lost item updated successfully!");

        navigate("/view-lost-items");
    };

    if (error && !item.title) {
        return (
            <main className="edit-lost-page">
                <div className="edit-lost-card error-card">

                    <FaTag />

                    <h1>
                        Lost Item Not Found
                    </h1>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/view-lost-items")
                        }
                    >
                        <FaArrowLeft />
                        Back to Lost Items
                    </button>

                </div>
            </main>
        );
    }

    return (
        <main className="edit-lost-page">

            <div className="edit-lost-card">

                {/* HEADER */}

                <header className="edit-lost-header">

                    <div>

                        <p className="edit-lost-eyebrow">
                            LOST & FOUND
                        </p>

                        <h1>
                            <FaTag />
                            Edit Lost Item
                        </h1>

                        <p>
                            Update the details of your
                            lost-item report.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="edit-lost-back-button"
                        onClick={() =>
                            navigate("/view-lost-items")
                        }
                    >
                        <FaArrowLeft />
                        Back
                    </button>

                </header>

                {/* ERROR */}

                {error && (
                    <div className="edit-lost-error">
                        {error}
                    </div>
                )}

                {/* FORM */}

                <form onSubmit={handleSubmit}>

                    {/* TITLE */}

                    <div className="edit-lost-input-group">

                        <FaTag className="edit-lost-input-icon" />

                        <input
                            type="text"
                            name="title"
                            placeholder="Item Title"
                            value={item.title}
                            onChange={handleChange}
                        />

                    </div>

                    {/* DESCRIPTION */}

                    <div className="edit-lost-input-group textarea-group">

                        <FaFileAlt className="edit-lost-input-icon" />

                        <textarea
                            name="description"
                            placeholder="Describe the item"
                            value={item.description}
                            onChange={handleChange}
                        />

                    </div>

                    {/* CATEGORY */}

                    <div className="edit-lost-input-group">

                        <select
                            name="category"
                            value={item.category}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Category
                            </option>

                            <option value="Electronics">
                                Electronics
                            </option>

                            <option value="Documents">
                                Documents
                            </option>

                            <option value="Clothing">
                                Clothing
                            </option>

                            <option value="Bags">
                                Bags
                            </option>

                            <option value="Keys">
                                Keys
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>

                    {/* REPORTER EMAIL */}

                    <div className="edit-lost-input-group">

                        <FaEnvelope className="edit-lost-input-icon" />

                        <input
                            type="email"
                            name="reporterEmail"
                            placeholder="Your email (for match notifications)"
                            value={item.reporterEmail}
                            onChange={handleChange}
                        />

                    </div>

                    {/* LOCATION */}

                    <div className="edit-lost-input-group">

                        <FaMapMarkerAlt className="edit-lost-input-icon" />

                        <input
                            type="text"
                            name="location"
                            placeholder="Location Lost"
                            value={item.location}
                            onChange={handleChange}
                        />

                    </div>

                    {/* DATE */}

                    <div className="edit-lost-input-group">

                        <FaCalendarAlt className="edit-lost-input-icon" />

                        <input
                            type="date"
                            name="dateLost"
                            value={item.dateLost}
                            onChange={handleChange}
                        />

                    </div>

                    {/* IMAGE */}

                    <div className="edit-lost-file-upload">

                        <label>
                            Replace Item Image
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                    </div>

                    {/* IMAGE PREVIEW */}

                    {item.imageDataUrl && (
                        <div className="edit-lost-image-preview">

                            <img
                                src={item.imageDataUrl}
                                alt="Lost item preview"
                            />

                        </div>
                    )}

                    {/* SAVE */}

                    <button
                        type="submit"
                        className="edit-lost-save-button"
                    >
                        <FaSave />
                        Save Changes
                    </button>

                </form>

            </div>

        </main>
    );
}

export default EditLostItem;