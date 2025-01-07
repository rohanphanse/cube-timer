// Utility functions

// Generate random integer between range
function randomInteger(max, min = 0) {
    return Math.floor(Math.random() * (max - min)) + min
}

function randomElement(array) {
    return array[randomInteger(array.length)]
}

// Generate random scramble
function generateScramble() {
    const notation = ["R", "U", "L", "D", "F", "B"]
    const scramble = []

    // 20 move scramble
    for (let i = 0; i < 20; i ++) {
        // Choose random move
        let e = randomElement(notation)
        if (i > 0) {
            // Ensure each move is different from last move
            while (scramble[i - 1].substring(0, 1) === e) {
                e = randomElement(notation)
            }
        }
        scramble.push(randomElement([e, `${e}'`, `${e}2`]))
    }

    return scramble.join(" ")
}

// Generate random ID
function generateID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Round number to given precision
function round(value, precision) {
    const power = Math.pow(10, precision || 0)
    return Math.round(value * power) / power
}

// Convert second to formatted time
function formatTime(seconds) {
    // Convert seconds to hours and minutes
    const hours = Math.floor(seconds / 3600)
    seconds -= hours * 3600
    const minutes = Math.floor(seconds / 60)
    seconds -= minutes * 60
    // Return formatted time
    if (hours) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`
    } else if (minutes) {
        return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`
    } else {
        return seconds.toFixed(2)
    }
}

function formatToXY(solves_data) {
    const data = []
    for (let i = 0; i < solves_data.length; i++) {
        data.push({
            x: i + 1,
            y: solves_data[i].time
        })
    }
    return data
}