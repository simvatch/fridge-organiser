export function convertWeight(value, target) {

    if (target === "grams") {
        return `${value} g`
    } else if (target === "ounces") {
        return `${(value / 28.3495).toFixed(1)} oz`
    } else if (target === "pounds") {
        return `${(value / 453.592).toFixed(2)} lb`
    }

    return `${value} g`
}

export function convertVolume(value, target) {
    if (target === "ml") {
        return `${value} ml`
    } else if (target === "litres") {
        return `${(value / 1000).toFixed(2)} l`
    } else if (target == "cups") {
        return `${(value / 236.588).toFixed(1)} cups`
    }

    return `${value} ml`
}

export function convertTemperature(value, target) {
    if (target === "fahrenheit") {
        return `${Math.round(value * 9/5 + 32)}°F`
    }

    return `${value}°C`
}

export function convertStepText(text, settings) {
    if (!settings) return text

    text = text.replace(/(\d+(?:\.\d+)?)\s*°C/g, (_, num) => {
        return convertTemperature(parseFloat(num), settings.temperature)
    })

    text = text.replace(/(\d+(?:\.\d+)?)\s*kg/gi, (_, num) => {
        return convertWeight(parseFloat(num) * 1000, settings.weight)
    })
    text = text.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, num) => {
        return convertWeight(parseFloat(num), settings.weight)
    })
 
    text = text.replace(/(\d+(?:\.\d+)?)\s*l\b/gi, (_, num) => {
        return convertVolume(parseFloat(num) * 1000, settings.volume)
    })
    text = text.replace(/(\d+(?:\.\d+)?)\s*ml\b/gi, (_, num) => {
        return convertVolume(parseFloat(num), settings.volume)
    })
 
    return text
}
 