class CubeTimer {
    constructor () {
        // Data
        this.scramble = generateScramble()
        this.start_time = -1
        this.time = -1
        this.solves = this.getSavedSolves() || [] 
        this.entry = null

        // State
        this.canStart = false
        this.holding = false
        this.running = false

        this.entryInfoVisible = false
        this.timeout = null
        this.oneTime = false
        
        // Elements
        this.scrambleText = document.getElementById("scramble")
        this.timerText = document.getElementById("timer")
        this.entries = document.getElementById("entries")
        this.toolBarArrow = document.getElementById("tool-bar-arrow")

        this.entryInfo = document.getElementById("entry-info")
        this.entryInfoContent = document.getElementById("entry-info-content")
        this.entryInfoTime = document.getElementById("entry-info-time")
        this.entryInfoScramble = document.getElementById("entry-info-scramble")
        this.entryInfoBadge = document.getElementById("entry-info-badge")
        this.entryInfoAddNote = document.getElementById("entry-info-add-note")
        this.entryInfoNote = document.getElementById("entry-info-note")
        this.entryInfoDate = document.getElementById("entry-info-date")

        this.averageStat = document.getElementById("average")
        this.averageFiveStat = document.getElementById("average-five")
        this.threeFiveStat = document.getElementById("three-five")
        this.bestThreeFiveStat = document.getElementById("best-three-five")

        // Initial
        this.scrambleText.innerText = this.scramble
        this.createEntries()
        this.graph = createGraph("stats-graph", formatToXY(this.solves))
        this.updateStats()

        // Event listeners

        // Scramble
        this.scrambleText.addEventListener("click", () => {
            if (!this.running) {
                this.scramble = generateScramble()
                this.scrambleText.innerText = this.scramble
            }
        })

        // Update timer when key or mouse down
        const timerDown = (event, mouse) => {
            if ((mouse || event.keyCode === 32) && event.target !== this.entryInfoNote) {
                if (this.running) {
                    // Stop timer
                    this.running = false
                } else {
                    // Timer held down, reset timer text
                    this.holding = true
                    this.updateTimerColor()
                    this.timerText.innerText = "0.00"
                    // Fire timeout only once
                    if (!this.oneTime) {
                        // If timer held down for 0.4s, timer can start
                        this.timeout = setTimeout(() => {
                            this.canStart = true
                            this.updateTimerColor()
                        }, 400)
                        this.oneTime = true
                    }
                }
            } 
        }

        document.addEventListener("keydown", timerDown.bind(event))
        this.timerText.addEventListener("mousedown", timerDown.bind(event, true))

        // Update timer when key or mouse update
        const timerUp = (event, mouse) => {
            if (mouse || event.keyCode === 32) {
                // Timer not held down
                this.holding = false
                this.updateTimerColor()
                this.oneTime = false
                // Start timer
                if (this.canStart) {
                    this.canStart = false
                    this.updateTimerColor()
                    this.startTimer()
                // Clear timeout
                } else {
                    clearInterval(this.timeout)
                }
            }
        }

        document.addEventListener("keyup", timerUp.bind(event))  
        this.timerText.addEventListener("mouseup", timerUp.bind(event, true))

        // Open entry info when add note clicked
        this.entryInfoAddNote.addEventListener("click", () => {
            this.openEntryInfo(true)
        })

        this.entryInfoNote.addEventListener("input", () => {
            this.saveEntryNote()
        })

        this.toolBarArrow.addEventListener("click", () => {
            if (this.entryInfoVisible) {
                this.closeEntryInfo()
            } else {
                this.openEntryInfo()
            }
        })
    }

    updateTimerColor() {
        if (this.canStart) {
            this.timerText.style.color = "#419e58" // Green
        } else if (this.holding) {
            this.timerText.style.color = "#ff363c" // Red
        } else {
            this.timerText.style.color = "black"
        }
    }

