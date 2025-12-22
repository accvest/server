# Discovery API Docs

## Base URL
```
http://localhost:3000
```

## Environment Variables Required
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/instance-discovery
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-audience
```

---

## Endpoints

### 1. Root
**GET** `/`

Returns basic api info and available endpoints

**Response:**
```json
{
	"message": "instance discovery API running",
	"endpoints": {
		"health": "/health",
		"status": "/api/status",
		"instance": "POST /api/instance (requires auth header)"
	},
	"timestamp": "2025-12-23T20:58:00.000Z"
}
```

---

### 2. Health Check
**GET** `/health`

Quick health check to verify server is running

**Response:**
```json
{
	"status": "server is alive no cap"
}
```

---

### 3. Status
**GET** `/api/status`

Returns api status and total instance count in database

**Response (Success):**
```json
{
	"message": "API is available",
	"database": "connected",
	"totalInstances": 42,
	"timestamp": "2025-12-23T20:58:00.000Z"
}
```

**Response (DB Error):**
```json
{
	"message": "API running but db might be cooked",
	"error": "connection timeout"
}
```

---

### 4. Instance Discovery
**GET** `/api/instance`

Main endpoint for instance discovery. Creates instance if doesn't exist, returns instance info with provisioning status.

**Headers:**
```
Authorization: Bearer <auth0_jwt_token>
```

**Request Body:**
```
None (GET request)
```

**Response (New Instance Created):**
```json
{
	"instance": {
		"subId": "auth0|abc123xyz",
		"instance_endpoint": null,
		"email": "user@example.com",
		"createdAt": "2025-12-23T20:58:00.000Z"
	},
	"status": "unprovisioned"
}
```

**Response (Existing Instance, No Endpoint):**
```json
{
	"instance": {
		"subId": "auth0|abc123xyz",
		"instance_endpoint": null,
		"email": "user@example.com",
		"createdAt": "2025-12-20T10:30:00.000Z"
	},
	"status": "unprovisioned"
}
```

**Response (Existing Instance, With Endpoint):**
```json
{
	"instance": {
		"subId": "auth0|abc123xyz",
		"instance_endpoint": "https://user-instance.example.com",
		"email": "user@example.com",
		"createdAt": "2025-12-20T10:30:00.000Z"
	},
	"status": "provisioned"
}
```

**Error Responses:**

Missing/Invalid Token (401):
```json
{
	"error": "unauthorized",
	"message": "no valid authorization token found"
}
```

No Sub Claim (400):
```json
{
	"error": "no sub claim found in token"
}
```

Server Error (500):
```json
{
	"error": "failed to process instance request",
	"details": "error message here"
}
```

---

## Status Logic

**provisioned:** `instance_endpoint` field has a value (not null/empty)
**unprovisioned:** `instance_endpoint` field is null or empty

---

## Database Schema

### Instance Collection
```javascript
{
	subId: String (required, unique) // auth0 sub claim
	instance_endpoint: String (default: null) // manually updated in db
	email: String (default: null) // extracted from jwt if available
	createdAt: Date (default: Date.now)
}
```

---

## Usage Example

### JavaScript/Fetch
```javascript
const token = "your_auth0_jwt_token"

fetch("http://localhost:3000/api/instance", {
	method: "GET",
	headers: {
		"Authorization": `Bearer ${token}`
	}
})
	.then(res => res.json())
	.then(data => console.log(data))
```

### cURL
```bash
curl -X GET http://localhost:3000/api/instance \
  -H "Authorization: Bearer your_auth0_jwt_token"
```

---

## Notes

- JWT token must be valid and signed by auth0
- Email extraction depends on auth0 token configuration
- instance_endpoint must be manually updated in mongodb
- No client secret needed, api only validates tokens