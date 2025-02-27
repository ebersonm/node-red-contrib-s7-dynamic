# S7 Dynamic Node for Node-RED

This is a dynamic Node-RED node designed for communication with Siemens S7 PLCs using the `node-snap7` library. It allows you to read and write data from various addresses (inputs, outputs, memory), dynamically handle connection parameters (IP, rack, slot), and more.

## Features

- **Dynamic Connection**: Supports dynamic connection to Siemens S7 PLCs by specifying IP, rack, and slot.
- **Input Reading**: Reads inputs based on specified addresses.
- **Memory Read/Write**: Reads and writes to memory addresses in the PLC.
- **Output Writing**: Supports writing to outputs by dynamically setting boolean values (true/false or 1/0).
- **Custom Address Parsing**: Handles custom address formats such as `M0.1` for memory addresses.

## Requirements

- Node-RED environment.
- Node.js (>= 12.x recommended).
- Siemens S7 PLC or compatible device.
- `node-snap7` library.


## Installation

To use this node, you must install the Node-RED contribution from the Node-RED palette or manually add it to your `package.json`:

``bash
`npm install node-red-contrib-s7-dynamic.`



## Example for Reading Inputs
``json
{
  "payload": {
    "type": "input",
    "ip": "192.168.0.1",
    "rack": 0,
    "slot": 1,
    "addresses": [1, 2, 3]
  }
}
## Example for Writing Outputs
``{
  "payload": {
    "type": "output",
    "ip": "192.168.0.1",
    "rack": 0,
    "slot": 1,
    "addresses": {
      "Q0": true,
      "Q1": false
    }
  }
}
## Example for Memory Read/Write
``{
  "payload": {
    "type": "memory",
    "ip": "192.168.0.1",
    "rack": 0,
    "slot": 1,
    "addresses": ["M0.1", "M10.0"]
  }
}

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Feel free to fork this repository, contribute to the code, and open pull requests with new features or bug fixes.

## Authors
Eberson M. - Creator - EbersonM

## Acknowledgements
Thanks to the developers of node-snap7 for the core library to interface with Siemens S7 PLCs.
Node-RED community for providing the platform for creating powerful IoT applications.






