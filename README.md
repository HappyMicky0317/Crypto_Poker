# crypto-poker
 
 Click here to view the [LIVE DEMO](https://troyshouse.poker/)

Features
---
* Texas Holdem no limit game implementation
* Casual Table Play
* Tournaments
* Admin management app
* Crypto payment gateway (DASH, ETH, BTC support)

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 
 tldr
 This software is a hobby/research project - you are allowed to use it for ANY purpose (including commercial) but the software is provided "as is" without ANY warranty of any kind. Online poker is restricted in some jurisdictions - do your research. **None of this code should be considered commercial-grade**
 
 ![screenshot](https://i.imgur.com/aLDDolt.png "Screenshot")
 ![screenshot](https://i.imgur.com/3jfNjfQ.png "Admin 1")
 ![screenshot](https://i.imgur.com/jUEddky.png "Admin 2")


Click here to view the [LIVE DEMO](https://troyshouse.poker/)




Technical Setup Instructions
---

Prerequisites
* node v10 or later
* mongodb
* typescript (`sudo npm i typescript -g`)
* aurelia (`sudo npm install aurelia-cli@0.34.0 -g`)
* `npm install --global --production windows-build-tools` (windows only)

Getting Started

1) Run the client
```
cd poker.ui
npm i
au run -w
```

*note, the client must be compiled prior to compiling the server due to shared class definitions*

2) Run the server
```
cd poker.engine
npm i
tsc
cp ../scripts/vagrant/game_server/install_files/game_server.env ./build/poker.engine/.env
cd ./build/poker.engine
node ./src/app.js
```

There are also ~300 unit tests for the engine.
```
cd poker.engine
npm test
```


Credits:

Thank you to [mdashx](https://github.com/mdashx) for [the inspiration](https://github.com/mdashx/pangea-poker-frontend) and the use of the background table images, cards and animation logic.
