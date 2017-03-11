const Base64Params = [
    "parameters",
    "parameters.botId",
    "parameters.browser",
    "parameters.clientId",
    "parameters.contextType",
    "parameters.disableLanguageDetection",
    "parameters.extraParameters",
    "parameters.extraParameters.*",
    "parameters.language",
    "parameters.mode",
    "parameters.os",
    "parameters.solutionUsed",
    "parameters.space",
    "parameters.userId",
    "parameters.userInput",
    "parameters.userUrl",
    "parameters.variables",
    "parameters.variables.*",

    "values",
    "values.*"
]

const history = [];

let panel; // Going to hold the reference to panel.html's `window`

function decode(data, parent = []) {
    const parentParam = ((parent.length > 0) ? (parent.join(".") + ".") : "");

    for (let prop in data) {
        if (Base64Params.indexOf(parentParam + prop) !== -1 || Base64Params.indexOf(parentParam + "*") !== -1 || parentParam.indexOf("*") !== -1) {
            if (typeof data[prop] === "object") {
                parent.push((Base64Params.indexOf(parentParam + "*") !== -1) ? "*" : prop);

                data[prop] = decode(data[prop], parent);
            } else if (typeof data[prop] === "string") {
                try {
                    data[prop] = Base64.decode(data[prop]);
                } catch(error) {
                    data[prop] = data[prop];
                }
            }
        }
    }

    return data;
}

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
            if (har_entry.response.status >= 200 && har_entry.response.status < 300 && /^(dydu\.(.*)|angular)\.callbacks\._([0-9A-Za-z]*)\(/.test(content)) {
                const request = {
                    message  : decode(JSON.parse(parameters.data)),
                    response : decode(JSON.parse(content.replace(/^(dydu\.(.*)|angular)\.callbacks\._([0-9A-Za-z]*)\(/, "").slice(0, -1)))
                }

                if (panel === undefined)
                    history.push(request)
                else
                    panel.requestHandler(request);
            }
        });
    }
}

chrome.devtools.panels.create('DYDU', null, 'panel.html', (extensionPanel) => {
    extensionPanel.onShown.addListener((panelWindow) => {
        panel = panelWindow;

        for (let request of history)
            panel.requestHandler(request);
    }, { once: true });
});

chrome.devtools.network.onRequestFinished.addListener(requestHandler);