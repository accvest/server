const express = require("express")
const router = express.Router()
const checkJwt = require("../middleware/auth")
const Instance = require("../schema/Instance")

router.get("/status", async (req, res) => {
	try {
		const instanceCount = await Instance.countDocuments()
		res.json({
			message: "API is available",
			database: "connected",
			totalInstances: instanceCount,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		res.json({
			message: "API running but db might be cooked",
			error: error.message,
		})
	}
})

router.get("/instance", checkJwt, async (req, res) => {
	try {
		const sub = req.auth.payload.sub
		const email = req.auth.payload.email || req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`] || null

		if (!sub) {
			return res.status(400).json({ error: "no sub claim found in token" })
		}

		let instance = await Instance.findOne({ subId: sub })

		if (!instance) {
			instance = new Instance({
				subId: sub,
				email: email,
				instance_endpoint: null
			})
			await instance.save()
		}

		const status = instance.instance_endpoint ? "provisioned" : "unprovisioned"

		res.json({
			instance: {
				subId: instance.subId,
				instance_endpoint: instance.instance_endpoint,
				email: instance.email,
				createdAt: instance.createdAt
			},
			status: status
		})
	} catch (error) {
		console.error("Error processing instance:", error)
		res.status(500).json({ 
			error: "failed to process instance request",
			details: error.message 
		})
	}
})

module.exports = router