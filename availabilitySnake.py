from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import json
import os

AVAILABILITY_SNAKE_PORT = 52525

app = Flask(__name__)
CORS(app)

@app.route('/')
def front_end():
    return send_from_directory('', 'availabilitySnake.html')

@app.route('/script.js')
def script_js():
    return send_from_directory('', 'script.js')

@app.route('/run_command', methods=['POST'])
def run_command():
    cmd = json.loads(request.data.decode("utf-8"))["command"]
    print("Executing " + cmd)
    os.system(cmd)
    return jsonify(statusCode=200), 200

if __name__ == '__main__':
    app.run(host="localhost", port=AVAILABILITY_SNAKE_PORT, debug=True)