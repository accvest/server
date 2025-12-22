const express = require("express")
const router = express.Router()
const checkJwt = require("../middleware/auth")
const Instance = require("../schema/Instance")

let managementToken = null
let tokenExpiry = null

async function getManagementToken() {
	if (managementToken && tokenExpiry && Date.now() < tokenExpiry) {
		return managementToken
	}

	const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: process.env.AUTH0_CLIENT_ID,
			client_secret: process.env.AUTH0_CLIENT_SECRET,
			audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
			grant_type: "client_credentials"
		})
	})

	const data = await response.json()
	managementToken = data.access_token
	tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000
	return managementToken
}

async function getUserEmail(sub) {
	try {
		const token = await getManagementToken()
		const response = await fetch(
			`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(sub)}`,
			{
				headers: { Authorization: `Bearer ${token}` }
			}
		)
		const data = await response.json()
		return data.email
	} catch (error) {
		console.error("failed to fetch email from auth0:", error.message)
		return null
	}
}

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

		if (!sub) {
			return res.status(400).json({ error: "no sub claim found in token" })
		}

		let instance = await Instance.findOne({ subId: sub })

		if (!instance) {
			const email = await getUserEmail(sub)
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