const snap7 = require('node-snap7');

module.exports = function (RED) {
    function S7DynamicNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const client = new snap7.S7Client();
        let isProcessing = false;

        // Conectar ao PLC
        function connect(host, rack, slot) {
            return new Promise((resolve, reject) => {
                try {
                    client.ConnectTo(host, rack, slot, (err) => {
                        if (err) {
                            reject(new Error(`Connection error: ${client.ErrorText(err)}`));
                        } else {
                            resolve();
                        }
                    });
                } catch (e) {
                    reject(new Error(`Exception during connection: ${e.message}`));
                }
            });
        }

        // Ler byte de entrada (EBRead)
        function readInputByte(byteIndex) {
            return new Promise((resolve, reject) => {
                try {
                    client.EBRead(byteIndex, 1, (err, data) => {
                        if (err) reject(new Error(`Error reading input byte ${byteIndex}: ${client.ErrorText(err)}`));
                        else resolve(data);
                    });
                } catch (e) {
                    reject(new Error(`Exception in readInputByte: ${e.message}`));
                }
            });
        }

        // Ler byte da memória (MBRead)
        function readMemoryByte(byteIndex) {
            return new Promise((resolve, reject) => {
                try {
                    client.MBRead(byteIndex, 1, (err, data) => {
                        if (err) reject(new Error(`Error reading memory byte ${byteIndex}: ${client.ErrorText(err)}`));
                        else resolve(data);
                    });
                } catch (e) {
                    reject(new Error(`Exception in readMemoryByte: ${e.message}`));
                }
            });
        }

        // Ler byte de saída (ABRead)
        function readOutputByte(byteIndex) {
            return new Promise((resolve, reject) => {
                try {
                    client.ABRead(byteIndex, 1, (err, data) => {
                        if (err) reject(new Error(`Error reading output byte ${byteIndex}: ${client.ErrorText(err)}`));
                        else resolve(data);
                    });
                } catch (e) {
                    reject(new Error(`Exception in readOutputByte: ${e.message}`));
                }
            });
        }

        // Escrever byte na saída (ABWrite)
        function writeOutputByte(byteIndex, data) {

            return new Promise((resolve, reject) => {
                try {
                    client.ABWrite(byteIndex, data.length, data, (err) => {
                        if (err) reject(new Error(`Error writing output byte ${byteIndex}: ${client.ErrorText(err)}`));
                        else resolve();
                    });
                } catch (e) {
                    reject(new Error(`Exception in writeOutputByte: ${e.message}`));
                }
            });
        }

        // Converter endereços "M0.1" e "Q0" para byte/bit index
        /*
        function parseAddress(address, type) {
            let match;
            if (type === 'memory') match = address.match(/^M(\d+)\.(\d+)$/);
            else if (type === 'output') match = address.match(/^Q(\d+)$/);
            else match = address.match(/^I(\d+)$/);

            if (!match) throw new Error(`Invalid ${type} address format: ${address}`);

            const byteIndex = parseInt(match[1], 10);
            const bitIndex = type === 'memory' ? parseInt(match[2], 10) : byteIndex % 8;

            if (bitIndex < 0 || bitIndex > 7) throw new Error(`Invalid bit index in ${type} address: ${address}`);

            return { byteIndex: type === 'output' ? Math.floor(byteIndex / 8) : byteIndex, bitIndex };
        }
        */
        function parseAddress(address, type) {
            let match;
            if (type === 'input') match = address.match(/^I(\d+)$/);
            else if (type === 'memory') match = address.match(/^M(\d+)\.(\d+)$/);
            else if (type === 'output') match = address.match(/^Q(\d+)$/);

            if (!match) throw new Error(`Invalid ${type} address format: ${address}`);

            const bitIndex = parseInt(match[1], 10);  // Pega o número após 'I' (bitIndex direto)
            const byteIndex = Math.floor(bitIndex / 8); // Calcula em qual byte está o bit

            return { byteIndex, bitIndex: bitIndex % 8 };
        }




        // Ler entradas e memória
        async function readData(msg, type) {
            const { ip, rack, slot, addresses } = msg.payload;

            if (!ip || rack === undefined || slot === undefined || !Array.isArray(addresses) || addresses.length === 0) {
                node.send({ payload: { error: `Invalid ${type} parameters` } });
                return;
            }

            let results = {};

            try {
                await connect(ip, rack, slot);

                for (let addr of addresses) {
                    let { byteIndex, bitIndex } = parseAddress(addr, type);

                    let byteValue = type === 'input' ? await readInputByte(byteIndex) : await readMemoryByte(byteIndex);
                    //let bitValue = (byteValue[0] & (1 << bitIndex)) !== 0;
                    let bits = byteValue[0].toString(2).padStart(8, '0').split('').reverse();
                    let bitValue = bits[bitIndex] === '1';
                    results[addr] = bitValue;
                }

                msg.payload = results;
                node.send(msg);
            } catch (error) {
                node.log(`Error reading ${type}: ${error.message}`);
                msg.payload = { error: error.message };
                node.send(msg);
            } finally {
                client.Disconnect();
            }
        }

        // Escrever nas saídas
        async function writeOutputs(msg) {
            const { ip, rack, slot, addresses } = msg.payload;

            if (!ip || rack === undefined || slot === undefined || typeof addresses !== "object") {
                node.send({ payload: { error: "Invalid output parameters" } });
                return;
            }

            try {
                await connect(ip, rack, slot);

                let byteMap = {}; // Armazena bytes modificados

                // Validar os valores de "addresses"
                for (let addr in addresses) {
                    const bitValue = addresses[addr];

                    // Garantir que o valor seja true, false, 1 ou 0
                    if (![true, false, 1, 0].includes(bitValue)) {
                        node.send({ payload: { error: `Invalid value for address ${addr}. Only true, false, 1, or 0 are allowed.` } });
                        return;
                    }

                    let { byteIndex, bitIndex } = parseAddress(addr, 'output');

                    if (!(byteIndex in byteMap)) {
                        let byteValue = await readOutputByte(byteIndex);
                        byteMap[byteIndex] = byteValue[0];
                    }

                    // Atualizar o valor do bit
                    if (bitValue) byteMap[byteIndex] |= (1 << bitIndex);
                    else byteMap[byteIndex] &= ~(1 << bitIndex);
                }

                // Escrever bytes modificados
                for (let byteIndex in byteMap) {
                    let data = Buffer.from([byteMap[byteIndex]]);

                    await writeOutputByte(parseInt(byteIndex, 10), data);
                }

                node.send({ payload: { success: true } });

            } catch (error) {
                node.log(`Error writing outputs: ${error.message}`);
                node.send({ payload: { error: error.message } });
            } finally {
                client.Disconnect();
            }
        }




        // Processar mensagens recebidas
        node.on('input', async function (msg) {
            if (isProcessing) {
                node.warn("Ignoring message, another operation is in progress.");
                return;
            }

            isProcessing = true;
            try {
                if (msg.payload.type === 'input') {
                    await readData(msg, 'input');
                } else if (msg.payload.type === 'memory') {
                    await readData(msg, 'memory');
                } else if (msg.payload.type === 'output') {
                    await writeOutputs(msg);
                }
            } catch (e) {
                node.log(`Error in input processing: ${e.message}`);
                msg.payload = { error: `Error in input processing: ${e.message}` };
                node.send(msg);
            } finally {
                isProcessing = false;
            }
        });

        // Limpeza ao fechar o nó
        node.on('close', function () {
            client.Disconnect();
        });
    }

    RED.nodes.registerType("s7-dynamic", S7DynamicNode);
};
