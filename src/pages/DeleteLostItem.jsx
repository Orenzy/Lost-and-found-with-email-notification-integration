import { useState } from "react";
import "./DeleteLostItem.css";


function DeleteLostItem() {

    const [deleted, setDeleted] = useState(false);


    const handleDelete = () => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this lost item?"
        );


        if (confirmDelete) {

            setDeleted(true);

            alert("Lost item deleted successfully!");

        }

    };


    return (

        <div className="delete-lost-item-container">

            <h1>Delete Lost Item Report</h1>


            {!deleted ? (

                <div className="item-card">

                    <h3>Lost Phone</h3>

                    <p>
                        Category: Electronics
                    </p>

                    <p>
                        Location: Gold Coast
                    </p>

                    <p>
                        Date Lost: 20/07/2026
                    </p>


                    <button onClick={handleDelete}>
                        Delete Report
                    </button>

                </div>

            ) : (

                <h2>
                    No lost item reports available.
                </h2>

            )}

        </div>

    );

}


export default DeleteLostItem;