    startTimer() {
        this.running = true
        this.start_time = Date.now()
        // Time interval
        const interval = setInterval(() => {
            // Increment time
            this.time = round((Date.now() - this.start_time) / 1000, 2)
            this.timerText.innerText = formatTime(this.time)
            // Stop timer
            if (!this.running) {
                clearInterval(interval)
                // Add entry
                const entry = {
                    time: this.time,
                    scramble: this.scramble,
                    id: generateID(),
                    date: Date.now(),
                    note: ""
                }
                this.solves.push(entry)
                this.createEntries()
                this.updateEntryInfo()
                this.saveSolves()
                this.updateGraph()
                this.updateStats()
                // Reset
                this.scramble = generateScramble()
                this.scrambleText.innerText = this.scramble
            }
        }, 10)
    }

    createEntry(params) {
        // Entry
        const entry = document.createElement("div")
        entry.id = params.id
        entry.className = `entry ${params.selected ? "entry-selected" : ""}`

        // Number
        const entryNumber = document.createElement("div")
        entryNumber.append(params.number || this.solves.length)
        entryNumber.className = "entry-number"
        entry.append(entryNumber)

        // Time
        const entryTime = document.createElement("div")
        entryTime.append(formatTime(params.time))
        entryTime.className = "entry-time"
        entry.append(entryTime)

        // Delete
        const entryDelete = document.createElement("div")
        entryDelete.className = "lnr lnr-cross entry-delete"
        entry.append(entryDelete)

        // Thumb
        const entryThumb = document.createElement("div")
        // Add thumbs up to best time
        // Add thumbs down to worst time
        entryThumb.className = params.thumb && `entry-thumb lnr lnr-thumbs-${params.thumb}`
        entry.append(entryThumb)

        this.entries.insertBefore(entry, this.entries.childNodes[0])
        this.entryEventListeners(params.id)
    }

    entryEventListeners(id) {
        const entry = document.getElementById(id)
        const entryTime = entry.getElementsByClassName("entry-time")[0]
        const entryDelete = entry.getElementsByClassName("entry-delete")[0]

        // Delete entry
        entryDelete.addEventListener("click", () => {
            for (let i = 0; i < this.solves.length; i++) {
                if (this.solves[i].id === id) {
                    if (this.entry && this.solves[i].id === this.entry.id) {
                        this.entry = null
                        this.updateEntryInfo()
                    }
                    this.solves.splice(i, 1)
                    break
                }
            }
            this.saveSolves()
            this.updateGraph()
            this.updateStats()
            this.createEntries()
        })

        entryTime.addEventListener("click", () => {
            for (let i = 0; i < this.solves.length; i++) {
                if (this.solves[i].id === id) {
                    this.entry = this.solves[i]
                    this.openEntryInfo()
                    this.updateEntryInfo()
                }
            }
        })
    }

    createEntries() {
        this.entries.textContent = ""
        const times = this.solves.map(s => s.time)

        let best, worst
        if (times.length >= 2) {
            best = Math.min(...times)
            worst = Math.max(...times)
        }
        let oneBest = false
        let oneWorst = false

        for (let i = 0; i < this.solves.length; i++) {
            // Parameters
            let params = {
                time: this.solves[i].time,
                scramble: this.solves[i].scramble,
                id: this.solves[i].id,
                number: `${i + 1}.`,
            }

            // Last entry
            if (i === this.solves.length - 1) {
                params.selected = true
            }
            if ((this.solves[i].time === best && !oneBest) || this.solves.length === 1) {
                params.thumb = "up"
                oneBest = true
            } 
            if (this.solves[i].time === worst && this.solves.length >= 2 && !oneWorst && best !== worst) {
                params.thumb = "down"
                oneWorst = true
            }

            this.createEntry(params)
        }
    }

