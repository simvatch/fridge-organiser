import { useState, useEffect } from "react";
import "./Settings.css"

const DIETRY_RESTRICTIONS = [
    { value: "gluten-free", label: "Gluten Free" },
    { value: "dairy-free", label: "Dairy Free" },
    { value: "nut-free", label: "Nut Free" },
    { value: "egg-free", label: "Egg Free" },
    { value: "soy-free", label: "Soy Free" },
    { value: "shellfish-free", label: "Shellfish Free" }
]

const DIETS = [
    { value: "keto", label: "Keto" },
    { value: "low-carb", label: "Low Carb" },
    { value: "paleo", label: "Paleo" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "pescatarian", label: "Pescatarian" },
    { value: "halal", label: "Halal" },
    { value: "kosher", label: "Kosher" }
]

export default function Settings({ isOpen, onClose, settings, setSettings }) {
    const [localSettings, setLocalSettings] = useState(
    settings || {
        temperature: "celsius",
        weight: "grams",
        volume: "ml",
        dietary_restrictions: [],
        diets: []
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
                    volume: data.volume,
                    dietary_restrictions: data.dietary_restrictions || [],
                    diets: data.diets || []
                })
                setLocalSettings({
                    temperature: data.temperature,
                    weight: data.weight,
                    volume: data.volume,
                    dietary_restrictions: data.dietary_restrictions || [],
                    diets: data.diets || []
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

    const toggleMultiSelect = (key, value) => {
        setLocalSettings(prev => {
            const current = prev[key] || []
            const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
            
            return {
                ...prev,
                [key]: updated
            }
        })
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

                <div className="settings-group">
                    <label>Dietary Requirements</label>

                    <div className="multiselect-box">
                        {DIETRY_RESTRICTIONS.map(({ value, label }) => (

                            <label key={value} className="multiselect-option">
                                <input
                                    type="checkbox"
                                    checked={(localSettings.dietary_restrictions || []).includes(value)}
                                    onChange={() => toggleMultiSelect("dietary_restrictions", value)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="settings-group">
                    <label>Diets</label>

                    <div className="multiselect-box">
                        {DIETS.map(({ value, label }) => (
                            
                            <label key={value} className="multiselect-option">
                                <input
                                    type="checkbox"
                                    checked={(localSettings.diets || []).includes(value)}
                                    onChange={() => toggleMultiSelect("diets", value)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="cancel-btn" onClick={handleCancel}>Cancel</button>

                    <button className="save-btn" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    )
}