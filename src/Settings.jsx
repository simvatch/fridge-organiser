import { useState, useEffect } from "react";
import "./Settings.css"

export default function Settings({ isOpen, onClose }) {
    const [settings, setSettings] = useState({
        temperature: "celsius",
        weight: "grams",
        volume: "ml"
    })

    useEffect(() => {
        const saved = localStorage.getItem("settings")

        if (saved) {
            setSettings(JSON.parse(saved))
        }
    }, [])

    const updateSetting = (key, value) => {
        const updated = {
            ...settings,
            [key]: value
        }

        setSettings(updated)
        localStorage.setItem(
            "settings",
            JSON.stringify(updated)
        )
    }
    if (!isOpen) return null
    
    return (
        <div className="modal-overlay">
            <div className="settings-window">
                <div className="settings-header">
                    <h2>Settings</h2>

                    <button className="close-btn" onClick={onClose}>X</button>
                </div>

                <div className="settings-group">
                    <label>Temperature Unit</label>
                    <select
                        value={settings.temperature}
                        onChange={(e) =>
                            updateSetting(
                                "temperature",
                                e.target.value
                            )
                        }
                    >
                        <option value="celsius">Celsius (°C)</option>
                        <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                </div>

                <div className="settings-group">
                    <label>Weight Unit</label>
                    <select
                        value={settings.weight}
                        onChange={(e) =>
                            updateSetting(
                                "weight",
                                e.target.value
                            )
                        }
                    >
                        <option value="grams">Grams (g)</option>
                        <option value="ounces">Ounces (oz)</option>
                        <option value="pounds">Pounds (lb)</option>
                    </select>
                </div>

                <div className="settings-group">
                    <label>Volume Unit</label>

                    <select
                        value={settings.volume}
                        onChange={(e) =>
                            updateSetting(
                                "volume",
                                e.target.value
                            )
                        }
                    >
                        <option value="ml">Mililitres (ml)</option>
                        <option value="litres">Litres (l)</option>
                        <option value="cups">Cups</option>
                    </select>
                </div>
            </div>
        </div>
    )
}