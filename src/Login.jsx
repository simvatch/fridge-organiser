import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css"

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch("https://fridge-organiser.onrender.com/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin();
                navigate("/");
            } else {
                alert(data.detail || "Login failed");
            }
        } catch (error) {
            console.log(error)
            alert("Server error");
        }
    };

    return (
        <div className="login-container">
            
            <div className="login-card">
                <h2>Fridge Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button type="submit" className="add login-btn">Sign In</button>
                </form>

                <p className="auth-toggle-text">Don't have an account? <Link to="/signup">Sign Up</Link></p>
            </div>

        </div>
    )
}