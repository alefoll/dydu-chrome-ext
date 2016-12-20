const history = [];

function requestHandler(har_entry) {
    const url = document.createElement("a");

    url.href = har_entry.request.url;

    if (url.pathname.substr(url.pathname.length - 8) === "chatHttp" && url.search.length > 1) {
        const parameters = {};

        for (let i = 0, params = url.search.substr(1).split("&"); i < params.length; i++) {
            let separator = params[i].indexOf("=");

            let param = params[i].slice(0, separator);
            let data  = params[i].slice(separator + 1);

            parameters[decodeURIComponent(param)] = data.length > 1 ? decodeURIComponent(data) : "";
        }

        har_entry.getContent(function(content) {
            if (har_entry.response.status >= 200 && har_entry.response.status < 300 && /^(dydu\.(.*)|angular)\.callbacks\._([0-9][a-z]*)\(/.test(content)) {
                history.push({
                    sent     : JSON.parse(parameters.data),
                    response : JSON.parse(content.replace(/^(dydu\.(.*)|angular)\.callbacks\._([0-9][a-z]*)\(/, "").slice(0, -1))
                })
            }
        });
    }
}

chrome.devtools.panels.create('DYDU', null, 'panel.html', (extensionPanel) => {
    let _window; // Going to hold the reference to panel.html's `window`

    extensionPanel.onShown.addListener(function temp(panelWindow) {
        extensionPanel.onShown.removeListener(temp); // Run once only

        chrome.devtools.network.onRequestFinished.removeListener(requestHandler);

        _window = panelWindow;

        // Release queued data
        let request;

        while (request = history.shift())
            _window.requestHandler(request.sent, request.response);
    });
});

chrome.devtools.network.onRequestFinished.addListener(requestHandler);