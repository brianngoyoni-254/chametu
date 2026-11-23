import json, urllib.request, urllib.error

# Log in as the trial user (now expired)
body = {
    "email": "trial-1795421789@example.com",
    "password": "TestPass123",
}
req = urllib.request.Request(
    'http://localhost:5000/api/auth/login',
    data=json.dumps(body).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
login = json.loads(urllib.request.urlopen(req).read())
token = login['token']
print("Login OK, token length:", len(token))
print("Login trial payload:", login.get('trial'))
print()

# Hit a gated endpoint
req = urllib.request.Request(
    'http://localhost:5000/api/chama/members',
    headers={'Authorization': f'Bearer {token}'},
)
try:
    resp = urllib.request.urlopen(req)
    print("!!! UNEXPECTED SUCCESS:", resp.status)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP STATUS:", e.code)
    print(e.read().decode())
