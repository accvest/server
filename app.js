require("dotenv").config({ quiet: true })
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB connected fr fr"))
	.catch((err) => console.error("MongoDB connection failed bro:", err))

app.use("/api", require("./routes/api"))

app.use((err, req, res, next) => {
	if (err.name === 'UnauthorizedError' || err.name === 'InvalidRequestError') {
		return res.status(401).json({
			error: "unauthorized",
			message: "no valid authorization token found"
		})
	}
	
	res.status(500).json({
		error: "server error",
		message: err.message
	})
})

app.get("/", (req, res) => {
	res.json({
		message: "instance discovery API running",
		endpoints: {
			health: "/health",
			status: "/api/status",
			instance: "GET /api/instance (requires auth header)",
		},
		timestamp: new Date().toISOString(),
	})
})

app.get("/health", (req, res) => {
	res.json({ status: "server is alive no cap" })
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})