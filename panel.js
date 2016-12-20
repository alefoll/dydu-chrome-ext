let history = 1;

let editorSent;
let editorResponse;

function updateMonaco(sent, response) {
    sent     = JSON.stringify(sent,     null, 4);
    response = JSON.stringify(response, null, 4);

    if (editorSent === undefined) {
        editorSent = monaco.editor.create(document.querySelector("#editorSent"), {
            language             : "json",
            readOnly             : true,
            scrollBeyondLastLine : false,
            theme                : "vs-dark",
            value                : sent
        });
    } else {
        editorSent.setValue(sent);
    }

    if (editorResponse === undefined) {
        editorResponse = monaco.editor.create(document.querySelector("#editorResponse"), {
            language             : "json",
            readOnly             : true,
            scrollBeyondLastLine : false,
            theme                : "vs-dark",
            value                : response
        });
    } else {
        editorResponse.setValue(response);
    }
}

function decode(data) {
    for (let prop in data) {
        if (typeof data[prop] === "object")
            decode(data[prop]);
        else if (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(data[prop]))
            data[prop] = Base64.decode(data[prop]);
    }

    return data;
}

chrome.devtools.network.onRequestFinished.addListener((har_entry) => {
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
            if (har_entry.response.status >= 200 && har_entry.response.status < 300 && /^(dydu\.(.*)|angular)\.callbacks\._([0-9][a-z]*)\(/.test(content))
                requestHandler(JSON.parse(parameters.data), JSON.parse(content.replace(/^(dydu\.(.*)|angular)\.callbacks\._([0-9][a-z]*)\(/, "").slice(0, -1)));
        });
    }
});

function requestHandler(sent, response) {
    const button = document.createElement('button');

    button.innerText = history++;

    button.addEventListener('click', (event) => {
        const active = document.querySelector('.active');

        if (active !== null)
            active.classList.remove('active');

        event.target.classList.add('active');

        updateMonaco(decode(sent), decode(response));
    }, false);

    document.querySelector("#history").appendChild(button);

    const buttons = document.querySelectorAll("#history button");

    if (buttons.length === 1 || buttons[buttons.length - 2].classList.contains('active'))
        buttons[buttons.length - 1].click();
}