const pb = require("protobufjs");
const net = require('net');

let olaRoot;
let rpcRoot;

pb.load("Ola.proto")
    .then(function (root) {
        console.log('Ola.proto loaded');
        olaRoot = root;
        const RegisterDmxRequest = olaRoot.lookupType('ola.proto.RegisterDmxRequest');
        const DmxData = olaRoot.lookupType('ola.proto.DmxData');
        pb.load('Rpc.proto').then((root) => {
            console.log('Rpc.proto loaded');
            rpcRoot = root;
            const RpcMessage = rpcRoot.lookupType('ola.rpc.RpcMessage');

            // Connect to olad running on localhost:9010

            const client = net.createConnection({ port: 9010 }, () => {
                // 'connect' listener.
                console.log('connected to server!');

                // See https://github.com/protobufjs/protobuf.js#using-proto-files
                const registerBuffer = RegisterDmxRequest.encode(
                    RegisterDmxRequest.create(
                        { universe: 1, action: 1 }
                    )
                ).finish();
                console.log('registerBuffer:', registerBuffer);

                
                const rpcBuffer = RpcMessage.encode(
                    RpcMessage.create(
                        {type: 1, id: 1, name: 'RegisterForDmx', buffer: registerBuffer}
                    )
                ).finish();

                // Append version + length (4 byte)
                const header = new ArrayBuffer(4);
                const view1 = new DataView(header);


                view1.setUint8(0, Buffer.byteLength(rpcBuffer));
                view1.setUint8(3, 0x10);


                console.log('Header:', header);
                console.log('rpcBuffer:', rpcBuffer);


                const finalBuffer = Buffer.concat([Buffer.from(header), rpcBuffer]);

                console.log('finalBuffer:', finalBuffer);

                client.write(finalBuffer);
            });
            client.on('data', (data) => {
                console.log(data.toString());

                // First 4 byte are the header. For the moment, ignore it
                const resp = data.slice(4);
                console.log('Response:', resp);

                const respMessage = RpcMessage.decode(resp);
                console.log(respMessage);

                try {
                    const DmxBuffer = DmxData.decode(respMessage.buffer);
                    // THIS IS WHAT YOU WANT :)
                    console.log(DmxBuffer);
                    // THIS IS WHAT YOU WANT :)
                } catch (e) {

                }

            });
            client.on('end', () => {
                console.log('disconnected from server');
            });

        })
    });
