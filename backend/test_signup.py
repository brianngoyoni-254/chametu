import json, time, urllib.request, urllib.error

email = f"trial-{int(time.time())}@example.com"
body = {
    "name": "Trial Tester",
    "email": email,
    "password": "TestPass123",
    "phone": "0712345678",
    "chama_name": "Trial Test Chama",
    "tier": "Growth",
}
print("Using email:", email)
print()

req = urllib.request.Request(
    'http://localhost:5000/api/billing/signup/start-trial',
    data=json.dumps(body).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)

try:
    resp = urllib.request.urlopen(req)
    print("STATUS:", resp.status)
    print()
    print(json.dumps(json.loads(resp.read()), indent=2))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode())
