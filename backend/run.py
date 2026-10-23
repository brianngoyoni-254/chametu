# run.py
from app import create_app

app = create_app()

if __name__ == "__main__":
    # host="0.0.0.0" so 127.0.0.1 AND localhost both reach it
    app.run(host="0.0.0.0", port=5000, debug=True)