import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    const handleLogin = (e) => {
        e.preventDefault()

        if (username == "admin" && password == "pass") {
            onLogin()
            navigate("/")
        } else {
            alert("Invalid username or password!")
        }
    }

    return (
        <div className="login-container">
            
            <div className="login-card">
                <h2>Fridge Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
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
            </div>

        </div>
    )
}