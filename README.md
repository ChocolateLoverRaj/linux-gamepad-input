## Goal
Control GPIO using any compatible bluetooth gamepad.

## Try it yourself
### Install
Make sure you have [Node.js](https://nodejs.org/en/) v16 (I used v16.17.0, I don't think earlier versions will work. Later versions will probably work) installed. [Download Node.js](https://nodejs.org/en/download/).

Install dependencies (usually with `npm i`)

Run the [examples](#examples)

### GPIO Setup
#### `joystickInput.js` 
Does not need a GPIO (I think it could work on any Linux device)

#### `autoConnect.js`
Has some LEDs and a button. The setup I did:
![Picture 0](https://raw.githubusercontent.com/ChocolateLoverRaj/linux-gamepad-input/499f6723a65de8b9e6352093d6183e7d53b78263/autoConnectPicture0.jpg)
![Picture 1](https://raw.githubusercontent.com/ChocolateLoverRaj/linux-gamepad-input/499f6723a65de8b9e6352093d6183e7d53b78263/autoConnectPicture1.jpg)

### Env vars
The examples need some environmental variables. You can copy the `example.env` file to `.env` and then customize (like if you use differnet GPIO pins).

### Running Example
```sh
node autoConnect.js
```

## Examples
### `joystickInput.js`
- Watches for gamepads being connected and disconnected
- Outputs events for every gamepad when you press a button or move an axis

### `autoConnect.js`
- Interacts with GPIO
- Bluetooth light turns on when gamepad is connected
- Pressing button 0 (which is A on the Xbox controller I used) turns on the yellow output light
- Pressing the button will scan for bluetooth devices and automatically try to connect to any gamepad. Currently only recognizes `Xbox Wireless Controller`, but if there is another gamepad name you use you can add it and make a pull request. Because of [this bug in `node-ble`](https://github.com/chrvadala/node-ble/issues/36) you will have to connect the controller fast. After around 20 seconds the code will crash.
