import os, json, urllib.request, urllib.error

email = os.environ['EMAIL']
pw    = os.environ['PASS']

# 1) Login
req = urllib.request.Request(
    'http://localhost:5000/api/auth/login',
    data=json.dumps({'email': email, 'password': pw}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
try:
    login = json.loads(urllib.request.urlopen(req).read())
except urllib.error.HTTPError as e:
    print("LOGIN FAILED:", e.code)
    print(e.read().decode())
    raise SystemExit(1)

token = login.get('token', '')
print("TOKEN length:", len(token))
print("USER:", login.get('user', {}).get('name'), "/", login.get('user', {}).get('role'))
print("CHAMA:", login.get('chama', {}).get('name'))
print()

# 2) Trial status
req = urllib.request.Request(
    'http://localhost:5000/api/billing/trial/status',
    headers={'Authorization': f'Bearer {token}'},
)
try:
    trial = json.loads(urllib.request.urlopen(req).read())
except urllib.error.HTTPError as e:
    print("STATUS CALL FAILED:", e.code)
    print(e.read().decode())
    raise SystemExit(1)

print(json.dumps(trial, indent=2))
