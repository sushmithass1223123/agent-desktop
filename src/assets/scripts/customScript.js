function processTMACChatMessage(message) {
    return message.split('_')[0];
}

function processTMACChatMessageUrl(channel, mime, url) {
    return new Promise((resolve, reject) => {
        try {
            switch (channel) {
                default:
                    console.log(`processTMACChatMessageUrl: ${channel} processing not implemented`);
                    resolve(url);
            }
        } catch (ex) {
            console.error(ex);
            resolve(url);
        }
    });
}
