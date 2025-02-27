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

```bash
npm install node-red-contrib-s7-dynamic
