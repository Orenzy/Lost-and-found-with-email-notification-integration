import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaUserPlus
} from "react-icons/fa";

import "./Register.css";


function Register() {

  const navigate = useNavigate();


  const [user, setUser] = useState({

    name: "",
    email: "",
    password: ""

  });



  const handleChange = (e) => {

    setUser({

      ...user,
      [e.target.name]: e.target.value

    });

  };



  const handleSubmit = (e) => {

    e.preventDefault();


    if (!user.name || !user.email || !user.password) {

      alert("Please fill in all fields");

      return;

    }


    if (user.password.length < 6) {

      alert("Password must be at least 6 characters");

      return;

    }


    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((existing) => existing.email.toLowerCase() === user.email.trim().toLowerCase())) {
      alert("An account with this email already exists.");
      return;
    }

    const savedUser = {
      id: `USR-${Date.now()}`,
      name: user.name.trim(),
      email: user.email.trim(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("users", JSON.stringify([...users, savedUser]));

    alert("Registration Successful!");

    navigate("/login");

  };



return (

    <div className="register-container">


        <div className="register-card">


            <h1>
                Create Account
            </h1>


            <p>
                Join the Lost & Found community
            </p>



            <form onSubmit={handleSubmit}>


                <div className="input-group">

                    <FaUser className="icon"/>

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={user.name}
                        onChange={handleChange}
                    />

                </div>




                <div className="input-group">

                    <FaEnvelope className="icon"/>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={user.email}
                        onChange={handleChange}
                    />

                </div>




                <div className="input-group">

                    <FaLock className="icon"/>

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={user.password}
                        onChange={handleChange}
                    />

                </div>




                <button type="submit">

                    <FaUserPlus />

                    Register

                </button>



            </form>


            <div className="login-link">

                <p>
                    Already have an account?
                </p>


                <button
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>


            </div>


        </div>


    </div>

);

}


export default Register;