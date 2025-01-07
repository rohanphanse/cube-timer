const express = require("express")
const path = require("path")
const app = express()
const PORT = 3000

app.use((req, res, next) => {
    console.log(req.path)
    if (req.path.startsWith("/node_modules") || req.path == "/package.json" || req.path == "/package-lock.json") {
        return res.status(403).send('Forbidden');
    }
    next();
})
app.use(express.static(path.join(__dirname, "/")))

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})