const history = [];
const url     = document.createElement("a");

let editor;

function decode(data) {
    for (let prop in data) {
        if (typeof data[prop] === "object")
            decode(data[prop]);
        else if (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(data[prop]))
            data[prop] = Base64.decode(data[prop]);
    }
}

function updateMonaco(value) {
    value = JSON.stringify(value, null, 4);

    if (editor === undefined) {
        editor = monaco.editor.create(document.querySelector("#container"), {
            language             : "json",
            readOnly             : true,
            scrollBeyondLastLine : false,
            theme                : "vs-dark",
            value                : value
        });
    } else {
        editor.setValue(value);
    }
}

chrome.devtools.panels.sources.createSidebarPane('test', function(sidebar) {
        // sidebar initialization code here
        sidebar.setObject({ some_data: "Some data to show" });
});

chrome.devtools.network.onRequestFinished.addListener((har_entry) => {
    url.href = har_entry.request.url

    if (url.pathname.substr(url.pathname.length - 8) === "chatHttp" && url.search.length > 1) {
        const parameters = {};

        for (let i = 0, params = url.search.substr(1).split("&"); i < params.length; i++) {
            let separator = params[i].indexOf("=");

            let param = params[i].slice(0, separator);
            let data  = params[i].slice(separator + 1);

            parameters[decodeURIComponent(param)] = data.length > 1 ? decodeURIComponent(data) : "";
        }

        const data = JSON.parse(parameters.data);

        decode(data);

        history.push(data);

        const button = document.createElement('button');

        button.innerText = history.length;

        button.addEventListener('click', () => {
            updateMonaco(data);
        }, false);

        document.querySelector("#history").appendChild(button);

        updateMonaco(data)
    }
});