#!/Library/Frameworks/Python.framework/Versions/3.6/bin/python3

from flask import Flask, render_template, request
from lights import lights, dimmer
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/lights', methods=["POST", "GET"])
def lights_server():
    if request.method == "POST":
        data = request.get_json()
        lights(**data)
        return "it worked", 200

@app.route('/dimmer', methods=["POST", "GET"])
def dimmer_server():
    if request.method == "POST":
        data = request.get_json()
        dimmer(**data)
        return "it worked", 200

def main():
    while True:
        app.run(host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()
