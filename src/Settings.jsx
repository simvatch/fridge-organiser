import { useState, useEffect } from "react";
import "./Settings.css"

export default function Settings({ isOpen, onClose, settings, setSettings }) {
    const [localSettings, setLocalSettings] = useState(
    settings || {
        temperature: "celsius",
        weight: "grams",
        volume: "ml"
    }
)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(
                     "https://fridge-organiser.onrender.com/settings",
                     {
                        credentials: "include"
                     }
                )

                if (!response.ok) {
                    throw new Error("Failed to fetch settings")
                }

                const data = await response.json()

                setSettings({
                    temperature: data.temperature,
                    weight: data.weight,
                    volume: data.volume
                })
                setLocalSettings({
                    temperature: data.temperature,
                    weight: data.weight,
                    volume: data.volume
                })
            } catch (error) {
                console.error(error)
            }
        }

        if (isOpen) {
            fetchSettings()
        }
    }, [isOpen])

    const handleLocalChange = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = async () => {
        try {
            await fetch(
                "https://fridge-organiser.onrender.com/settings",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(localSettings)
                }
            )

            setSettings(localSettings)
            onClose()
        } catch (error) {
            console.error(error)
        }
    }

    const updateSetting = async (key, value) => {
        const updated = {
            ...settings,
            [key]: value
        }

        setSettings(updated)
        
        try {
            await fetch(
                "https://fridge-organiser.onrender.com/settings",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updated)
                }
            )
        } catch (error) {
            console.error(error);
            
        }
    }

    const handleCancel = () => {
        setLocalSettings({ ...settings })
        onClose()
    }

    if (!isOpen) return null
    
    return (
        <div className="modal-overlay">
            <div className="settings-window">
                <div className="settings-header">
                    <h2>Settings</h2>

                    <button className="close-btn" onClick={handleCancel}>X</button>
                </div>

                <div className="settings-group">
                    <label>Temperature Unit</label>
                    <select
                        value={localSettings.temperature}
                        onChange={(e) =>
                            handleLocalChange(
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
                        value={localSettings.weight}
                        onChange={(e) =>
                            handleLocalChange(
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
                        value={localSettings.volume}
                        onChange={(e) =>
                            handleLocalChange(
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

                <div className="settings-actions">
                    <button className="cancel-btn" onClick={handleCancel}>Cancel</button>

                    <button className="save-btn" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    )
}