    updateEntryInfo() {
        const times = this.solves.map(s => s.time)
        if (this.entry) {
            this.entryInfoTime.innerText = formatTime(this.entry.time)
            this.entryInfoScramble.innerText = this.entry.scramble
            this.entryInfoContent.style.display = "block"

            // Sort times in increasing order
            const sortedTimes = times.sort((a, b) => a - b)
            for (let i = 0; i < sortedTimes.length; i++) {
                if (this.entry.time === sortedTimes[i]) {
                    this.entryInfoBadge.innerText = `${i + 1} / ${times.length}`
                    this.entryInfoBadge.style.visibility = "visible"
                    break
                }
            }
            if (this.entry.date) {
                console.log(new Date(this.entry.date))
                const date = new Date(this.entry.date)
                const formattedDate = date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                })
                const formattedTime = date.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                })
                this.entryInfoDate.innerText = `${formattedDate}, ${formattedTime}`
            } else {
                this.entryInfoDate.innerText = ""
            }

            if (this.entry.note || this.entryInfoNote.value) {
                this.openEntryInfo()
                this.entryInfoNote.value = this.entry.note
            } else {
                this.entryInfoAddNote.style.display = "flex"
                this.entryInfoNote.style.display = "none"
                this.entryInfoNote.value = ""
            }
        } else {
            this.entryInfoContent.style.display = "none"
        }
    }

    openEntryInfo(fullHeight) {
        fullHeight = fullHeight || (this.entry && this.entry.note)
        this.entries.style.height = fullHeight ? "170px" : "270px"
        this.entryInfo.style.height = fullHeight ? "205px" : "105px"
        this.entryInfo.style.border = "1px solid black"
        this.toolBarArrow.style.transform = "scaleY(-1)"
        this.entryInfoVisible = true

        if (fullHeight) {
            this.entryInfoAddNote.style.display = "none"
            this.entryInfoNote.style.display = "flex"
            if (this.entry && this.entry.note) {
                this.entryInfoNote.value = this.entry.note
            }
        } else {
            this.entryInfoAddNote.style.display = "flex"
            this.entryInfoNote.style.display = "none"
        }
    }

    closeEntryInfo() {
        this.entries.style.height = "375px"
        this.entryInfo.style.height = "0px"
        this.entryInfo.style.border = "1px solid transparent"
        this.entryInfo.style.borderTop = "1px solid black"
        this.toolBarArrow.style.transform = "scaleY(1)"
        this.entryInfoVisible = false
    }

    saveEntryNote() {
        if (this.entry) {
            for (let i = 0; i < this.solves.length; i++) {
                if (this.solves[i].id === this.entry.id) {
                    this.solves[i].note = this.entryInfoNote.value
                    this.saveSolves()
                    this.updateGraph()
                }
            }
        }
    }

    getSavedSolves() {
        try {
            return JSON.parse(localStorage.getItem("solves"))
        } catch (error) {
            return false
        }
    }

    saveSolves() {
        localStorage.setItem("solves", JSON.stringify(this.solves))
    }

    updateGraph() {
        this.graph.config.data.datasets[0].data = formatToXY(this.solves)
        this.graph.update()
    }

    updateStats() {
        const times = this.solves.map((e) => e.time)
        const L = times.length
        if (L > 0) {
            let sum = 0
            for (const time of times) {
                sum += time
            }
            this.averageStat.innerText = `Average: ${round(sum / L, 2)}`
        } else {
            this.averageStat.innerText = "Average:"
        }
        if (L >= 5) {
            let sum = 0
            let min = times[L - 1]
            let max = times[L - 1]
            for (let i = 0; i < 5; i++) {
                sum += times[L - 1 - i];
                max = Math.max(max, times[L - 1 - i])
                min = Math.min(min, times[L - i - 1])
            }
            const three_five = (sum - max - min) / 3
            let best_three_five = three_five
            for (let i = 0; i < L - 5; i++) {
                sum = 0
                min = times[i]
                max = times[i]
                for (let j = i; j < i + 5; j++) {
                    sum += times[j];
                    max = Math.max(max, times[j])
                    min = Math.min(min, times[j])
                }
                best_three_five = Math.min(best_three_five, (sum - max - min) / 3)
            }
            this.averageFiveStat.innerText = `Average of 5: ${round(sum / 5, 2)}`
            this.threeFiveStat.innerText = `3 of 5: ${round(three_five, 2)}`
            this.bestThreeFiveStat.innerText = `Best 3 of 5: ${round(best_three_five, 2)}`
        } else {
            this.averageFiveStat.innerText = "Average of 5:"
            this.threeFiveStat.innerText = "3 of 5:"
            this.bestThreeFiveStat.innerText = "Best 3 of 5:"
        }
    }
}