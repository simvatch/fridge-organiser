import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
    const [firstName, setFirstName] = useState("")
    const [surname, setSurname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const navigate = useNavigate()

    const handlSignup = async (e) => {
        e.preventDefault()
    
        if (password != confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch(
                "https://fridge-organiser.onrender.com/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: surname,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert(`Account created successfully for ${firstName}! Redirecting to login...`)
                navigate("/login")
            }
        } catch (error) {
            console.log(error);
            alert("Server error")
        }
    } 

    return (
        <div className="login-container">

            <div className="login-card">
                <h2>Create Account</h2>
                <form onSubmit={handlSignup}>

                    <div className="input-group">
                        <label>First Name</label>
                        <input 
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Surname</label>
                        <input 
                            type="text"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            placeholder="Enter your surname"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email adress"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Confirm Password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button type="submit" className="add login-btn">Sign Up</button>
                </form>

                <p className="auth-toggle-text">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>

        </div>
    )
}