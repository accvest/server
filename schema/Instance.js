const mongoose = require('mongoose')

const instanceSchema = new mongoose.Schema({
	subId: {
		type: String,
		required: true,
		unique: true
	},
	instance_endpoint: {
		type: String,
		default: null
	},
	email: {
		type: String,
		default: null
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Instance', instanceSchema)